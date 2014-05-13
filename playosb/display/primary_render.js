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
			loadingMessage.stop();
			loadingMessage.text('Playing...').opacity(true);
			stage.draw();
			return;
		}
		loadingMessage.hide();
		
		if(anime_timing){
			return;
		}
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
			loadingMessage.text('Paused...').opacity(false);
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
