/*
 本文件包含重新初始化的相关代码
 主要目的就是调用 osbparser 和 osuparser，附带清理资源等
 reload - 重新分析osu和osb文件
 */
function remixEvents(osu, osb){
	var osuEvent = osu.match(/^\[Events\]([\s\S]*?)^\[/m);
	if(osuEvent){
		// 把OsuData里背景行转换成osb指令，文件里Events部分合并
		osuEvent = osuEvent[1].replace(OsuPlayer.background_regex, 'Sprite,Background,FillScreen,"$2",$1\n S,0,0,999999,1\n');
		osb = osuEvent + '\n' + osb;
	}
	return osb;
}

OsuPlayer.prototype.reload = function (){
	"use strict";
	if(this.isDebugModeEnabled){
		console.log('player reload');
	}
	var self = this;
	var loadingMessage = this.loadingMessage;
	loadingMessage.show().text('parsing data...');

	/*
	 * Storyboard (Background), Storyboard L2 (Fail), Storyboard L2 (Pass), Storyboard Layer 3 (Foreground)
	 * */
	// 初始化4个层
	OsuPlayer.layers.forEach(function (name, index){
		var l = this.$stage.layer(index);
		l.removeChildren();
		l.moveToTop();
		if(self.isDebugModeEnabled){
			$(l.canvas._canvas).attr('role', name)
		}
	}, this);
	this.osd.show();

	this.readyState.image = false;

	if(this.osbData){
		if(this.isDebugModeEnabled){
			console.groupCollapsed('解析OSB文件内容');
		}
		var osb = remixEvents(this.osuData, this.osbData);
		var ob = this._osb_objects = osbparser.call(this, osb);

		var osd = this.osd;
		var finish = 0;
		osd.label('ImageFile')(finish + '/' + ob.requireImages.length);
		// 图片载入显示
		ob.requireImages.forEach(function (img){
			function onlod(){
				finish++;
				osd.label('ImageFile')(finish + '/' + ob.requireImages.length);
				img.removeEventListener('load', onlod);
				if(finish == ob.requireImages.length){
					self.readyState.image = true;
					loadingMessage.text('All OK').stop();
					self.stage.draw();
				} else{
					loadingMessage.text('imgload: ' + img.src);
					self.stage.draw();
				}
			}

			img.src = (this.basePath + img._src).replace(/\\/g, '/');
			img.addEventListener('load', onlod);
		}, this);
		// 图片载入显示 END
		if(this.isDebugModeEnabled){
			console.groupEnd();
		}
	} else{
		this._osb_objects = null;
	}
	this._osu_objects = osuparser.call(this, this.osuData);

	loadingMessage.success().text('complete...Press to start!');
	this._loaded = true;
};

OsuPlayer.prototype.reset = function (){
	this.readyState = {};
	this.__render.end();
	OsuPlayer.layers.forEach(function (name, index){
		var l = this.$stage.layer(index);
		l.removeChildren();
		l.moveToTop();
	}, this);
	this._osu_objects = this._osb_objects = this.osbData = this.osuData = null;
	this._loaded = false;
	this.osd.cleanUp();
	this.loadingMessage.cleanUp();
	this.mainAv.setAudio('');
};
