/*
	distance.js		calculate article distances based on word frequency ranking


*/

var word_frequency = require("./word_frequency.js");
var fs = require("fs");
var util = require("util");
var file_parser = new word_frequency();

var l_freq_table = SR.State.get('FreqTable');

function distance () {
	this.freq_table = {};		// store word frequency from different files
	return this;
}

/*
	var dist_input = UTIL.clone(input);			
	dist_input.filei_path = input.file_paths[i],
		dist_input.filej_path = input.file_paths[j],
			dist_input.i = i;
	dist_input.j = j;
*/
distance.prototype.compute = function (input, onDone) {
	var self = this;
	self.R_CUT = input.R_CUT;
	var dij = 0;

	self.readFile(input, function (err, result) {
		if (err) {
			return onDone(err);	
		}
		
		// calculate dij from full qij table
		for (var i = 0; i < result.qij_table.length; i++) {
			if (result.qij_table[i].qij) {
				dij += (Math.abs(result.qij_table[i].Ri - result.qij_table[i].Rj) * result.qij_table[i].qij);
			}
		}
		
		dij = dij / result.unique_words;
		LOG.warn('dij: ' + dij + ' unique_words: ' + result.unique_words);

		// fs.writeFile(
		// 	"./output/C_qij_table_"
		// 	    + input.filei_path.split('/')[input.filei_path.split('/').length - 1],
		// 	    + "_"
		// 	    + input.filej_path.split('/')[input.filej_path.split('/').length - 1],
		//
		// 	util.inspect(result.qij_table)
		// );
		//
		// fs.appendFile(
		// 	"./output/D_distance_and_other_parameters_"
		// 	    + input.filei_path.split('/')[input.filei_path.split('/').length - 1],
		// 	    + "_"
		// 	    + input.filej_path.split('/')[input.filej_path.split('/').length - 1],
		//
		// 	result.object_file + "\ndistance: " + dij
		// );
		
		onDone(null, {
			"dij": dij,
			"i": input.i,
			"j": input.j,
			"namei": input.filei_path.split('/')[input.filei_path.split('/').length - 1],
			"namej": input.filej_path.split('/')[input.filej_path.split('/').length - 1],
		});
	});
}

// read & parse two files and return their results after passing to the Z function
distance.prototype.readFile = function (input, onDone) {
	var self = this;
	var parse_input = UTIL.clone(input);
	parse_input.file_path = input.filei_path;

	file_parser.parse(parse_input, function (err, result1) {
		if (err) {
			return onDone(err);	
		}
		
		parse_input.file_path = input.filej_path;			
		file_parser.parse(parse_input, function (err, result2) {
			if (err) {
				return onDone(err);	
			}

			LOG.warn('1 [' + result1.filename + '] size: ' + result1.freq_table.length);
			LOG.warn('2 [' + result2.filename + '] size: ' + result2.freq_table.length);
			
			// save to global 
			l_freq_table[result1.filename] = result1.freq_table;
			l_freq_table[result2.filename] = result2.freq_table;
			
			self.function_Z({
				"filei": result1,
				"filej": result2,
			}, onDone);
		});
	});
}

/*
output:
		"qij_table": qij_table,
		"unique_words": unique_words,		// how many words are unique in both articles
		"object_file": object_file	
*/
distance.prototype.function_Z = function (input, onDone) {
	var self = this;
	var tablei, tablej, unique_words, sum_of_Pij, Z, qij_table, index_counter;

	tablei = input.filei.freq_table;
	tablej = input.filej.freq_table;

	// backup for different purposes
	self.freq_table = {
		freq_i: tablei,
		freq_j: tablej
	};

	// TOFIX: may not be union, can also be 'intersection'
	unique_words = tablei.length + tablej.length;
	LOG.warn('tablei length: ' + tablei.length + ' tablej.length: ' + tablej.length + ' unique: ' + unique_words);
	sum_of_Pij = 0;
	index_counter = 0;
	
	// record for Pi/Pj, Ri/Rj for each word w_k
	qij_table = [];

	// FIXME: go through not tablei entirely but only the first R_CUT words
	//	      (can optionally enable/disable this)
	for (var i = 0; i < tablei.length; i++) {

		/* tablei's words*/
		qij_table[i] = {
			"key": tablei[i].key,
			"Pi": tablei[i].probability,
			"Ri": tablei[i].Rank
		};

		/* sum of Pi */
		sum_of_Pij += (tablei[i].probability * (Math.log(tablei[i].probability)));

		// try to find if there's a word in both articles i & j
		for (var j = 0; j < tablej.length; j++) {

			if (tablei[i].key === tablej[j].key) {
				/* same words */
				qij_table[i].Pj = tablej[j].probability;
				qij_table[i].Rj = tablej[j].Rank;
				tablej[j].duplicate = 1;
				unique_words--;
				break;
			}
		}
	}

	/* sum of Pj */
	for (var j = 0; j < tablej.length; j++) {
		sum_of_Pij += (tablej[j].probability * (Math.log(tablej[j].probability)));

		if (tablej[j].duplicate === 1) {
			continue;
		} 
		qij_table[(tablei.length + index_counter)] = {
			"key": tablej[j].key,
			"Pj": tablej[j].probability,
			"Rj": tablej[j].Rank
		}
		index_counter++;
	}


	// which Z is correct?
	//Z = ((-sum_of_Pij) / unique_words);
	Z = ((-sum_of_Pij) / Math.sqrt(tablei.length * tablej.length));

	for (var i = 0; i < qij_table.length; i++) {
		if (qij_table[i].Pi) {
			qij_table[i].qij = (-(qij_table[i].Pi * (Math.log(qij_table[i].Pi))) / Z);

		} else {
			qij_table[i].Ri = self.R_CUT;
		}

		if (qij_table[i].Pj && qij_table[i].Pi) {
			qij_table[i].qij += (-(qij_table[i].Pj * (Math.log(qij_table[i].Pj))) / Z);

		} else if (qij_table[i].Pj && !qij_table[i].Pi) {
			qij_table[i].qij = (-(qij_table[i].Pj * (Math.log(qij_table[i].Pj))) / Z);

		} else {
			qij_table[i].Rj = self.R_CUT;
		}
	}

	var object_file = "unique_words: " + unique_words
	    + "\nMath.sqrt(tablei.length*tablej.length): " + Math.sqrt(tablei.length * tablej.length)
	    + "\n(-sum_of_Pij): " + (-sum_of_Pij)
	    + "\nZ(/unique_words): " + ((-sum_of_Pij) / unique_words)
	    + "\nZ(/sqrt(unique1*unique2)): " + ((-sum_of_Pij) / Math.sqrt(tablei.length * tablej.length));

	onDone(null, {
		"qij_table": qij_table,
		"unique_words": unique_words,
		"object_file": object_file	
	});
}

module.exports = distance;
