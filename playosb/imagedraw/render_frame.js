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
