
// var file_pool = [];
// n = number of words
// R = rank of words (must < Rcut)
// P = probability of words

const fs = require("fs");
const util = require("util");

function word_frequency () {
	return this;
}

word_frequency.prototype.parse = function (input, onDone) {

	var self = this;

	// default to one character per word
	input.words = input.words || 1;
	
	var R_CUT = input.R_CUT;
	var string_without_marks; // 好可怕怕哦怎麼辦整篇文章沒有標點符號跟空白
	var charmap = new Map(); // 好可怕: 0, 可怕怕: 1, 怕怕哦: 2, ...
	var char_counter = []; // [0].counter: 45 [0].word_slice: 好可怕, [1].counter: 1 ...
	var unique_words = 0;
	var word_slice = "";
	var code = 0;
	var ranks = []; // [17(字詞出現次數)].counter: 2 [17].rank: 4 (出現17次的字詞有2個，出現17次的字是第4名), ...
	var rank = 1; // counter
	var sorted_words = [];

	// FIXME: should read only once for a given analysis
	fs.readFile(input.file_path, function (err, data) {

		if (err) {
			return onDone(err);
		}

		// remove non chinese char
		string_without_marks = data.toString().replace(/[^\u4E00-\u9FA5]+/g, ""); 

		if (R_CUT < 0 || R_CUT > string_without_marks.length) {
			R_CUT = string_without_marks.length;
		}

		for (var i = 0; i < string_without_marks.length - (input.words - 1); i++) {
			if (string_without_marks[i] === "") {
				continue;
			}
			// 你好嗎.slice(0, 2) -> 你好
			word_slice = string_without_marks.slice(i, (i + input.words));
			code = charmap.get(word_slice);

			if (!code) {
				charmap.set(word_slice, unique_words);
				char_counter[unique_words] = {
					key: word_slice,
					value: 1,
					probability: 0,
					Rank: 0
				}
				unique_words++;
			} else {
				char_counter[code].value++;
			}
		}

		for (var i = 0; i < char_counter.length; i++) {
			if (!ranks[char_counter[i].value]) {
				ranks[char_counter[i].value] = {
					counter: 1,
					rank: 0,
					index: -1
				}
			} else {
				ranks[char_counter[i].value].counter += 1;
			}
		}

		for (var i = ranks.length - 1; i > 0; i--) {
			if (ranks[i]) {
				ranks[i].rank = rank;
				rank += ranks[i].counter;
			}
		}

		for (var i = 0; i < char_counter.length; i++) {
			char_counter[i].Rank = ranks[char_counter[i].value].rank;
			char_counter[i].probability = char_counter[i].value / (string_without_marks.length - (input.words - 1));
			sorted_words[(ranks[char_counter[i].value].rank + ranks[char_counter[i].value].index)] = char_counter[i];
			ranks[char_counter[i].value].index++;
		}

		//LOG.warn('check input for stat_scope...');
		//LOG.warn(input);
		
		// whether to return the only R_CUT words
		if (input.stat_scope && input.stat_scope === 'R_cut')
			sorted_words = sorted_words.slice(0, R_CUT);

		var filepath = input.file_path.split('/');
		var filename = filepath[filepath.length-1];
		
		fs.writeFile(
			"./output/A_raw_data_"
			    + string_without_marks.length
			    + "_"
			    + unique_words
			    + "_"
			    + filename,
			string_without_marks
		);
		
		fs.writeFile(
			"./output/B_freq_table_"
			    + filename,
			util.inspect(sorted_words)
		);

		return onDone(null, {freq_table: sorted_words, filename: filename});
	});
}

module.exports = word_frequency;