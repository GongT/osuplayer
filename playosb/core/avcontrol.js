var audioInstance = [], nowPlaying = null;

function VideoControl($parent){
	var $myAudio = this.$dom = $('<video/>').appendTo($parent);
	var myVideo = this.dom = $myAudio[0];
	myVideo.preload = 'metadata';
	myVideo.controls = false;
}

function AudioControl($parent){
	var self = this;
	var $myAudio = this.$dom = $('<audio/>').appendTo($parent);
	var myAudio = this.dom = $myAudio[0];
	audioInstance.push(myAudio);
	myAudio.preload = 'metadata';
	myAudio.controls = true;

	self.canPlay = false;

	$myAudio.on({
		'canplay'       : function (e){
			if(self.canPlay){
				e.stopImmediatePropagation();
				return false;
			}
			self.canPlay = true;
		},
		'canplaythrough': function (){
			// todo load video
		},
		'click'         : function (e){
			e.stopPropagation();
		},
		'play'          : function (){
			audioInstance.forEach(function (audio){
				if(audio != myAudio && !audio.paused){
					audio.pause();
				}
			});
			console.log('MusicControl: playing ' + myAudio.src);
			nowPlaying = myAudio;
		},
		'pause'         : function (){
			console.log('MusicControl: paused ' + myAudio.src);
			if(nowPlaying == myAudio){
				nowPlaying = null;
			}
		},
		'seeking'       : function (){
			this.pause();
		},
		'seeked'        : function (){
			console.log('seeked')
		}
	});
}

function AVControl(container){
	var $aContainer = container.find('.audio'), $vContainer = container.find('.video');
	if(!$aContainer.length){
		$aContainer = container;
	}
	if(!$vContainer.length){
		$vContainer = container;
	}
	this._audio = new AudioControl($aContainer);
	this._video = new VideoControl($vContainer);
}

AVControl.prototype.pause = function (){
	this._audio.dom.pause();
};
AVControl.prototype.play = function (){
	this._audio.dom.play();
};
AVControl.prototype.setAudio = function (file){
	this._audio.canPlay = false;
	this._audio.dom.src = file;
};
AVControl.prototype.setVideo = function (file){

};
AVControl.prototype.canPlayThrough = function (){
	return true;
};
AVControl.prototype.canPlay = function (){
	return true;
};
AVControl.prototype.isPlaying = function (){
	return this._audio.dom == nowPlaying;
};

AVControl.prototype.destroy = function (){
	this._audio.$dom.remove();
	this._video.$dom.remove();
};

AVControl.prototype.get = function (what){
	switch(what){
	case 'audio':
		return this._audio.dom;
	case '$audio':
		return this._audio.$dom;
	case 'video':
		return this._video.dom;
	case '$video':
		return this._video.$dom;
	default :
		throw new Error('AVControl: ' + what + '不存在。');
	}
};
