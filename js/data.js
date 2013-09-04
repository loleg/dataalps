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

// Applies a gradient from a data source to textures
function applyGradient(source, column, multiplier) {
	var canvas = document.getElementById('cnv');
	var context = canvas.getContext('2d');
	context.rect(0, 0, canvas.width, canvas.height);

	$.each(groupPyramids, function() {	
		featurename = this.name;
		var data1 = $.grep(source, function(n) { 
			return (featurename.indexOf(n.Kanton) > -1); });
		if (data1.length == 0) {
			console.log("[Error] Could not match " + featurename);
			return;
		}
		value1 = data1[0][column] / multiplier(featurename);
		console.log("Applying data: " + featurename + " - " + value1);
		if (value1 > 1) value1 = 0.98;

		var grd = context.createLinearGradient(0, 0, canvas.width, canvas.height);
		grd.addColorStop(0, '#db8786');   
		grd.addColorStop(value1, '#004CB3');
		grd.addColorStop(value1 + 0.01, '#ffffff');
		grd.addColorStop(1, '#ffffff');
		context.fillStyle = grd;
		context.fill();

		this.material.map.image = canvas;
		this.material.map.needsUpdate = true;
	});
}

// Resets the gradient
function clearGradients() {
	var canvas = document.getElementById('cnv');
	var context = canvas.getContext('2d');
	context.rect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#db8786';
	context.fill();

	$.each(groupPyramids, function() {
		this.material.map.image = canvas;
		this.material.map.needsUpdate = true;
	});
}
