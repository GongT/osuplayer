(function(window,Kinetic,$){
"use strict";
/* - ./playosb/core/_proto.js - */
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

	createDebugContextMenu(container, this);
}

OsuPlayer.background_regex =
OsuPlayer.prototype.background_regex = /^(\d+,\d+),"(.+?)"(|,\d+,\d+)$/gm;

OsuPlayer.layers = ['Background', 'Fail', 'Pass', 'Foreground'];
OsuPlayer.workingLayers = {'Background': 0, 'Fail': 1, 'Pass': 2, 'Foreground': 3};

/* - ./playosb/core/avcontrol.js - */
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
			//console.log('seeked')
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

/* - ./playosb/core/setfile.js - */
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
		this.osd.label('OsbFile')('FAIL! ' + fileName);
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

/* - ./playosb/core/setter.js - */
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

/* - ./playosb/debug/context_menu.js - */
function createDebugContextMenu($item, self){
	var menuid = 'osuplaydebug-' + Date.now();
	var $menu = $('<menu>', {id: menuid, type: 'context'}).insertAfter($item);
	$item.attr('contextmenu', menuid);

	var $dbg = $('<menuitem label="启动调试"/>').appendTo($menu).click(function (){
		self.debug(!self.isDebugModeEnabled);
		if(self.isDebugModeEnabled){
			$dbg.attr('label', '关闭调试模式');
		} else{
			$dbg.attr('label', '开启调试模式');
		}
	});
	$('<menuitem label="切换OSD显示"/>').appendTo($menu).click(function (){
		testPlayer.osd.hide()
	});
	$('<menuitem label="放大"/>').appendTo($menu).click(function (){
		var $canvas = $item.find('canvas[height]');
		var current = parseInt($canvas.attr('height'));
		if(current){
			self.setSize(current + 50);
		}
	});
	$('<menuitem label="缩小"/>').appendTo($menu).click(function (){
		var $canvas = $item.find('canvas[height]');
		var current = parseInt($canvas.attr('height'));
		if(current && current > 200){
			self.setSize(current - 50);
		}
	});
	$('<menuitem label="全屏"/>').appendTo($menu).click(function (){
		self.fullscreen();
	});

	if($menu.css('margin')){ // 显示出来了……说明不支持
		if(DebugMenuCss){
			$(DebugMenuCss).appendTo('head');
			DebugMenuCss = '';
		}
		$menu.hide().addClass('OsuPlayerDebugMenu')
		/*.click(function (){
		 $menu.hide();
		 });*/
		$item.on('contextmenu', function (e){
			e.preventDefault();
			$menu.css({left: e.pageX, top: e.pageY}).show();
			$(document).one('click', function (){
				$menu.hide();
			});
		});
	}
}

/* - ./playosb/debug/debug.js - */
var debugMode = false;
OsuPlayer.prototype.debug = function (status){
	if(arguments.length == 0){
		status = true;
	}
	if(status && !debugMode){
		OsuPlayer.debug(status);
	}
	if(this.isDebugModeEnabled == status){
		console.error('already%s in debug mode.', this.isDebugModeEnabled? '' : ' not');
		return;
	}

	this.isDebugModeEnabled = status;
	this.reload();

	var objects = this._osb_objects.objects;
	if(status){
		this.debugFormWnd = window.open(undefined, 'osuplayerdebug', 'width=1800,height=800');
		var doc = this.debugFormWnd.document;
		doc.body.innerHTML = '';

		$(DebugWindowCss, doc).appendTo(doc.body);
		var $debug_form = buildDebugForm(objects, doc);
		var path = location.href.replace(/[^\/]*$/, '') + this.downloader.base.replace(/^\.\//, '');
		$('td.file', doc).each(function (_, td){
			$('<img class="view"/>', doc).attr('src', path + td.innerHTML.replace(/\\/g, '/')).prependTo(td);
		});

		OsuPlayer.debug_object = function (lastTime, kImage, data){
			kImage._dbg_td_s.innerHTML = data;
		};
		OsuPlayer.debug_display_time = (function (time){
			this.innerHTML = time;
		}).bind($debug_form.find('.extra .time')[0]);
	} else{
		this.debugFormWnd.close();
		console.info('Debug End');
		clearInterval(this.debugInterval);
		this.stage.draw();
	}
};

OsuPlayer.debug = function (is_debug){
	window.selected = {};
	debugMode = is_debug;
	if(is_debug){
		console.log('Entering debug mode\n' +
					'\tuse [instance object].debug(); to debug a player.\n' +
					'\t`window.selected` will store your last clicked object.\n' +
					'');
	}
};

function buildDebugForm(objs, document){
	var $holder = $('<div id="ObjectStatusDebug"/>', document).appendTo(document.body);
	var html = '<table class="table table-bordered table-hover" border="0">' +
			   '<thead><tr><th title="z-index 显示序列">ID(z)</th><th>图片路径</th>' +
			   '<th>层</th><th>显示区间</th><th>显示</th><th>状态</th></tr>' +
			   '</thead><tbody>';
	objs.forEach(function (obj, index){
		var data = {
			'zIndex'    : obj.zIndex,
			'file'      : obj.imageList[0]._src,
			'layer'     : OsuPlayer.layers[obj.layer].substr(0, 4),
			'timerange' : '' + obj.startTime + '~' + obj.endTime,
			'is_visable': '',
			'status'    : ''
		};
		html += '<tr class="' + (obj._isVisible? 'visable' : 'none-visable') + '">';
		for(var k in data){
			html += '<td class="' + k + '">' + data[k] + '</td>';
		}
		html += '</tr>';
		obj._dbg_line = index;
	});
	html += '</tbody></table>';
	html += '<div class="extra">' +
			'CurrentTime：<span class="time">--</span>,' +
			'<span onclick="document.querySelector(\'table\').classList.toggle(\'filter\')" style="float:right">toggleDisplay</span>' +
			'</div>';

	$holder.html(html);

	var $trlist = $holder.find('tbody>tr');
	var $tlist1 = $trlist.find('>td.status');
	var $tlist2 = $trlist.find('>td.visable');
	objs.forEach(function (obj){
		obj._dbg_td_s = $tlist1[obj._dbg_line];
		obj._dbg_td_v = $tlist2[obj._dbg_line];
		obj._dbg_tr = $trlist[obj._dbg_line];
		obj.isObjDebug = true;
	});

	$.merge($holder, $('<div id="ObjectStatusDebugSpace"/>', document).appendTo('body'));
	return $holder;
}

/* - ./playosb/debug/debug_css.js - */
var DebugWindowCss = 
	"<style type=\"text/css\">body{padding-bottom:200px}#ObjectStatusDebug{width:100%}#ObjectStatusDebug td:last-child{width:50%;white-space:pre}table tr:hover .file{overflow:visible}table tr:hover .file .view{z-index:1000;background:#00f;outline:#f00 2px solid}table tr .file{position:relative;overflow:hidden;color:#000;font-size:18px;font-weight:bold;text-shadow:1px 1px 3px #fff;background:rgba(255,255,255,0.64)}table tr .file .view{width:100%;position:absolute;left:0;top:0;z-index:-1}table tr.none-visable .is_visable:before{content:'no'}table tr.visable .is_visable:before{content:'YES'}table.filter tr.none-visable{display:none}.extra{position:fixed;bottom:0;right:0;left:0;background:#fff;border-top:#000 solid 2px}.extra .time{color:#f00;font-weight:bold}table{border-spacing:0;border-collapse:collapse}td,th{padding:0}table{max-width:100%;background-color:transparent}th{text-align:left}.table{width:100%;margin-bottom:20px}.table>thead>tr>th,.table>tbody>tr>th,.table>tfoot>tr>th,.table>thead>tr>td,.table>tbody>tr>td,.table>tfoot>tr>td{padding:8px;line-height:1.42857143;vertical-align:top;border-top:1px solid #ddd}.table>thead>tr>th{vertical-align:bottom;border-bottom:2px solid #ddd}.table>caption+thead>tr:first-child>th,.table>colgroup+thead>tr:first-child>th,.table>thead:first-child>tr:first-child>th,.table>caption+thead>tr:first-child>td,.table>colgroup+thead>tr:first-child>td,.table>thead:first-child>tr:first-child>td{border-top:0}.table>tbody+tbody{border-top:2px solid #ddd}.table .table{background-color:#fff}.table-condensed>thead>tr>th,.table-condensed>tbody>tr>th,.table-condensed>tfoot>tr>th,.table-condensed>thead>tr>td,.table-condensed>tbody>tr>td,.table-condensed>tfoot>tr>td{padding:5px}.table-bordered{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>tbody>tr>td,.table-bordered>tfoot>tr>td{border:1px solid #ddd}.table-bordered>thead>tr>th,.table-bordered>thead>tr>td{border-bottom-width:2px}.table-striped>tbody>tr:nth-child(odd)>td,.table-striped>tbody>tr:nth-child(odd)>th{background-color:#f9f9f9}.table-hover>tbody>tr:hover>td,.table-hover>tbody>tr:hover>th{background-color:#f5f5f5}</style>"	;
var DebugMenuCss = 
	"<style type=\"text/css\">menu.OsuPlayerDebugMenu{margin:0;position:absolute;min-width:120px;background:#fff;padding:5px 0;border:1px solid rgba(0,0,0,0.15);border-radius:4px;box-shadow:0 6px 12px rgba(0,0,0,0.175);color:#333;font-size:14px}menu.OsuPlayerDebugMenu>*{display:list-item;list-style:none;padding:5px 5px;cursor:pointer}menu.OsuPlayerDebugMenu>*:hover{background:#428bca;color:#fff}menu.OsuPlayerDebugMenu>*:before{content:attr(label) ''}</style>"	;

/* - ./playosb/display/osd.js - */
function OnScreenDisplay(stage){
	this.layer = new Kinetic.Layer();
	this._stage = stage;
	this.offset = 0;
	this.items = {};
	this.show();
}
OnScreenDisplay.prototype.cleanUp = function (){
	this.layer.removeChildren();
	this.items = {};
	this.offset = 0;
};
OnScreenDisplay.prototype.toggle = function (){
	if(this.isShow){
		this.hide();
	} else{
		this.show();
	}
};
OnScreenDisplay.prototype.hide = function (){
	this.layer.remove();
	this.isShow = false;
};
OnScreenDisplay.prototype.show = function (){
	this._stage.add(this.layer);
	this.layer.show().moveToTop();
	this.isShow = true;
};

OnScreenDisplay.prototype.label = function (label){
	if(this.items.hasOwnProperty(label)){
		return this.items[label];
	}
	var labelText = label + ': ';
	var val = new Kinetic.Text({
		text         : labelText + '-',
		x            : 5,
		y            : 5 + this.offset,
		fill         : '#555',
		shadowColor  : 'white',
		shadowBlur   : 3,
		shadowOffset : .5,
		shadowOpacity: .7,
		fontStyle    : 'bold'
	});
	this.offset += 20;
	this.layer.add(val);
	return this.items[label] = function (new_val){
		val.setText(labelText + new_val);
	};
};

/* - ./playosb/display/primary_render.js - */
/*
 本文件定义主渲染器（重绘计时器）
 提供函数
 initRender - 音乐播放时启动计时器
 stopRender - 音乐暂停时终止计时器
 都没有外部接口，不能调用
 */
var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
					   window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
					   window.msRequestAnimationFrame ||
					   function (/* function */ callback/*, DOMElement */){
						   // Fallback method, 120 fps.
						   return window.setTimeout(callback, 1000/120);
					   };
var cancelRequestAnimFrame = window['cancelAnimationFrame'] || window.webkitCancelRequestAnimationFrame ||
							 window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame ||
							 window.msCancelRequestAnimationFrame || clearTimeout;

function initRender(player){
	/**
	 * 所有时间单位毫秒， osb开始位置为 0点（就是音乐0秒）
	 * current_time  当前时间（距离0点）
	 * anime_flag 起始时间，内部变量
	 * anime_start 本次播放的起始位置，用来处理播放器滚动条
	 */
	var current_time = 0 , anime_flag = 0 , anime_start = 0;
	var anime_timing = false , fps_timer = 0, frame_count = 0;

	var loadingMessage = player.loadingMessage,
			stage = player.stage,
			$stage = player.$stage,
			osd = player.osd,
			mainAudio = player.mainAv.get('audio');

	var showFps = osd.label('FPS');

	function beginRender(){
		if(!player.osbData){
			loadingMessage.text('Playing...').opacity(true);
			stage.draw();
			return;
		}
		if(anime_timing){
			return;
		}
		loadingMessage.hide();
		osd.show();
		if(!player._loaded){
			player.reload();
		}
		osd.show();
		$stage.startRender(120);
		anime_timing = requestAnimFrame(___playFunc);
		fps_timer = setInterval(function (){
			showFps(frame_count);
			frame_count = 0;
		}, 1000);
	}

	function stopRender(){
		if(!player.osbData){
			loadingMessage.opacity(false);
			stage.draw();
			return;
		}
		if(!anime_timing){
			return;
		}
		if(!player._loaded){
			player.reload();
		}
		// osd.hide();
		loadingMessage.show();
		$stage.stopRender();
		clearInterval(fps_timer);
		anime_timing = false;
		anime_flag = 0;
		fps_timer = 0;
		frame_count = 0;
	}

	function ___playFunc(time){
		frame_count++;
		if(anime_flag){
			time = time - anime_flag + anime_start;
			current_time = Math.floor(time);
			player.render(current_time);
		} else{ // 特殊处理第一帧
			anime_start = mainAudio.currentTime*1000;
			anime_flag = time;
			time = time - anime_flag + anime_start;
			current_time = Math.floor(time);
			// console.log('MUST full render!');
			player.fullRender(current_time);
		}
		if(anime_timing){
			anime_timing = requestAnimFrame(___playFunc);
		} else{
			console.info('animation abort')
		}
	}

	return {begin: beginRender, end: stopRender};
}

/* - ./playosb/display/stagecontrol.js - */
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

/* - ./playosb/imagedraw/render_frame.js - */
/*
 本文件包含绘制函数
 fullRender - 重新绘制time时刻的画面，播放器seek的时候调用
 可以在外部调用
 */
OsuPlayer.prototype.fullRender = function (time){
	if(!this.osbData){
		return;
	}
	var bo = this._osb_objects;
	time = time.toFixed();

	// 显示当前位置该显示的，其他都隐藏
	bo.current = [];
	bo.objects.forEach(function (obj){
		if(time < obj.endTime && time >= obj.startTime){
			obj.visable(true);
			bo.current[obj.zIndex] = obj;
		} else{
			obj.visable(false);
		}
	});

	// 判断当前时间点，前一个帧和下一帧
	var fId = bo.frame_set.length - 1;
	var fTime = bo.frame_set[fId];
	this.lastFrame = bo.main_frames[fTime];
	for(fId = fId - 1; fId >= 0; fId--){
		// 从N-1帧开始，如果这一帧未播放，那么继续前推
		fTime = bo.frame_set[fId];
		if(fTime > time){
			this.nextFrame = this.lastFrame;
			this.lastFrame = bo.main_frames[fTime];
		} else{ // 如果这一帧为已经播放的，那么 lastFrame=这一帧 nextFrame=下一帧，然后退出循环
			break;
		}
	}

	this.render(time);

	if(this.isDebugModeEnabled){
		console.log('render request ok, time=%s', time);
		OsuPlayer.debug_display_time(time);
		this.$stage.K.draw();
	}
};

/* - ./playosb/imagedraw/render_state.js - */
/*
 本文件包含绘制函数
 render - 绘制time时刻的画面，不能跨关键帧绘制
 A [c] B C [t] D
 当前在c，跳到t是做不到的

 可以在外部调用，一般会用到（外部通常可能用到fullRender）
 */
OsuPlayer.prototype.render = function (time){
	if(this.isDebugModeEnabled){
		OsuPlayer.debug_display_time(time);
	}

	var bo = this._osb_objects;
	var current_frame = this.lastFrame;
	var next_frame = this.nextFrame;
	if(!current_frame){
		return this.fullRender(time); // 要初始化
	}
	if(next_frame){ // 如果还有下一帧，检查是不是该换了
		if(time >= next_frame.time){
			this.lastFrame = next_frame;
			next_frame.place.forEach(function (obj){
				bo.current[obj.zIndex] = obj;
			});
			next_frame.remove.forEach(function (obj){
				obj.visable(false);
				delete bo.current[obj.zIndex];
			});
			
			this.nextFrame = next_frame.next;

			if(this.isDebugModeEnabled){
				console.log('!%d\t! 关键帧 %d -> %d , current visable: %s', time, this.lastFrame.time, next_frame.time, bo.current.length);
			}
		} // else { console.log('普通帧 [%d]', time); }
	}
	var idx = 0;
	bo.current.forEach(function (obj){
		obj.visable(true);
		obj.setState(time);
		obj._image.setZIndex(idx);
		idx++;
	});
};

/* - ./playosb/network/downloader.js - */
function Downloader(basePath){
	Downloader.base = basePath || './';
}

Downloader.prototype.progress = $.noop;

Downloader.prototype.get = function (file, option){
	if(!option){
		option = {};
	}
	this.progress('download: ' + file);
	option.url = this.base + file;
	return $.ajax(option);
};
Downloader.prototype.getAll = function (fileArray, option){
	var dfd = new $.Deferred();
	var base = this.base;
	var success_file = {};
	var failed_file = [];
	var self = this;
	var count = fileArray.length;

	this.progress('download: 0/' + count);
	if(!option){
		option = {};
	}

	fileArray.forEach(function (file){
		success_file[file] = false;
		option.url = base + file;
		$.ajax(option).then(function (ret){
			success_file[file] = ret;
			if(--count == 0){
				dfd.resolve(success_file, failed_file);
			}
		}, function (){
			failed_file.push(file);
			if(--count == 0){
				dfd.resolve(success_file, failed_file);
			}
			self.progress('download: ' + (fileArray.length - count) + '/' + fileArray.length);
		});
	});
	return dfd.promise();
};

/* - ./playosb/network/loadingmessage.js - */
/**
 *
 * @param stage
 * @returns {{text: Function, hide: Function}}
 * @constructor
 */
function LoadingMessage(stage){
	var rect = stage.getSize();
	var size = Math.min(rect.height, rect.width);
	var circle_size = size*2/3;
	var circle_pos = {x: rect.width/2, y: circle_size/2};
	var text_top = circle_size + 10;
	var anim = 0;
	var layer = new Kinetic.Layer();
	var TooLate = false;
	var background = new Kinetic.Image({
		x     : 0,
		y     : 0,
		height: rect.height,
		width : rect.width
	});
	var bgImg = new Image();
	bgImg.onload = function (){
		background.setImage(bgImg);
		stage.draw();
	};

	var circle = new Kinetic.Circle({
		x      : circle_pos.x,
		y      : circle_pos.y,
		radius : circle_size/3,
		fill   : 'pink',
		opacity: 1
	});
	var text = window.ktext = new Kinetic.Text({
		text    : 'Loading...',
		x       : 10,
		width   : rect.width - 20,
		y       : text_top,
		fill    : 'black',
		fontSize: 27,
		wrap    : 'char'
	});

	var osuImage = new Image();
	osuImage.onload = function (){
		circle.clearCache();
		circle.remove();
		circle = new Kinetic.Image({
			x      : circle_pos.x,
			y      : circle_pos.y,
			height : circle_size,
			width  : circle_size,
			offsetX: circle_size/2,
			offsetY: circle_size/2,
			image  : osuImage
		});
		layer.add(circle);
		anim = new Kinetic.Animation(function (frame){
			if(TooLate){
				circle.rotate(0);
			} else{
				circle.rotate(frame.timeDiff*Math.PI/1000);
			}
		}, layer);
		stage.draw();
		if(!TooLate){
			anim.start();
		}
	};
	osuImage.src = 'http://s.ppy.sh/images/head-logo.png';

	layer.add(background);
	layer.add(circle);
	layer.add(text);
	stage.add(layer);

	function resetLogo(){
		TooLate = true;
		if(anim){
			anim.stop();
		}
		circle.rotate(0);
		stage.draw();
		return ret;
	}

	var ret = {
		text      : function (t){
			// console.log('MSG : ', t);
			text.setText(t);
			stage.draw();
			return ret;
		},
		stop      : resetLogo,
		hide      : function (){
			circle.hide();
			text.hide();
			return resetLogo();
		},
		show      : function (){
			text.setFill('black');
			circle.show();
			text.show();
			return ret;
		},
		opacity   : function (is_op){
			circle.setOpacity(is_op? 0.4 : 1);
			text.setOpacity(is_op? 0.4 : 1);
		},
		fail      : function (){
			text.setFill('red');
			return resetLogo();
		},
		success   : function (){
			text.setFill('lime');
			stage.draw();
			return ret;
		},
		background: function (furl){
			if(furl){
				background.show();
				bgImg.src = furl;
			} else{
				background.hide();
			}
			return ret;
		},
		cleanUp   : function (){
			text.setText('OsbPlayer');
			text.setFill('black');
			background.setImage(new Image());
			return resetLogo();
		}
	};
	return ret;
}


/* - ./playosb/osb_commands/loopFunc.js - */
function getDataFnLoop(){
	return '';// do nothing
}

function resetFnLoop(){
	return '';// do nothing
}

function runAnimeFnLoop(cmd){
	// runAnimeFn
	var fn = OsbGenerator(cmd.subcommands, 0);
	return fn;
}

function cleanUpFnLoop(){
	return '';// do nothing
}

function setDataFnLoop(){
	return '';// set calc data
}

function calcCurrentFnLoop(conf, startTime){ // 计算百分比的语句
	return 'lastTime = lastTime%' + conf.duration + ';\n';
}

var loopFun = {
	setDataFn    : setDataFnLoop,
	getDataFn    : getDataFnLoop,
	resetFn      : resetFnLoop,
	runAnimeFn   : runAnimeFnLoop,
	cleanUpFn    : cleanUpFnLoop,
	calcCurrentFn: calcCurrentFnLoop
};

/* - ./playosb/osb_commands/main.js - */
function push_unique(array, value){
	if(array.indexOf(value) == -1){
		array.push(value);
	}
	return array;
}

function insert_with_order(target, key, obj){
	var r = 0;
	for(var i in target){
		var item = target[i];
		if(i < item.key){
			target.splice(r, 0, {key: key, value: obj})
		}
		r = i;
	}
}

function push_or_append(arr, val){
	var key = val.start + ',' + val.end;
	if(!arr.back){
		arr.back = {};
	}
	val.value = '\t' + val.value.replace(/\n/g, '\n\t') + '\n';
	if(arr.back[key]){
		arr[arr.back[key]].value += val.value;
	} else{
		arr.back[key] = arr.push(val) - 1;
	}
}

function OsbGenerator(commands, startTime){
	var mathFn = '';
	var unique_command_name = [];
	commands.forEach(function (conf){
		push_unique(unique_command_name, conf.name);
	});

	mathFn += CMDList.getDataFn(unique_command_name);// 生成所需变量定义

	var cmd_by_name = {};// , current_var_reg = {}, i = 0;
	commands.forEach(function (conf){
		if(!cmd_by_name[conf.name]){
			cmd_by_name[conf.name] = [];
		}
		// conf.varId = conf.startTime + '-' + conf.endTime;
		// current_var_reg[conf.varId] = 'cur' + conf.name + '_' + (i++);
		cmd_by_name[conf.name].push(conf);
	});

	/**
	 * 生成动画，每个动画函数的“已知”只有这个动画开始到当前的时间百分比
	 * X=100              X=200
	 * 0% --------------- 100%
	 *         ^ [current] (%=40, X=140)
	 */
	for(var cName in cmd_by_name){ // 每一种动画
		var l_op = [], r_op = [], c_op = [];
		mathFn += '\ndo{ // ALL ANIME OF ' + cName + '\n';

		// 下面这个foreach目的是给动画按时间排序（顺便生成动画函数的各个部分
		cmd_by_name[cName].forEach(function (conf){
			mathFn += '// ' + conf.debug_orig_command + '\n';
			var offsetStart = conf.start - startTime;
			var offsetEnd = conf.end - startTime;

			// 左侧操作 - 当前时间小于动画开始
			push_or_append(l_op, {
				start: offsetStart,
				end  : 0,
				value: CMDList.resetFn(conf)
			});

			// 中间操作 - 当前时间在动画开始结束之间
			push_or_append(c_op, {
				start: offsetStart,
				end  : offsetEnd,
				value: CMDList.calcCurrentFn(conf, startTime) + CMDList.runAnimeFn(conf)
			});
			// 右侧操作 - 当前时间大于动画结束
			push_or_append(r_op, {
				start: 0,
				end  : offsetEnd,
				value: CMDList.cleanUpFn(conf)
			});
		});

		var $else;
		/**
		 *    ------------***A***---------------***B***-----------
		 *      resetA      runA      cleanA      runB    cleanB
		 */
		/** L 从前向后比较每一个StartTime是否大于当前时间 | 最后 - 只剩下第一个动画之前的情况了
		 *    ===   =====    ======   animes
		 * ---A-----B-----*--C-----  timeline
		 *   ^ ( reset A )
		 */
		l_op.sort(function (objA, objB){
			return objA.start - objB.start;
		});

		/** C 挨个比较，没有顺序区别 | 首先 - 如果命中，直接退出
		 *    =A=   ==B==    ==C===   animes
		 * -----*------------------  timeline
		 *      ^ ( runing A )
		 */

		/** R 从后向前比较每一个EndTime是否小于当前时间 | 其次 - 没有动画中
		 *    ===   =====    ======   animes
		 * -----A-------B-*-------C  timeline
		 *                ^ ( clean B )
		 */
		r_op.sort(function (objA, objB){
			return objB.end - objA.end;
		});

		/* C */
		$else = [];
		c_op.forEach(function (obj){
			var smt = "if(lastTime>" + obj.start + " && lastTime<" + obj.end + "){ // C\n" +
					  "\t\t" + obj.value + '\n' +
					  '\t\tbreak;\n' +
					  '\t}';
			$else.push(smt);
		});
		if($else.length){
			mathFn += '\t' + $else.join('else ').replace(/\n/g, '\n\t') + '\n';
		}

		/* R */
		$else = [];
		r_op.forEach(function (obj){
			var smt = 'if(lastTime>=' + obj.end + '){ // R\n' +
					  '\t' + obj.value + '\n' +
					  '\tbreak;\n' +
					  '}';
			$else.push(smt);
		});
		if($else.length){
			mathFn += '\t' + $else.join('else ').replace(/\n/g, '\n\t') + '\n';
		}

		/* L */
		if(r_op[0].value){
			mathFn += r_op[0].value + ' // L';
		}
		$else = null;

		mathFn += '\n}while(false); // END WHILE\n';
	}

	mathFn += CMDList.setDataFn('kImage', unique_command_name);// 再把这些变量赋值给image

	return mathFn;
}

/* - ./playosb/osb_commands/simple_command_function.js - */
var OsbCompound = {
	L: loopFun
};

var ease_code = {
	'0': 'current', // linear
	'1': '100*Math.sin(current/100 * (Math.PI/2))', // ease out - cos
	'2': '100 - 100*Math.cos(current/100 * (Math.PI/2))' // ease in - sin
};

function getDataFn(cmds){
	var ret = '';
	cmds.forEach(function (name){
		var data = OsbCommands[name] || OsbCompound[name];
		if(!data){
			console.error("Unknown osB command: %s.", name);
			return;
		}
		if(data.length){
			var args = [];
			data.forEach(function (def){
				args.push(def.var);
			});
			if(args.length){
				ret += 'var ' + args.join(',') + ';\n';
			}
		} else if(data.getDataFn){
			ret += data.getDataFn(name);
		}
	});
	return ret;
}

function setDataFn(objName, cmds){
	var ret = '';
	cmds.forEach(function (name){
		var data = OsbCommands[name] || OsbCompound[name];
		if(data.length){
			data.forEach(function (def){
				ret += ' if(' + def.var + '!==undefined){\n';
				ret += '   ' + objName + '.' + def.setter + '(' + def.var + ');\n';
				ret += '}\n'
			});
			if(debugMode){
				ret += '   OsuPlayer.debug_object(lastTime,this, "';
				data.forEach(function (def){
					ret += def.setter + ': "+' + def.var + '+"\\n';
				});
				ret += '");\n';
			}
		} else if(data.setDataFn){
			ret += data.setDataFn(objName, name);
		}
	});
	return ret;
}

/** 动画初始状态
 * @param conf {{name: *, ease: *, start: *, end: *, args: Array, subcommands: Array, debug_orig_command: *}}
 */
function resetFn(conf){
	var ret = '';
	var data = OsbCommands[conf.name] || OsbCompound[conf.name];

	if(data.length){
		data.forEach(function (def){
			ret += def.var + ' = ' + JSON.stringify(START(conf, def)) + ';\n';
		});
	} else if(data.resetFn){
		ret += data.resetFn(conf);
	}

	return ret;
}

/**
 * @param conf {{name: *, ease: *, start: *, end: *, args: Array, subcommands: Array, debug_orig_command: *}}
 */
function runAnimeFn(conf){
	var ret = '';
	var data = OsbCommands[conf.name] || OsbCompound[conf.name];
	var ease = '(' + ease_code[conf.ease] + ')';
	if(!ease){
		console.error('unknown easing function: ' + conf.ease);
	}

	if(data.length){
		data.forEach(function (def){
			var start = START(conf, def);
			var end = END(conf, def);
			var delta = end - start;
			if(end === undefined || end === start){
				ret += def.var + '=' + start + ';\n';
			} else{
				ret += '//delta = ' + end + '-' + start + '\n';
				ret += def.var + '=' + start + '+' + delta + '*' + ease + ';\n';
			}
		});
	} else if(data.runAnimeFn){
		ret += data.runAnimeFn(conf);
	}

	return ret;
}

/** 动画结束状态
 * @param conf {{name: *, ease: *, start: *, end: *, args: Array, subcommands: Array, debug_orig_command: *}}
 */
function cleanUpFn(conf){
	var ret = '';
	var data = OsbCommands[conf.name] || OsbCompound[conf.name];

	if(data.length){
		data.forEach(function (def){
			ret += def.var + ' = ' + JSON.stringify(END(conf, def)) + ';\n';
		});
	} else if(data.cleanUpFn){
		ret += data.cleanUpFn(conf);
	}

	return ret;
}
function calcCurrentFn(conf, startTime){ // 计算百分比的语句
	if(OsbCompound[conf.name]){
		return OsbCompound[conf.name].calcCurrentFn(conf, startTime);
	} else{
		var offsetStart = conf.start - startTime;
		var duration = conf.end - conf.start;
		if(offsetStart){ // 开始时间与Object出现有间隔
			return 'current = (lastTime-' + offsetStart + ')/' + duration + ';\n';
		} else{ // 开始时间点与Object本身相同
			return 'current = lastTime/' + duration + ';\n';
		}
	}
}

function START(conf, def){
	var start = conf.args[def.argStart.pos];
	if(undefined === start){
		start = def.argStart.def;
	}
	return start;
}

function END(conf, def){
	return conf.args[def.argEnd.pos];
}

var CMDList = {
	setDataFn    : setDataFn,
	getDataFn    : getDataFn,
	resetFn      : resetFn,
	runAnimeFn   : runAnimeFn,
	cleanUpFn    : cleanUpFn,
	calcCurrentFn: calcCurrentFn
};

/* - ./playosb/osb_commands/simple_command_list.js - */
var OsbCommands = {
	F : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1}, setter: 'setOpacity', var: 'Fade'}
	],
	M : [
		{argStart: {pos: 0, def: 0}, argEnd: {pos: 2}, setter: 'setX', var: 'X'},
		{argStart: {pos: 1, def: 0}, argEnd: {pos: 3}, setter: 'setY', var: 'Y'}
	],
	MX: [
		{argStart: {pos: 0, def: 0}, argEnd: {pos: 1}, setter: 'setX', var: 'X'},
	],
	MY: [
		{argStart: {pos: 0, def: 0}, argEnd: {pos: 1}, setter: 'setY', var: 'Y'},
	],
	S : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1}, setter: 'setScaleX', var: 'scaleX'},
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1}, setter: 'setScaleY', var: 'scaleY'},
	],
	V : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 2}, setter: 'setScaleX', var: 'scaleX'},
		{argStart: {pos: 1, def: 1}, argEnd: {pos: 3}, setter: 'setScaleY', var: 'scaleY'},
	],
	R : [
		{argStart: {pos: 0, def: 1}, argEnd: {pos: 1, def: 1}, setter: 'setRotationDeg', var: 'rotate'},
	]
};

/* - ./playosb/parser/osb_commands.js - */
/**
 * @returns {*}
 */
function parseCommand(command, linNo){
	"use strict";
	command = command.replace(/\s/g, '');
	var c = command.split(',');
	for(var i = 0; i < c.length; i++){
		if(c[i] == ''){
			c[i] = undefined;
		} else if(c[i] == '0'){
			c[i] = 0;
		} else{
			c[i] = parseFloat(c[i]) || c[i].toUpperCase();
		}
	}

	var name = c.shift(), easing, starttime, endtime, loopcount;

	if(name == 'L' || name == 'T'){
		starttime = parseInt(c.shift());
		loopcount = c.shift() || 0;
		return {
			type              : 'compound',
			name              : name,
			start             : starttime,
			end               : 0,
			loop              : loopcount,
			subcommands       : [],
			debug_orig_command: '[' + linNo + '] ' + command
		};
	} else{
		easing = c.shift() || 0;
		starttime = parseInt(c.shift());
		endtime = parseInt(c.shift());
		return {
			type              : 'simple',
			name              : name,
			ease              : easing,
			start             : starttime,
			end               : endtime,
			args              : c,
			debug_orig_command: '[' + linNo + '] ' + command
		};
	}
}

function parseLoopCommand(cmd){
	// optimization_simplecommand(cmd.subcommands);
	var minStart = 99999;
	var maxEnd = 0;
	cmd.subcommands.forEach(function (c){ // 重新计算L的开始、结束时间
		if(!isNaN(c.start)){
			if(minStart > c.start){
				minStart = c.start;
			}
		}
		if(!isNaN(c.end)){
			if(maxEnd < c.end){
				maxEnd = c.end;
			}
		}
	});
	if(minStart < 99999 && maxEnd > 0){
		cmd.start = (cmd.start || 0) + minStart;
		maxEnd -= minStart;
		cmd.subcommands.forEach(function (c){ // 重新计算子命令的开始、结束时间
			if(isNaN(c.start)){
				c.start = 0;
			} else{
				c.start -= minStart;
			}
			if(isNaN(c.end)){
				c.end = maxEnd;
			} else{
				c.end -= minStart;
			}
		});
	} else{
		console.error('指令似乎没不正确，不能计算出开始、结束时间：%s', cmd.debug_orig_command);
	}

	cmd.duration = maxEnd;
	cmd.end = cmd.start + cmd.duration*cmd.loop;
}

/* - ./playosb/parser/osb_object.js - */
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
	var mathFn = 'function(current_time,lastTime){\nvar current;\n';

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

/* - ./playosb/parser/osb_optimize.js - */
// 有初始值问题，不能使用
function optimization_simplecommand(commands){
	for(var i = 0; i < commands.length; i++){ // 优化编辑器生成出来的指令
		if(commands[i].name == 'M'){
			if(commands[i].args[0] == commands[i].args[2]){ // X 相同，相当于MY
				commands[i].name = 'MY';
				commands[i].args[0] = commands[i].args[1];
				commands[i].args[1] = commands[i].args[3];
			} else if(commands[i].args[1] == commands[i].args[3]){ // Y相同，相当于MX
				commands[i].name = 'MX';
				commands[i].args[1] = commands[i].args[2];
			} else if(commands[i].args.length == 2){

			}
		}
		if(commands[i].name == 'V'){
			if(commands[i].args[0] == commands[i].args[1] && commands[i].args[2] == commands[i].args[3]){
				// 如果V缩放，X和Y方向起始、结束均互相相等，相当于S缩放
				commands[i].name = 'S';
				commands[i].args[1] = commands[i].args[2];
			}
		}
	}
}

function optimization_object(object, commands){
	/*
	 第一个M指令，起始位置直接给Object，防止闪烁（大概能提高性能？
	 前几个指令时间相同，则第一个M也可以直接给Object
	 */
	for(var i = 0; i < commands.length; i++){
		if(commands[i].name == 'L'){
			if(optimization_object(object, commands[i].subcommands)){
				return true;
			}
		}
		if(commands[i].start != commands[0].start){
			break;
		}
		if(commands[i].name == 'M'){
			object.x = commands[i].args[0];
			object.y = commands[i].args[1];
			if(debugMode){
				console.log('optimization %s cmd[%d] == M, value=(%s,%s)', object.path, i, object.x, object.y);
			}
			return true;
		}
		if(commands[i].name == 'MX'){
			object.x = commands[i].args[0];
			if(debugMode){
				console.log('optimization %s cmd[%d] == MX, value=%s', object.path, i, object.x);
			}
			return true;
		}
		if(commands[i].name == 'MY'){
			object.y = commands[i].args[0];
			if(debugMode){
				console.log('optimization %s cmd[%d] == MY, value=%s', object.path, i, object.y);
			}
			return true;
		}
	}
	return false;
}

/* - ./playosb/parser/osb_tokenize.js - */
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

/* - ./playosb/parser/osbparser.js - */
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

/* - ./playosb/parser/osuparser.js - */
function osuparser(osuData){
	var bgInfo = osuData.match(/^\[Events\]([\s\S]*?)^\[/m);
	if(bgInfo){
		bgInfo = OsuPlayer.background_regex.exec(bgInfo[1]);
		if(bgInfo){
			this.setBackground(bgInfo[2]);
		}
	}
}

/* - ./playosb/parser/parse_shim.js - */
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

/* - ./playosb/playosb.js - */
﻿OsuPlayer.prototype.destory = function (){
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


window.OsuPlayer = OsuPlayer;
})(window,Kinetic,jQuery);