/*
	calculation of distance matrix based on 'distance'
*/

var distance = require("./distance.js");
var calculator = new distance();

function distance_matrix () {
	return this;
}

distance_matrix.prototype.get_frequency = function () {
	return this.calculator.freq_table;
}

/*
	var input = {
		"file_paths": file_paths,
		"words": args.word_size,
		"R_CUT": R_CUT,
		"stat_scope": stat_scope,
		"set_type": set_type
	};
*/
distance_matrix.prototype.generate = function (input, onDone) {
	var self = this;
	self.R_CUT = input.R_CUT;
	var counter = 0;

	self.calculator = calculator;
	
	// a 2x2 matrix to store distances
	self.matrix = [];
	
	// a one-dimentional array to store results linearly
	self.matrix_obj = [];
	
	var num_of_files = input.file_paths.length;

	// go through articles in 'pairs' (i,j) to calculate their distances
	for (var i = 0; i < num_of_files; i++) {
		self.matrix[i] = [];
		for (var j = i; j < num_of_files; j++) {
			if (i == j) {
				self.matrix[i][j] = 0;
				continue;
			}
			
			var dist_input = UTIL.clone(input);			
			dist_input.filei_path = input.file_paths[i],
			dist_input.filej_path = input.file_paths[j],
			dist_input.i = i;
			dist_input.j = j;
							
			// TOFIX: probably no need to read & parse files every time
			self.calculator.compute(dist_input, function (err, result) {
				if (err) {
					return onDone(err);	
				}
				
				// convert from matrix to matrix_obj
				// NOTE: why? (serialize for streaming & save space?)
				// why divide by R_CUT?
				self.matrix[result.i][result.j] = result.dij/self.R_CUT;
				//self.matrix[result.j][result.i] = result.dij/self.R_CUT;
				self.matrix_obj[counter] = {
					"i": result.i,
					"j": result.j,
					"source": result.namei,
					"target": result.namej,
					"value": self.matrix[result.i][result.j]
				}
				counter++;
				
				// check if done
				if (counter == (((num_of_files - 1) * num_of_files) / 2)) {
					return onDone(null, self.matrix_obj);
				}
			});
		}
	}
}

module.exports = distance_matrix;
