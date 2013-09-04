var SwissPopulationBFS = null,
	SwissCommutersBFS = null,
	SwissHeatmap = null,
	SwissHeightmap = null,
	SetupHeightMap = null;

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

				SwissHeightmap = createHeightMap('data/height/CH.jpg');
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
		this.datamultp = parseFloat(multiplier(featurename));
		this.datascale = value1;
	});
	if (groupPyramids[0].visible) {
		dataFader = 0.9;
	} else {
		dataFader = 0.0;
	}
}

// Scales vertices of the map by amount (0.0 - 1.0)
function renderData(amount) {
	if (typeof amount == 'undefined') amount = dataFader;
	$.each(groupPyramids, function() {
		if (this.datascale && (this.datascale * amount)>0.3) {
			this.geometry.vertices[4].z = -(this.datascale * amount);
			this.geometry.verticesNeedUpdate = true;
			var hsv = this.material.color.getHSV();
			var vv = .3 + (this.datascale / 90);
			if (vv > 1) vv = 1;
			this.material.color.setHSV(hsv.h, hsv.s, vv);
			//console.log(this.datascale / 70);
			this.material.opacity = amount * CONF.PyramidOpacity;
			this.visible = true;
		} else {
			this.material.opacity = 0;
			this.visible = false;
		}
	});
}

// Resets the vertices
function clearData(amount) {
	if (typeof amount == 'undefined') amount = 0;
	$.each(groupPyramids, function() {
		this.geometry.vertices[4].z = -(this.datascale * amount);
		this.geometry.verticesNeedUpdate = true;
		this.material.opacity = amount;
		if (amount < 0.1) {
			this.visible = false;
		}
	});
}

// Applies a gradient from a data source to textures
function applyGradient(source, column, multiplier) {
	$.each(groupStatbox, function(i) {
		// Find the data
		var featurename = this.name;
		var data1 = $.grep(source, function(n) { 
			return (featurename.indexOf(n.Kanton) > -1); });
		if (data1.length == 0) {
			return console.log("[Error] Could not match " + featurename); }

		// Update the scale
		value1 = data1[0][column] / groupPyramids[i].datamultp;
		value1 = (value1 < 0.1) ? 0.1 : value1;
		//value1 = (value1 > 1.0) ? 1.0 : value1;
		//console.log("Applying data: " + featurename + " - " + value1);

		// Set the color
		//THREE.ColorUtils.adjustHSV(box.material.color, 0, 0, 10*(value1 - 0.5) );

		// Update the scale
		this.scale.setZ(value1);
		this.position.y = value1/2;
		this.material.opacity = 0.4;
		this.visible = true;
	});
}

// Resets the gradient
function clearGradients() {
	if (!groupStatbox[0].visible) return;
	$.each(groupStatbox, function() {
		this.visible = false;
	});
}
