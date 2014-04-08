function getDataFn(){
	return '';// do nothing
}

function resetFn(){
	return '';// do nothing
}

function runAnimeFn(cmd){
	// runAnimeFn
	var fn = OsbGenerator(cmd.subcommands, 0);
	return fn;
}

function cleanUpFn(){
	return '';// do nothing
}

function setDataFn(){
	return '';// set calc data
}

function calcCurrentFn(conf, startTime){ // 计算百分比的语句
	return 'lastTime = lastTime%' + conf.duration + ';\n';
}

var loopFun = {
	setDataFn    : setDataFn,
	getDataFn    : getDataFn,
	resetFn      : resetFn,
	runAnimeFn   : runAnimeFn,
	cleanUpFn    : cleanUpFn,
	calcCurrentFn: calcCurrentFn
};
