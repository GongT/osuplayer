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
