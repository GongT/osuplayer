/**
 * 把config指定的配置应用到player
 * @param player {OsuPlayer}
 * @param config {Object}
 */
function init(player, config){
	if(player.isDebugModeEnabled){
		console.log('init player %Owith arg: %O', player, config);
	}
	$.extend(player, config);
	if(config['basePath']){
		player.setBasePath(config['basePath']);
	}
	if(config['osuName']){
		player.setOsuFile(config['osuName']);
	}
	if(config['osbName']){
		player.setOsbFile(config['osbName']);
	}
	if(config['osuData']){
		player.setOsuData(config['osuData']);
	}
	if(config['autoPlay']){
		player.readyToPlay(function (){
			player.mainAv.play();
		});
	}
	if(config['osbData']){
		player.setOsbData(config['osbData']);
	}

	//* 点击屏幕开始/暂停
	if(config['clickStart'] === false){
		player.container.off('click', handleScreenClick);
	} else{
		if(!player.container.click_handled){
			player.container.on('click', handleScreenClick);
			player.container.click_handled = true;
		}
	}
}

function handleScreenClick(e){
	e.stopPropagation();
	if(debugMode){
		return;
	}
	var pl = $(this).data('OsuPlayer');
	var maimAudio = pl.mainAv.get('audio');
	if(maimAudio.paused){
		if(pl.readyState.music){
			maimAudio.play();
		}
	} else{
		maimAudio.pause();
	}
}

function OsuPlayer(config){
	if(!config){
		console.error('must has a container.');
		throw new Error('construct fail.');
	}
	if(config.constructor && config.constructor == $){
		config = {container: config};
	}
	if(!config.container){
		console.error('must has a container.');
		throw new Error('construct fail.');
	}
	if(!config.basePath){
		config.audoPlay = false;
	}

	var container = this.container = $(config.container);
	if(container.data('OsuPlayer')){
		var p = container.data('OsuPlayer');
		init(p, config); // 对同一个container调用，则只改变其属性
		return p;
	} else{
		container.data('OsuPlayer', this);
	}

	var basePath = config.basePath;
	var $stageParent = container.find('.stage');
	if(!$stageParent.length){
		$stageParent = container;
	}

	var self = this;
	var $stage = this.$stage = new StageControl($stageParent[0]);
	var stage = this.stage = $stage.K;
	var loadingMessage = this.loadingMessage = new LoadingMessage($stage.K);
	var osd = this.osd = new OnScreenDisplay($stage.K);
	this.downloader = new Downloader(basePath);
	this.ready_callback = [];
	this.readyState = {};
	this.downloader.progress = function (v){
		loadingMessage.text(v)
	};

	var showTime = osd.label('Time');

	var mainAv = this.mainAv = new AVControl(container);
	var $mainAudio = mainAv.get('$audio'), mainAudio = mainAv.get('audio');

	var render = initRender(this);
	this.__render = render;

	$mainAudio.on({
		'loadstart'     : function (){
			self.readyState.music = false;
			self.checkReady();
		},
		'loadedmetadata': function (){
			loadingMessage.stop();
		},
		'play'          : function (){
			render.begin();
		},
		'pause'         : function (){
			render.end();
		},
		'timeupdate'    : function (){
			showTime(mainAudio.currentTime.toFixed(3));
		},
		'canplay'       : function (e){
			self.readyState.music = true;
			self.checkReady();
		},
		'seeked'        : function (){
			self.anime_flag = 0;
			if(self.osbData){
				self.fullRender(mainAudio.currentTime*1000);
			}
		}
	});

	this.init_config = config;
	init(this, config);
}

OsuPlayer.background_regex =
OsuPlayer.prototype.background_regex = /^(\d+,\d+),"(.+?)"(|,\d+,\d+)$/gm;

OsuPlayer.layers = ['Background', 'Fail', 'Pass', 'Foreground'];
OsuPlayer.workingLayers = {'Background': 0, 'Fail': 1, 'Pass': 2, 'Foreground': 3};
