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
