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
