OsuPlayer.prototype.setSize = function (new_height){
	this.$stage.setReso(new_height);
};
OsuPlayer.prototype.setBackground = function (path){
	this.loadingMessage.background(this.basePath + path);
};

OsuPlayer.prototype.setBasePath = function (new_base){
	if(new_base.substr(-1) != '/'){
		new_base += '/';
	}
	this.basePath = new_base;
	this.downloader.base = new_base;
};
