"use strict";

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
	console.log(objects[0]);
	debugger;

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
