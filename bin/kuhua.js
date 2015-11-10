#!/usr/bin/env node
'use strict';
var fs          = require('fs');
var url         = require('url');
var ejs         = require('ejs');
var getPageData = require('../lib/getPageData');

var beginTime   = Date.now();
var templateUrl = __dirname + '/../template/kuhua.html';
var logFile = 'kuhua_url.txt';
var epArr = function () {
	var args = process.argv.slice(2) || [];
	var pattern = /http:\/\/[a-z0-9\?\&\/\._=]+/img;
	var ret = [];

	args.forEach(function (item) {
		if (item.indexOf('.txt') >= 0) {
			var txt = fs.readFileSync(item, 'utf-8');
			var arr = txt.match(pattern) || [];

			arr.forEach(function (item) {
				push(item);
			});
		} else {
			push(item);
		}
	});

	function push(string) {
		var query = url.parse(string, true).query;
		ret.push({
			comic_id: +query.comic_id,
			ep_id: +query.ep_id
		});
	}

	return ret;
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
	var template = fs.readFileSync(templateUrl, 'utf-8');
	var content = ejs.render(template, pageData);
	var filename = ['reader', ep.comic_id, ep.ep_id].join('-') + '.html';

	console.log('开始生成文件...');
	fs.writeFileSync(filename, content);
	console.log('创建成功！');
	createLog(filename, pageData);
}

function createLog(filename, pageData) {
	var cur =  epArr.progress || 0;
	var logText = '【' + pageData.comic_title + '】' + pageData.ep_title + '：\n' + getUrl(filename) + '\n';
	var isExistLogFile = fs.existsSync(logFile);

	epArr.progress = cur + 1;

	if (epArr.progress === 1) {
		logText = '******** 生成时间：' + getTime() + ' ********\n' + logText;
	} else if (epArr.progress === epArr.length) {
		console.log('************');
		console.log('共耗时：' + (Date.now() - beginTime) + 'ms');
		logText += ('\n\n');
	}

	if (isExistLogFile) {
		fs.appendFile(logFile, logText);
	} else {
		fs.writeFileSync(logFile, logText);
	}
}

//http://m.comicool.cn/act/201509/kuhua/reader-10090-4.html?ch=kh
function getUrl(filename) {
	var d = new Date();
	var year = d.getFullYear();
	var month = d.getMonth() + 1;
	var yyyymm = year + (month > 9 ? '' + month : '0' + month);

	return 'http://m.comicool.cn/act/' + yyyymm + '/kuhua/' + filename + '?ch=kh';
}

function getTime() {
	var d = new Date();
	var year = d.getFullYear();
	var month = d.getMonth() + 1;
	var date = d.getDate();
	var day = d.getDay();
	var hour = d.getHours();
	var minute = d.getMinutes();
	var second = d.getSeconds();
	var fix = function (num) {
		if (num < 10) {
			return '0' + num;
		}
		return num;
	};

	return year + '年' + fix(month) + '月' + fix(date) + '日 ' + fix(hour) + ':' + fix(minute) + ':' + fix(second);
}