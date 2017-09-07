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
	LOG.warn('Bridging Edge is: ' + count, l_name);
	return count;
}

//
// exports
//

// NOTE: this could be accessed as: SR.Module['WPA'].analyze
/*
example input:
	var input = {
		names:		'string',				// array of data labels (ex. filenames)
		data: 		[string],				// array of raw data (with puntuation marks)
		authors:	[string],				// array of author names
		words: 		'number',				// ex. 2
		R_CUT: 		'number',				// ex. 70
		stat_scope: 'string',				// ['r_cut', 'full']
		set_type: 	'string',				// ['union', 'intersection']
		write_freq_table:	'boolean',		// whether to output frequency table to file
		write_raw:	'boolean'				// whether to output raw data to file
	};
*/
exports.analyze = function (input, onDone) {
	
	// read files first
	var file_paths = input.file_paths;
	delete input.file_paths;
	
	var data = [];
	for (var i=0; i < file_paths.length; i++) {
		var path = file_paths[i];
		data[i] = SR.fs.readFileSync(path);
	}
	
	input.data = data;
	
	// TOFIX: need to 'new' every time?
	var analyzer = new distance_matrix();
	
	analyzer.generate(input, function (err, result) {
							 
		if (err) {
			return onDone(err);	
		}
		
		LOG.warn('WPA analysis result:', l_name);
		LOG.warn(result, l_name);
		
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
		
		for (var i = 0; i < table.value.length; i++) {
			table.value[i][i] = 0;
			table.rowLabel[i] = i + 1;
			table.columnLabel[i] = i + 1;
		}
		
		// calculate MST
		kruskal.kruskalMST(table.value, function (mst) {
			LOG.warn('MST:', l_name);
			LOG.warn(mst, l_name);
			
			// calculate Bridging Edges (E_bridge) based on edge and author list
			var E_bridge = getBridgingEdge(mst.mstArray, input.authors);
			
			// copy out frequency table
			var freq_table = {};
			
			for (var i = 0; i < input.names.length; i++) {
				freq_table[input.names[i]] = l_freq_table[input.names[i]];
			}
			
			onDone(null, {table: table, MST: mst, E_bridge: E_bridge, freq: freq_table});			
		});
	})
	
}

// module init
l_module.start = function (config, onDone) {
	LOG.warn('WPA module started...', l_name);
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
