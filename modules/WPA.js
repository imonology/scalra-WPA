/*
	WPA module - a module to perform Word Population Analysis (WPA)
	
	history:
		2016-08-08		initial version started to convert Ruby version to JavaScript
		2017-09-05		convert into a scalra module
	
*/

var l_name = 'WPA';
var kruskal = require('node-kruskal');

// module object
var l_module = exports.module = {};

var l_freq_table = SR.State.get('FreqTable');

var distance_matrix = require("./distance_matrix.js");
//read .docx file url: https://www.npmjs.com/package/textract
var textract = require('textract');
// 
// helper functions
//

var getBridgingEdge = function (edges, authors) {
	
	var count = 0;
	for (var i=0; i < edges.length; i++) {
		var edge = edges[i];
		if (authors[edge[0]] !== authors[edge[1]]) {
			count++;
		}
	}
	return count;
}

//
// exports
//

// group a list of input to closest groups
exports.group = function (input, onDone) {
	
	// extract parameters
	var para = input.para;
	
	var results = [];
	for (var i in input.data) {
		results.push(input.data[i] + ' group');
	}
	
	onDone(null, results);
}

// NOTE: this could be accessed as: SR.Module['WPA'].analyze
/*
example input:
	var input = {
		names:		'string',				// array of data labels (ex. filenames)
		data: 		[string],				// array of raw data (with puntuation marks)
		authors:	[string],				// array of author names
		words: 		'number',				// ex. 2
		R_CUT: 		'number',				// ex. 70
		stat_scope: 'string',				// ['R_cut', 'Full']
		set_type: 	'string',				// when compare two articles, which word set to use: ['union', 'intersection']
		write_freq_table:	'boolean',		// whether to output frequency table to file
		write_raw:	'boolean'				// whether to output raw data to file
	};
*/
var readPathFile = function (index, paths, dataAr, onDone) {
	var path = paths[index];//
	//20171026-by Nicht
	var l_lastName = "";
	l_lastName = path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2);
	//LOG.warn('====================l_lastName = ', l_lastName);
	//--------------------------
	if(l_lastName == 'docx') {
		textract.fromFileWithPath(path, function( error, text ) {
			dataAr[index] = text;
			if(++index < paths.length) {
				readPathFile(index, paths, dataAr, onDone);
			} else {
				onDone(dataAr);
			}
		});
	} else {
		//LOG.warn('====================txt path = ', path);
		/*
		dataAr[index] = SR.fs.readFileSync(path);
		if(++index < paths.length) {
			readPathFile(index, paths, dataAr, onDone);
		} else {
			onDone(dataAr);
		}
		*/
		SR.API.IS_UTF8({
			path:			path,
			return_data:	true
		}, function (err, result) {
			if (err) {
				return onDone(err); 
			}
			var is_utf8 = result.is_utf8;
			var data = result.data;
			dataAr[index] = data;
			if(++index < paths.length) {
				readPathFile(index, paths, dataAr, onDone);
			} else {
				onDone(dataAr);
			}
		});			
	}
}

exports.analyze = function (input, onDone) {
	// check if raw data exist or we need to read from file
	if (!input.data && input.file_paths instanceof Array) {
		LOG.warn('file_paths provided, read from files..', l_name);
		
		var file_paths = input.file_paths;
		delete input.file_paths;

		/*拆出去變成readPathFile()
		for (var i=0; i < file_paths.length; i++) {
			var path = file_paths[i];
			//20171026-by Nicht
			var l_lastName = "";
			l_lastName = path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2);
			//--------------------------
			if(l_lastName == 'docx') {
				textract.fromFileWithPath(path, function( error, text ) {

				});
			} else {
				data[i] = SR.fs.readFileSync(path);
			}
		}
		input.data = data;		
		*/
		var data = [];
		var l_index = 0;
		readPathFile(l_index, file_paths, data, function (result) {
			input.data = result;
			analyzeCount(input, onDone);
		});
	} else {
		analyzeCount(input, onDone);
	}
}

var analyzeCount = function (input, onDone) {
	if (input.data instanceof Array === false ||
		input.names instanceof Array === false ||
		input.data.length !== input.names.length) {
		var errmsg = 'input parameter not consistent';
		LOG.error(errmsg, l_name);
		return onDone(errmsg);
	}

	// TOFIX: need to 'new' every time?
	var analyzer = new distance_matrix();
	analyzer.generate(input, function (err, result) {

		if (err) {
			LOG.warn('generate有error');
			return onDone(err);	
		}
		//LOG.warn('WPA analysis result:', l_name);
		//LOG.warn(result, l_name);

		// convert result into table
		var table = {
			rowLabel: [],
			columnLabel: [],
			value: [],
			name: []
		};

		for (var i = 0; i < result.length; i++) {

			// keep until the 7th digit
			if (typeof(table.value[result[i].i]) === "undefined") {
				table.value[result[i].i] = [];
				table.value[result[i].i][result[i].j] = Math.round((result[i].value * Math.pow(10, 7))) / Math.pow(10, 7);
				table.name[result[i].i] = result[i].source;
			} else {
				table.value[result[i].i][result[i].j] = Math.round((result[i].value * Math.pow(10, 7))) / Math.pow(10, 7);
			}
			if (typeof(table.value[result[i].j]) === "undefined") {
				table.value[result[i].j] = [];
				table.value[result[i].j][result[i].i] = Math.round((result[i].value * Math.pow(10, 7))) / Math.pow(10, 7);
				table.name[result[i].j] = result[i].target;
			} else {
				table.value[result[i].j][result[i].i] = Math.round((result[i].value * Math.pow(10, 7))) / Math.pow(10, 7);
			}
		}
		// console.log(table.value);
		// set diagnoal line (distance to self) all to 0
		for (var i = 0; i < table.value.length; i++) {
			table.value[i][i] = 0;
			table.rowLabel[i] = i + 1;
			table.columnLabel[i] = i + 1;
		}
		// calculate MST
		var mst = get_mst(table.value);
		// kruskal.kruskalMST(table.value, function (mst) {
			//LOG.warn('MST:', l_name);
			//LOG.warn(mst, l_name);

			// calculate Bridging Edges (E_bridge) based on edge and author list
			var E_bridge = getBridgingEdge(mst.mstArray, input.authors);

			// copy out frequency table
			var freq_table = {};

			for (var i = 0; i < input.names.length; i++) {
				freq_table[input.names[i]] = l_freq_table[input.names[i]];
			}

			var output = {table: table, MST: mst, E_bridge: E_bridge, freq: freq_table};
			//LOG.warn(output, l_name);

			LOG.warn('words: ' + input.words + ' R_cut: ' + input.R_CUT + ' Bridging Edges: ' + E_bridge, l_name);

			onDone(null, output);			
		// });
	});
}
function get_mst(d) {
	var edage = [];
	for (var i = 0 ; i < d.length ; i++) 
		for (var j = i+1 ; j < d.length ; j++) 
			edage.push({a: i, b: j, distance: d[i][j]});
	edage.sort(function (a, b) {
		return a.distance > b.distance ? 1 : -1;
	});
	var use = [];
	var result = [];
	var sum = 0;
	for (var i in edage) 
		if (use.indexOf(edage[i].a) === -1 || use.indexOf(edage[i].b) === -1) {
			result.push([edage[i].a, edage[i].b, edage[i].distance]);
			sum += edage[i].distance;
			if (use.indexOf(edage[i].a) === -1)
				use.push(edage[i].a)
			if (use.indexOf(edage[i].b) === -1)
				use.push(edage[i].b)
		}
	return {mst: sum, mstArray: result};
}
// module init
l_module.start = function (config, onDone) {
	LOG.warn('WPA module started...', l_name);
	// ensure directory exists
	UTIL.validatePath(SR.path.resolve(SR.Settings.PROJECT_PATH, 'output'));
	UTIL.safeCall(onDone);
}

// module shutdown
l_module.stop = function (onDone) {
	UTIL.safeCall(onDone);
}

// register this module
SR.Module.add('WPA', l_module);

SR.Callback.onStart(function () {
})
