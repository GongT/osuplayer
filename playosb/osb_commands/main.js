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
