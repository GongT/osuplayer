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
			ret += 'console.error("Unknown osB command: [' + name + '].");\n';
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
			data.getDataFn(name);
		}
	});
	return ret;
}

function setDataFn(objName, cmds){
	var ret = '';
	cmds.forEach(function (name){
		var data = OsbCommands[name] || OsbCompound[name];
		if(!data){
			ret += '// console.error("Unknown osB command: ' + name + '");\n';
			return;
		}

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
			data.setDataFn(name);
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
	if(!data){
		return '// console.error("Unknown osB command: ' + conf.debug_orig_command + '");\n';
	}

	if(data.length){
		data.forEach(function (def){
			ret += def.var + ' = ' + JSON.stringify(START(conf, def)) + ';\n';
		});
	} else if(data.resetFn){
		data.resetFn(conf);
	}

	return ret;
}

/**
 * @param conf {{name: *, ease: *, start: *, end: *, args: Array, subcommands: Array, debug_orig_command: *}}
 */
function runAnimeFn(conf){
	var ret = '';
	var data = OsbCommands[conf.name] || OsbCompound[conf.name];
	if(!data){
		return '// console.error("Unknown osB command: ' + conf.debug_orig_command + '");\n';
	}
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
		data.runAnimeFn(conf);
	}

	return ret;
}

/** 动画结束状态
 * @param conf {{name: *, ease: *, start: *, end: *, args: Array, subcommands: Array, debug_orig_command: *}}
 */
function cleanUpFn(conf){
	var ret = '';
	var data = OsbCommands[conf.name] || OsbCompound[conf.name];
	if(!data){
		return '// console.error("Unknown osB command: ' + conf.debug_orig_command + '");\n';
	}

	if(data.length){
		data.forEach(function (def){
			ret += def.var + ' = ' + JSON.stringify(END(conf, def)) + ';\n';
		});
	} else if(data.cleanUpFn){
		data.cleanUpFn(conf);
	}

	return ret;
}

function START(conf, def){
	var end = conf.args[def.argStart.pos];
	if(undefined === end){
		end = def.argStart.def;
	}
	return end;
}

function END(conf, def){
	var end = conf.args[def.argEnd.pos];
	return end;
}

var CMDList = {
	setDataFn : setDataFn,
	getDataFn : getDataFn,
	resetFn   : resetFn,
	runAnimeFn: runAnimeFn,
	cleanUpFn : cleanUpFn
};
