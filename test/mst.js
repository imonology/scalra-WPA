var d = [ [0,1,2,3],
      [1,0,1,2],
      [2,1,0,1],
      [3,2,1,0] ];


var kruskal = require('node-kruskal');

kruskal.kruskalMST(d, function(results){
	console.log(results);
});