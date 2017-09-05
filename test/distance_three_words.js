var distance = require("../modules/distance.js");
var calculator = new distance();
var fs = require("fs");
var util = require("util");


//			"upload/data_thesis/1_Liu_Xiang(01_Xinxu).txt",
//			"upload/data_thesis/2_Liu_Xiang(02_Shuoyuan).txt",
//			"upload/data_thesis/3_Liu_Xiang(03_Lienu_zhuan).txt",
//			"upload/data_thesis/4_Liu_Xiang(04_HS_LXG).txt",
//			"upload/data_thesis/5_SimaQian-ShiJi_cap_30_NoChu.txt",
//			"upload/data_thesis/6_Unknown-MrChuSaid-w13y15.txt",

var input = {
	"filei_path": "../upload/data_thesis/1_Liu_Xiang(01_Xinxu).txt",
	"filej_path": "../upload/data_thesis/2_Liu_Xiang(02_Shuoyuan).txt",
	"i": 1,
	"j": 2,
	"R_CUT": 70,
	"words": 3,
	"onDone": console.log
};

calculator.distance_calculator(input);
