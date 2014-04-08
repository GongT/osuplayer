"use strict";
/**
 * @param defines.1 图片or动画
 * @param defines.2 显示在哪一层
 * @param defines.3 对齐
 * @param defines.4 图片地址
 * @param defines.5 X
 * @param defines.6 Y
 * @param defines.7 图片or动画
 * @param defines.8 图片or动画
 * @param defines.9 图片or动画
 * @returns {{layer: *, origin: *, path: *, x: number, y: number, aniConf: {frameCount: number, frameDelay: number, bLoopForever: boolean}}}
 */
function generateObject(defines){
	var aniConf;
	if(defines[1] == 'Animation'){
		aniConf = {
			frameCount  : Number(defines[8]),
			frameDelay  : Number(defines[9]),
			bLoopForever: defines[10] == 'LoopForever'
		};
	} else{
		aniConf = false;
	}
	var layerindex = OsuPlayer.workingLayers[defines[2]];
	return {
		layer   : layerindex,
		origin  : defines[3],
		path    : defines[4],
		x       : Number(defines[5]),
		y       : Number(defines[6]),
		aniConf : aniConf,
		commands: []
	};
}

function optimization(object){
	if(!object.commands[0]){
		return;
	}
	var commands = object.commands;
	/*
	 第一个指令是M（移动）的时候，起始位置直接给Object，防止闪烁（大概能提高性能？
	 前几个指令时间相同，则第一个M也可以直接给Object
	 */
	for(var i = 0; i < commands.length; i++){
		if(commands[i].name == 'L'){
			break;
		}
		if(commands[i].startTime != commands[0].startTime){
			break;
		}
		if(commands[i].name == 'M'){
			if(debugMode){
				console.log('optimization %s cmd[%d] == M', object.path, i);
			}
			object.x = commands[i].args[0];
			object.y = commands[i].args[1];
			break;
		}
	}
	for(i = 0; i < commands.length; i++){
		if(commands[i].name == 'M'){
			if(commands[i].args[0] == commands[i].args[2]){ // X 相同，相当于MY
				commands[i].name = 'MY';
				commands[i].args[0] = commands[i].args[1];
				commands[i].args[1] = commands[i].args[3];
			} else if(commands[i].args[1] == commands[i].args[3]){ // Y相同，相当于MX
				commands[i].name = 'MX';
				commands[i].args[1] = commands[i].args[2];
			}
		}
		if(commands[i].name == 'V'){
			if(commands[i].args[0] == commands[i].args[1] && commands[i].args[2] == commands[i].args[3]){
				// 如果V缩放，X和Y方向起始、结束均互相相等，相当于S缩放
				commands[i].name = 'S';
				commands[i].args[1] = commands[i].args[2];
			}
		}
	}
}

/**
 * @param command
 * @returns {*}
 */
function parseCommand(command){
	"use strict";
	command = command.replace(/\s/g, '');
	var c = command.split(',');
	for(var i = 0; i < c.length; i++){
		if(c[i] == ''){
			c[i] = undefined;
		} else if(c[i] == '0'){
			c[i] = 0;
		} else{
			c[i] = parseFloat(c[i]) || c[i].toUpperCase();
		}
	}

	var name = c.shift(), easing, starttime, endtime, loopcount;

	if(name == 'L'){
		starttime = c.shift() || 0;
		loopcount = c.shift() || 0;
		return {
			type              : 'compound',
			name              : name,
			start             : starttime,
			end               : 0,
			loop              : loopcount,
			subcommands       : [],
			debug_orig_command: command
		};
	} else{
		easing = c.shift() || 0;
		starttime = c.shift() || 0;
		endtime = c.shift() || 0;
		return {
			type              : 'simple',
			name              : name,
			ease              : easing,
			start             : starttime,
			end               : endtime,
			args              : c,
			debug_orig_command: command
		};
	}
}

function tokenize(osb_list){
	var object_list = [];
	var last_object, last_command;
	osb_list.forEach(function (line, line_no){
		var curLine = line.replace(/(^[\s_]+|[\s_]+$)/g, '');
		if(!/\S/.test(curLine)){ // 空行
			return;
		}

		var curLevel = line.match(/^\s+/g);
		if(curLevel){
			curLevel = curLevel[0].length;
		} else{
			curLevel = 0;
		}
		var command_args = curLine.match(/(Sprite|Animation),(Background|Fail|Pass|Foreground),(TopLeft|TopCentre|TopRight|CentreLeft|Centre|CentreRight|BottomLeft|BottomCentre|BottomRight|FillScreen),"(.+?)",([\d-]+),([\d-]+)($|,([\d-]+),([\d-]+),(LoopForever|LoopOnce))/);

		if(command_args){ // 匹配了Object
			last_object = generateObject(command_args);
			last_object.zIndex = osb_list.length - line_no;
			object_list.push(last_object);
			last_command = null;
		} else{
			if(!last_object || curLevel == 0){
				/* 如果之前没出现过Object，或者行开头没空格，那么这一行有问题 */
				if(debugMode){
					console.error('osb行无法解析:', curLine);
				}
				return;
			}
			var command = parseCommand(curLine);
			if(curLevel == 1){
				last_command = command;
			} else{ // 目前只有2级
				if(!last_command){
					/* 如果之前没出现过Object，或者行开头没空格，那么这一行有问题 */
					if(debugMode){
						console.error('osb行无法解析:', curLine);
					}
				}
				last_command.subcommands = command;
			}
			last_object.commands.push(command);
		}
	});
	return object_list;
}

function osbparser(osbData){
	"use strict";
	var $stage = this.$stage;
	if(debugMode){
		console.groupCollapsed('Osb原始数据');
		console.log(osbData);
		console.groupEnd();
	}
	var osb_all_lines = osbData.replace(/\n\n/g, '\n').replace(/\n\n/g, '\n').replace(/,\s+/g, ',').replace(/,,/g, ',0,').split('\n');
	var objects = tokenize(osb_all_lines);

	objects.forEach(function (obj){
		optimization(obj);
	});

	/**var loopStart = 0, loopCount = 0, timeOffset = 0, spaceOffset = -1, parsedArgs = [
	 ], tmp, thisLine, curHi, tmpHi, curArgs;
	 var thisIndexLayer = osbLayers[currentLayerIndex][thisIndex];
	 */

	var ret = {
		main_frames: {},
		objects    : [],
		current    : {},
		frame_set  : []
	};

	/**
	 * @param time
	 * @returns {{place: Array, remove: Array, next: null}}
	 */
	function frame(time){
		if(!ret.main_frames[time]){
			ret.frame_set.push(time);
			ret.main_frames[time] = {place: [], place_layers: [], remove: [], next: null, time: time};
		}
		return ret.main_frames[time];
	}

	objects.forEach(function (object){
		var obj = new OsbObject(object);
		ret.objects.push(obj);
	});

	if(debugMode){ /* debug */
		$stage.all_object = {};
	}

	ret.requireImages = [];
	ret.objects.forEach(function (obj){
		obj.setStage($stage);
		$.merge(ret.requireImages, obj.getImageRequire());
		frame(obj.startTime).place.push(obj);
		var l = frame(obj.startTime).place_layers;
		if(l.indexOf(obj._layer) === -1){
			l.push(obj._layer);
		}
		frame(obj.endTime).remove.push(obj);
		if(debugMode){ /* debug */
			$stage.all_object[obj.path] = obj;
			obj._image.on('click', function (){
				window.selected = obj;
				console.log('Selected Object! (access:window.selected) [%d]-[%d]-[%s]', obj._id, obj.zIndex, obj.path);
			});
		}
	}, this);

	ret.frame_set.sort(function (a, b){ //关系到下一帧在哪的判断
		return Math.floor(a - b);
	});

	ret.objects.sort(function (oa, ob){ // 关系到FullRender先显示谁（覆盖关系
		return ob.zIndex - oa.zIndex;
	}).forEach(function (o, index){
		o.zIndex = index;
	});
	if(debugMode){
		console.log('All Frames: %O', ret.frame_set);
	}

	for(var i = ret.frame_set.length - 1; i >= 0; i--){
		var fTime = ret.frame_set[i];
		var itr = ret.main_frames[fTime];
		var fTimeN = ret.frame_set[i + 1];
		itr.next = ret.main_frames[fTimeN];
		if(!itr.next){
			itr.last = true;
		}
	}

	return ret;
}
