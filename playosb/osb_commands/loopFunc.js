function getDataFnLoop(){
	return '';// do nothing
}

function resetFnLoop(){
	return '';// do nothing
}

function runAnimeFnLoop(cmd){
	// runAnimeFn
	var fn = OsbGenerator(cmd.subcommands, 0);
	return fn;
}

function cleanUpFnLoop(){
	return '';// do nothing
}

function setDataFnLoop(){
	return '';// set calc data
}

function calcCurrentFnLoop(conf, startTime){ // 计算百分比的语句
	return 'lastTime = lastTime%' + conf.duration + ';\n';
}

var loopFun = {
	setDataFn    : setDataFnLoop,
	getDataFn    : getDataFnLoop,
	resetFn      : resetFnLoop,
	runAnimeFn   : runAnimeFnLoop,
	cleanUpFn    : cleanUpFnLoop,
	calcCurrentFn: calcCurrentFnLoop
};
