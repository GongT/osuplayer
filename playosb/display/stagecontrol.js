function StageControl($parent){
	var stage = new Kinetic.Stage({
		container: $parent,
		width    : 640,
		height   : 480
		/* http://osu.ppy.sh/wiki/Storyboarding
		 * A Storyboard (SB) is a custom-made 640x480 animated background ...
		 * */
	});
	if(!stage){
		alert('Unable to create stage.');
		throw new Error('Unable to create stage.');
	}
	this.layers = {};
	this.K = stage;
}

StageControl.prototype.layer = function (id){
	if(!this.layers[id]){
		this.layers[id] = new Kinetic.Layer();
		this.K.add(this.layers[id]);
	}
	return this.layers[id];
};
StageControl.prototype.layerExist = function (id){
	return this.layers.hasOwnProperty(id);
};
StageControl.prototype.layerRemove = function (id){
	if(this.layers.hasOwnProperty(id)){
		this.layers[id].removeChildren();
		this.layers[id].remove();
		delete this.layers[id];
		this.K.draw();
	}
};

StageControl.prototype.setReso = function (newHeight){
	var b = { w: 640, h: 480 }, zoom = parseInt(newHeight)/b.h;
	for(var x in b){
		b[x] *= zoom;
	}
	this.K.setScale(zoom);
	this.K.setWidth(b.w);
	this.K.setHeight(b.h);
	/*container.css({
	 height: b.h,
	 width : b.w
	 });*/
};

StageControl.prototype.stopRender = function (){
	clearTimeout(this._timer);
};
StageControl.prototype.startRender = function (target_fps){
	if(!target_fps){
		target_fps = 60;
	}
	var stage = this.K;
	this._timer = setInterval(function (){
		stage.draw();
		// console.log('redraw')
	}, 1000/target_fps);
};
