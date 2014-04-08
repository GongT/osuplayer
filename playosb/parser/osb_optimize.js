function optimization_simplecommand(commands){
	for(var i = 0; i < commands.length; i++){ // 优化编辑器生成出来的指令
		if(commands[i].name == 'M'){
			if(commands[i].args[0] == commands[i].args[2]){ // X 相同，相当于MY
				commands[i].name = 'MY';
				commands[i].args[0] = commands[i].args[1];
				commands[i].args[1] = commands[i].args[3];
			} else if(commands[i].args[1] == commands[i].args[3]){ // Y相同，相当于MX
				commands[i].name = 'MX';
				commands[i].args[1] = commands[i].args[2];
			} else if(commands[i].args.length == 2){

			}
		}
		if(commands[i].name == 'V'){
			if(commands[i].args[0] == commands[i].args[1] && commands[i].args[2] == commands[i].args[3]){
				// 如果V缩放，X和Y方向起始、结束均互相相等，相当于S缩放
				commands[i].name = 'S';
				commands[i].args[1] = commands[i].args[2];
			}
		}
	}
}

function optimization_object(object, commands){
	/*
	 第一个M指令，起始位置直接给Object，防止闪烁（大概能提高性能？
	 前几个指令时间相同，则第一个M也可以直接给Object
	 */
	for(var i = 0; i < commands.length; i++){
		if(commands[i].name == 'L'){
			if(optimization_object(object, commands[i].subcommands)){
				return true;
			}
		}
		if(commands[i].start != commands[0].start){
			break;
		}
		if(commands[i].name == 'M'){
			object.x = commands[i].args[0];
			object.y = commands[i].args[1];
			if(debugMode){
				console.log('optimization %s cmd[%d] == M, value=(%s,%s)', object.path, i, object.x, object.y);
			}
			return true;
		}
		if(commands[i].name == 'MX'){
			object.x = commands[i].args[0];
			if(debugMode){
				console.log('optimization %s cmd[%d] == MX, value=%s', object.path, i, object.x);
			}
			return true;
		}
		if(commands[i].name == 'MY'){
			object.y = commands[i].args[0];
			if(debugMode){
				console.log('optimization %s cmd[%d] == MY, value=%s', object.path, i, object.y);
			}
			return true;
		}
	}
	return false;
}
