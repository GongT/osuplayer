var fs = require('fs');
process.chdir(__dirname);
if(!fs.existsSync('dist')){
	fs.mkdirSync('dist');
}

var filelist = [];

cmd_exec('bash', ['./playosb/debug/make_css.sh'], main);

function main(){
	fs.readdirSync('./playosb').forEach(function (f){
		if(/\.js$/.test(f)){
			addFile('./playosb/' + f);
		} else{
			readModule('./playosb/' + f);
		}
	});

	var result = '(function(window,Kinetic,$){\n"use strict";\n';

	filelist.forEach(function (file){
		var content = fs.readFileSync(file);
		result += '/* - ' + file + ' - */\n';
		result += content.toString('utf-8');
		result += '\n';
	});

	result += '\nwindow.OsuPlayer = OsuPlayer;\n})(window,Kinetic,jQuery);';
	fs.writeFileSync('dist/osuplayer.js', result);
}

function addFile(file){
	filelist.push(file);
}

function readModule(path){
	fs.readdirSync(path).forEach(function (f){
		if(/\.js$/.test(f)){
			addFile(path + '/' + f);
		}
	});
}

function cmd_exec(cmd, args, cb_end){
	var child = require('child_process').spawn(cmd, args);
	child.stdout.on('data', function (data){
		console.log(data);
	});
	child.stdout.on('end', cb_end);
}
