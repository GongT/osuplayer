function full(v){
	return v;
}

function half(v){
	return v/2;
}

function none(v){
	return 0;
}

var offsetTypes = {
	TopLeft     : {x: none, y: none},
	TopCentre   : {x: half, y: none},
	TopRight    : {x: full, y: none},
	CentreLeft  : {x: none, y: half},
	Centre      : {x: half, y: half},
	CentreRight : {x: full, y: half},
	BottomLeft  : {x: none, y: full},
	BottomCentre: {x: half, y: full},
	BottomRight : {x: full, y: full}
};

function calcOffset(offType){
	var calcX = offsetTypes[offType].x;
	var calcY = offsetTypes[offType].y;
	return function (image){
		return [calcX(image.width), calcY(image.height)]
	}
}

function parsePath(path, index){
	var arr = path.split('.');
	var ext = '.' + arr.pop();
	var base = arr.join('.');
	return base + index + ext;
}

/**
 * @param object {{
	 *		layer   : {string},
	 *		origin  : {string},
	 *		path    : {string},
	 *		x       : {Number},
	 *		y       : {Number},
	 *	    commands: 
	 * }}
 * @param object.aniConf {{
	 *      frameCount  : {Number},
	 *      frameDelay  : {Number},
	 *      bLoopForever: {bool}
	 * }}
 * @param object.commands [{{
	 *      name       : {string},
	 *      ease       : {string},
	 *      start      : {Number},
	 *      end        : {Number},
	 *      args       : {Array},
	 *      subcommands: []
	 * }}]
 * @param object.commands.subcommands 跟commands结构一样，只是没有下一层sub
 * @constructor
 */
function OsbObject(object){
	this.requireImage = [];
	$.extend(this, object);
	if(object.aniConf){
		$.extend(this, object.aniConf);
		this.animeLength = object.aniConf.frameCount*object.aniConf.frameDelay;
	}
	this._isVisible = false;
}

/**
 * @param $stage {{StageControl}}
 */
OsbObject.prototype.setStage = function ($stage){
	this._layer = $stage.layer(this.layer);
	//   vv 这个变量在字符串中用到！
	var kImage = this._image = new Kinetic.Image({
		x      : this.x,
		y      : this.y,
		offsetX: 0,
		offsetY: 0
	});
	kImage.OsbObject = this;
	this._id = kImage._id;
	kImage.path = this.path;
	var offsetFn;
	if(this.origin == 'FillScreen'){
		offsetFn = calcOffset('TopLeft');
		kImage.setSize(640, 480);
	} else{
		offsetFn = calcOffset(this.origin);
	}
	var mathFn = 'function(current_time,lastTime){\n';

	// 分析动画和图片
	this.imageList = [];
	var img;
	if(this.aniConf){
		var frameCount = this.frameCount;
		var animeLength = this.animeLength;
		var loopForever = this.bLoopForever;
		var frameDelay = this.frameDelay;

		mathFn += '  if(lastTime > animeLength){\n' +
				  '      if(loopForever){\n' +
				  '          lastTime = lastTime%animeLength;\n' +
				  '      } else{\n' +
				  '          return;\n' +
				  '      }\n' +
				  '  }\n';

		var aniFn = [];
		for(var i = frameCount - 1; i >= 0; i--){ // 从后往前遍历，容易生成
			img = new Image();
			img._src = parsePath(this.path, i);
			this.requireImage.push(img);
			this.imageList.push(img);
			var showFrom = i*frameDelay;
			aniFn.push('if(lastTime>' + showFrom + '){\n' +
					   '  if(this.__current!==' + i + '){\n' +
					   '    img=this.imageList[' + i + '];\n' +
					   '    kImage.setImage(img);\n' +
					   '    kImage.setOffset(offsetFn(img));\n' +
					   '    this.__current=' + i + ';\n' +
					   '  }\n' +
					   '}');
		}
		mathFn += '\n' + aniFn.join(' else ') + '\n';
		aniFn = null;
	} else{
		img = new Image();
		img._src = this.path;
		this.requireImage.push(img);
		this.imageList.push(img);
		var onload = function (){
			/*console.log('Show image %s(%d,%d) offset:(%s)%d,%d position:%d,%d',
			 img._src, img.width, img.height, debug_, offsetFn(img)[0], offsetFn(img)[1], kImage.getX(), kImage.getY());*/
			kImage.setImage(img);
			kImage.setOffset(offsetFn(img));
		};
		img.addEventListener('load', onload);
	}

	// 分析动画、显示隐藏时间
	if(!this.commands.length){
		return false;
	}
	if(debugMode){
		console.log('new Object %s , %d-%d', this.path, this.startTime, this.endTime);
	}

	mathFn += OsbGenerator(this.commands, this.startTime);
	mathFn += '\n}';

	try{
		eval('this.___stateFn= ' + mathFn);
	} catch(e){
		console.groupEnd();
		console.groupEnd();
		console.error(mathFn);
		alert('发生严重错误');
		throw new Error('----------------');
	}
};

OsbObject.prototype.getImageRequire = function (){
	return this.requireImage;
};

OsbObject.prototype.setState = function (current_time){
	if(!this._isVisible){
		return;
	}
	this.___stateFn(current_time, current_time - this.startTime);
};
OsbObject.prototype.___stateFn = $.noop;

OsbObject.prototype.visable = function (visible){
	if(this._isVisible == visible){
		return;
	}
	if(visible){
		this._layer.add(this._image);
	} else{
		this._image.remove();
	}
	this._isVisible = visible;
	if(this.isObjDebug){
		this._dbg_tr.className = visible? 'visable' : 'none-visable';
	}
};
