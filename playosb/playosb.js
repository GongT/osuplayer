OsuPlayer.prototype.destory = function (){
	this.stopRender();
	this.mainAv.destroy();
	this.$stage.K.destroyChildren();
	this.$stage.K.destroy();
	this.container.replaceWith(this.container.clone(false, false));
	for(var i in this){
		if(this.hasOwnProperty(i)){
			delete this[i];
		}
	}
};

OsuPlayer.prototype.isReadyToPlay = function (must_never_stop){
	return this.mainAv[must_never_stop? 'canPlayThrough' : 'canPlay']();
};

OsuPlayer.prototype.readyToPlay = function (callback){
	if(this.readyState.all){
		callback(this);
	}
	this.ready_callback.push(callback);
};

OsuPlayer.prototype.checkReady = function (){
	// osu、music是必须的，osb是true或undefined均可、但不能是false
	var rs = this.readyState;
	if(rs.osu && rs.music && rs.osb !== false){
		if(this.mainAv.isPlaying()){
			return;
		}
		if(this.isDebugModeEnabled){
			console.log('播放器准备完毕，可以播放');
		}
		rs.all = true;
		for(var i in this.ready_callback){
			this.ready_callback[i](this);
		}
		this.reload();
		// this.loadingMessage.hide();
	} else{
		rs.all = false;
	}
};
OsuPlayer.prototype.unload = function (){

};

OsuPlayer.prototype.play = function (){
	this.mainAv.play();
};
OsuPlayer.prototype.pause = function (){
	this.mainAv.pause();
};
