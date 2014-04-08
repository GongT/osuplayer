var debugMode = false;
OsuPlayer.prototype.debug = function (status){
	if(arguments.length == 0){
		status = true;
	}
	if(status && !debugMode){
		console.error('If you want debug osuPlayer, please run window.OsuPlayer.debug(); first.');
		return;
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
