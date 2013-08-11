var SwissPopulationBFS = null,
	SwissCommutersBFS = null,
	SwissHeatmap = null;

// Load data sources
$.getJSON('data/swiss-cantons-population-bfs.json', function(data1) {
	SwissPopulationBFS = data1.Population;
	
	$.getJSON('data/swiss-cantons-commuters-2011.json', function(data2) {
		SwissCommutersBFS = data2.Pendler;
		
		$.getJSON('data/swiss-meteo-stations.json', function(data3) {
			SwissHeatmap = data3;
		
			$.getJSON('data/swiss-cantons-simplified.json', function(geodata) {

				init(geodata);
				animate();
				clearData();
			
			});
		});
	});
});

// Applies a column from a data source to the map
function applyData(source, column, multiplier) {
	$.each(groupPyramids, function() {
		featurename = this.name;
		var data1 = $.grep(source, function(n) { 
			return (featurename.indexOf(n.Kanton) > -1); });
		
		if (data1.length == 0) {
			console.log("[Error] Could not match " + featurename);
			return;
		}
		value1 = parseInt(data1[0][column] / multiplier(featurename));
		//console.log("Applying data: " + featurename + " - " + value1);
		this.datavalue = value1;
	});
	dataFader = 0;
}

// Scales vertices of the map by amount
function renderData(amount) {
	if (typeof amount == 'undefined') amount = dataFader;
	$.each(groupPyramids, function() {
		if (this.datavalue && (this.datavalue * amount)>0.3) {
			this.geometry.vertices[4].z = -(this.datavalue * amount);
			this.geometry.verticesNeedUpdate = true;
			var hsv = this.material.color.getHSV();
			var vv = .3 + (this.datavalue / 90);
			if (vv > 1) vv = 1;
			this.material.color.setHSV(hsv.h, hsv.s, vv);
			//console.log(this.datavalue / 70);
			this.material.opacity = amount * CONF.PyramidOpacity;
		} else {
			this.material.opacity = 0;
		}
	});
}

// Resets the vertices
function clearData(amount) {
	if (typeof amount == 'undefined') amount = 0;
	$.each(groupPyramids, function() {
		this.geometry.vertices[4].z = -(this.datavalue * amount);
		this.geometry.verticesNeedUpdate = true;
		this.material.opacity = amount;
	});
}
