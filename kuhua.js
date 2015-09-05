'use strict';
var fs          = require('fs');
var url         = require('url');
var ejs         = require('ejs');
var getPageData = require('./getPageData');

var beginTime   = Date.now();
var templateUrl = 'kuhua.html';
var logFile = 'kuhua_url.txt';
var epArr = function () {
	var args = process.argv.slice(2) || [];

	args.forEach(function (item, index) {
		var query = url.parse(item, true).query;
		args[index] = {
			comic_id: +query.comic_id,
			ep_id: +query.ep_id
		};
	});

	return args;
}();

//开始生成
generatePages(epArr);

function generatePages(arr) {
	if (arr.length) {
		arr.forEach(function (ep) {
			getPageData(ep, writeFile);
		});
	} else {
		console.log('请添加要生成的单话地址');
	}
}

function writeFile(ep, pageData) {
	fs.readFile(templateUrl, function (err, data) {
		if (err) {
			console.log('读取模板文件失败');
		} else {
			console.log('开始生成文件...');
			var template = data.toString('utf-8');
			var content = ejs.render(template, pageData);
			var filename = ['reader', ep.comic_id, ep.ep_id].join('-') + '.html';

			fs.writeFile(filename, content, function (err) {
				if (err) {
					console.log('创建失败！');
				} else {
					console.log('创建成功！');
					createLog(filename, pageData);
				}
			});
		}
	});
}

function createLog(filename, pageData) {
	var cur =  epArr.progress || 0;
	var logText = '【' + pageData.comic_title + '】' + pageData.ep_title + '：\n' + getUrl(filename) + '\n';

	epArr.progress = cur + 1;

	if (epArr.progress === epArr.length) {
		console.log('************');
		console.log('共耗时：' + (Date.now() - beginTime) + 'ms');
		logText += ('******** 生成时间：' + new Date().toLocaleString() + ' ********\n\n');
	}

	fs.exists(logFile, function (exists) {
		if (exists) {
			fs.appendFile(logFile, logText);
		} else {
			fs.writeFile(logFile, logText);
		}
	});
}

//http://m.comicool.cn/act/201509/kuhua/reader-10090-4.html?ch=kh
function getUrl(filename) {
	var d = new Date();
	var year = d.getFullYear();
	var month = d.getMonth() + 1;
	var yyyymm = year + (month > 9 ? '' + month : '0' + month);

	return 'http://m.comicool.cn/act/' + yyyymm + '/kuhua/' + filename + '?ch=kh';
}
