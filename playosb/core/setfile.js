/*
 本文件提供
 setOsbData
 setOsbFile
 setOsuData
 setOsuFile
 四个函数，其作用如名称所示
 */
/**
 * 以字符串形式加载StoryBoard文件数据
 * @param osbData {string}
 */
OsuPlayer.prototype.setOsbData = function (osbData){
	if(!arguments[1]){
		this.osd.label('OsbFile')('from stream data.');
	}
	if(this.isDebugModeEnabled){
		console.log('osB file loaded...');
	}
	this.osbData = osbData.replace(/^\[Events\]$/mg, '') // 删除首行
			.replace(/^\s*\/\/.*$/mg, '').trim(); // 刪除注释

	this.readyState.osb = true;
	this.checkReady();
};

/**
 * 以字符串形式加载osu文件数据
 * @param osuData {string}
 */
OsuPlayer.prototype.setOsuData = function (osuData){
	if(!arguments[1]){
		this.osd.label('OsuFile')('from stream data.');
	}
	var music = osuData.match(/^\s*AudioFilename:(.*)$/m);
	if(music){
		music = this.basePath + $.trim(music[1]);
		this.mainAv.setAudio(music);
		this.osd.label('MusicFile')(music);
	} else{
		console.error('osuData中不包含AudioFilename！');
		this.mainAv.setAudio('');
		this.osd.label('MusicFile')('Error! not defined.');
	}

	var video = 'Video,0,"video.flv"';

	if(this.isDebugModeEnabled){
		console.log('osU file loaded...');
	}
	this.osuData = osuData;
	this.readyState.osu = true;
	this.checkReady();
};

OsuPlayer.prototype.setOsbFile = function (fileName){
	this.osbData = '';
	if(!fileName){ // 不指定等于清除
		this.readyState.osb = undefined;
		return;
	}
	this.readyState.osb = false;
	var self = this;
	this.downloader.get(fileName).then(function (ret){
		self.loadingMessage.text('download ok: ' + fileName);
		if(!self.osbData){ // 如果下载过程中调用其他函数填充osb，则取消本次
			self.osd.label('OsbFile')(fileName);
			self.setOsbData(ret, true);
		}
	}, function (){
		self.loadingMessage.fail().text('OSB download failed: ' + fileName);
		self.osd.label('OsbFile')('FAIL! ' + fileName);
		if(self.isDebugModeEnabled){
			console.error('osb文件下载失败');
		}
		self.readyState.osb = undefined; // osb不是必须的，没有也允许播放
	});
};
OsuPlayer.prototype.setOsuFile = function (fileName){
	this.osuData = '';
	this.readyState.osu = false;
	this.mainAv.setAudio('');

	var self = this;
	this.downloader.get(fileName).then(function (ret){
		self.loadingMessage.text('download ok: ' + fileName);
		if(!self.osuData){
			self.osd.label('OsuFile')(fileName);
			self.setOsuData(ret, true);
		}
	}, function (){
		self.loadingMessage.fail().text('OSU download failed: ' + fileName);
		self.osd.label('OsuFile')('FAIL! ' + fileName);
		if(self.isDebugModeEnabled){
			console.error('osu文件下载失败');
		}
	});
};
