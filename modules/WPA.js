/*
	WPA module - a module to perform Word Population Analysis (WPA)
	
	history:
		2016-08-08		initial version started to convert Ruby version to JavaScript
		2017-09-05		convert into a scalra module
	
*/

var l_name = 'WPA';

// module object
var l_module = exports.module = {};

// exports
// NOTE: this could be accessed as: SR.Module['WPA'].WPA
exports.WPA = require("./distance_matrix.js");

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
