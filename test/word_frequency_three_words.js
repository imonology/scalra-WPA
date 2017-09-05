var word_frequency = require("../modules/word_frequency.js");
var fs = require("fs");

var util = require("util");
var file_parser = new word_frequency();

//			"upload/data_thesis/1_Liu_Xiang(01_Xinxu).txt",
//			"upload/data_thesis/2_Liu_Xiang(02_Shuoyuan).txt",
//			"upload/data_thesis/3_Liu_Xiang(03_Lienu_zhuan).txt",
//			"upload/data_thesis/4_Liu_Xiang(04_HS_LXG).txt",
//			"upload/data_thesis/5_SimaQian-ShiJi_cap_30_NoChu.txt",
//			"upload/data_thesis/6_Unknown-MrChuSaid-w13y15.txt",

var input = {
	"file_path": "../upload/data_thesis/1_Liu_Xiang(01_Xinxu).txt",
	"file_name": "1_Liu_Xiang(01_Xinxu).txt",
	"R_CUT": 70,
	"words": 3,
	"onDone": console.log
};

file_parser.parser(input);
