// 调试用函数
var size = 400;
function testLayers($p){
	var player = OsuPlayer($p);
	player.setSize(size);
	$p.addClass('dbg_contain').removeAttr('style')
			.find('canvas').addClass('dbg_holder');
}

function toggLayers($p){
	$p.toggleClass('hideExt')
}

function incSize($p){
	var player = OsuPlayer($p);
	if(size + 50 > 0){
		size += 50;
		player.setSize(size);
	}
}

function decSize($p){
	var player = OsuPlayer($p);
	if(size - 50 < 1000){
		size -= 50;
		player.setSize(size);
	}
}

var isDebug = false;
function toggDebug($p){
	isDebug = !isDebug;
	OsuPlayer.debug(isDebug);
	var player = OsuPlayer($p);
	player.debug(isDebug);
	if(isDebug){
		this.attr('class', 'btn btn-warning');
	} else{
		this.attr('class', 'btn btn-danger');
	}
}

$(function (){
	var $div = $('<div id="Debugger"/>').appendTo('body');
	$.each({
		testLayers: '层测试',
		incSize   : '扩大',
		decSize   : '缩小',
		toggLayers: '额外层开关',
		toggDebug : '调试模式'
	}, function (fnName, text){
		var fn = window[fnName];
		$('<a/>', {text: text, class: 'btn btn-danger'}).appendTo($div).click(function (){
			fn.call($(this), $('#osbPlayer'));
		});
	})
});
