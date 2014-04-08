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

