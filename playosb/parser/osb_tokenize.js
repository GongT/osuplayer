function tokenize(osb_list){
	var object_list = [];
	var last_object, last_command;
	osb_list.forEach(function (line, line_no){
		var curLine = line.replace(/(^[\s_]+|[\s_]+$)/g, '');
		if(!/\S/.test(curLine) || /^\/\//.test(curLine)){ // 空行、注释
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
		} else if(!last_object || curLevel == 0){
			/* 如果之前没出现过Object，或者行开头没空格，那么这一行有问题 */
			console.error('osb行无法解析: [%d] %s', line_no, curLine);
		} else{
			var command = parseCommand(curLine, line_no);
			if(curLevel == 1){ // 这一行是普通命令、复杂命令的开头
				last_command = command;
				last_object.commands.push(command);
			} else if(curLevel == 2){ // 这是复杂命令的内容
				if(!last_command || last_command.type !== 'compound'){
					/* 如果之前没出现过 CompoundCommand (L/T) ，那么这一行有问题 */
					console.error('osb行无法解析: [%d] %s', line_no, curLine);
				}
				last_command.subcommands.push(command);
			} else{ // 目前只有2级
				console.error('osb行无法解析: [%d] %s', line_no, curLine);
			}
		}
	});

	object_list.forEach(function (obj){ // 重新计算L命令的开始结束时间
		// optimization_simplecommand(obj.commands);
		var startTime = 999999;
		var endTime = 0;
		obj.commands.forEach(function (cmd){
			if(cmd.name === 'L'){
				parseLoopCommand(cmd);
			}
			startTime = Math.min(startTime, cmd.start);
			endTime = Math.max(endTime, cmd.end);
		});
		obj.startTime = startTime || 0;
		obj.endTime = endTime || 999999;
		optimization_object(obj, obj.commands);
	});
	return object_list;
}
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
