'use strict';
var http = require('http');
var url  = require('url');

var config = {
	imgUrl: 'http://cdn.icomico.com/',
	requestOptions: {
		protocol: 'http:',
		host: 'proxy.icomico.com'
	}
};

function getPageData(ep, callback) {
	var comic_id = ep.comic_id;
	var ep_id = ep.ep_id;
	var pageData = {
		comic_id: comic_id,
		ep_id: ep_id,
		ep_prev_id: ep_id - 1 <= 0 ? null : ep_id - 1,
		ep_next_id: ep_id + 1
	};
	var requests = [
		function () {
			getJSONP('/comicdetail4web', 
				{
					comic_id: comic_id
				},
				function (data) {
					if (data.comic_info.ext_list) {
						var cate = data.comic_info.ext_list[1].desc;
						var cateArr = cate.split('|');

						for (var j = 0; j < cateArr.length; j++) {
							cate = cateArr[j].split('#')[1];
							
							if (cate != '') {
								break;
							}
						}
					}

					pageData.category = cate ? cate + '漫画' : null;
					pageData.description = data.comic_info.comic_desc;
					step();
				}
			);
		},
		function () {
			getJSONP('/epinfo4web', 
				{
					comic_id: comic_id,
					ep_id: ep_id
				},
				function (data) {
					pageData.comic_title = data.comic_title;
					pageData.ep_title = data.extend_info.ep_title;
					pageData.ep_images = getEpImages(data);
					pageData.ep_cover = data.ep_comic_cover;
					step();
				}
			);
		},
		function () {
			getJSONP('/epinfo4web', 
				{
					comic_id: comic_id,
					ep_id: ep_id + 1
				},
				function (data) {
					if (!data.frame_list) {
						pageData.ep_next_id = null;
					}
					step();
				}
			);
		}
	];
	var step = function () {
		var cur =  requests.progress || 0;
		requests.progress = cur + 1;

		if (requests.progress === requests.length) {
			console.log('************')
			console.log('【' + pageData.comic_title + '】' + pageData.ep_title + '\n数据抓取完成...');
			callback(ep, pageData);
		}
	};

	requests.forEach(function (fn) {
		fn();
	});
}

function getJSONP(pathname, query, callback) {
	var text = '';
	var options = Object.create(config.requestOptions);
	options.pathname = pathname;
	options.query = query;

	http.get(url.format(options), function (res) {
		res.on('data', function (chunk) {
			text += chunk;
		});

		res.on('end', function () {
			callback(jsonpPraser(text));
		});
	});
}

function jsonpPraser(str) {
	var begin = str.indexOf('{');
	var jsonStr = str.slice(begin, -1);

	return JSON.parse(jsonStr);
}

function traverse(source, key, cache) {
	if (source instanceof Object) {
		for (var n in source) {
			if (source.hasOwnProperty(n)) {
				if (n == key) {
					cache.push(source[n]);
				} else {
					traverse(source[n], key, cache);
				}
			}
		}
	} else if (source instanceof Array) {
		for (var i = 0, len = source.length; i < len; i++) {
			traverse(source[i], key, cache);
		}
	}
}

function getEpImages(obj) {
	var result = [];

	traverse(obj, 'frame_url', result);

	for (var i = 0, len = result.length; i < len; i++) {
		var imgUrl = '\t\t"' + config.imgUrl + result[i] + '?imageView2/2/w/640"';
		result[i] = imgUrl;
	}

	return '[\n' + result.join(',\n') + '\n\t]';
}

module.exports = getPageData;