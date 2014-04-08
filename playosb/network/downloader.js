function Downloader(basePath){
	Downloader.base = basePath || './';
}

Downloader.prototype.progress = $.noop;

Downloader.prototype.get = function (file, option){
	if(!option){
		option = {};
	}
	this.progress('download: ' + file);
	option.url = this.base + file;
	return $.ajax(option);
};
Downloader.prototype.getAll = function (fileArray, option){
	var dfd = new $.Deferred();
	var base = this.base;
	var success_file = {};
	var failed_file = [];
	var self = this;
	var count = fileArray.length;

	this.progress('download: 0/' + count);
	if(!option){
		option = {};
	}

	fileArray.forEach(function (file){
		success_file[file] = false;
		option.url = base + file;
		$.ajax(option).then(function (ret){
			success_file[file] = ret;
			if(--count == 0){
				dfd.resolve(success_file, failed_file);
			}
		}, function (){
			failed_file.push(file);
			if(--count == 0){
				dfd.resolve(success_file, failed_file);
			}
			self.progress('download: ' + (fileArray.length - count) + '/' + fileArray.length);
		});
	});
	return dfd.promise();
};
