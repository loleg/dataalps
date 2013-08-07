if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, controls, scene, renderer, pointLight, projector;

var pppengine = null;

var groupMap = [], groupPyramids = [], groupLights = null;

var dataFader = 0, clearFader = 0;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var clock = new THREE.Clock();

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
			
			});
		});
	});
});


// Set up data source links
$('#legendbox .population').click(function() {
	if (toggleRadioBtn(this))
		applyData(SwissPopulationBFS, $(this).html(), function() { return 28000; });
});
$('#legendbox .commuting').click(function() {
	if (toggleRadioBtn(this))
		applyData(SwissCommutersBFS, 'TotalCommuting', 
			function(featurename) { 
				return 28000;
				//var data1 = $.grep(SwissPopulationBFS, function(n) { 
				//	return (featurename.indexOf(n.Kanton) > -1); });
				//return parseInt(20000 / data1[0]['2011']); 
			});
});
$('#legendbox .heatmap').click(function() {
	var state = toggleDataBtn(this);
	if (groupLights == null) return;
	groupLights.children.forEach(function(n) { n.visible = state });
	groupLights.visible = state;
	pointLight.visible = !state;
});

// Fade out help after a few seconds
setTimeout(function() {
	$('#helpbox').fadeOut();
}, 6000);

// Some more UI patching
function toggleDataBtn(obj) {
	var isOn = $(obj).hasClass('on');
	if (isOn) $(obj).removeClass('on');
	else $(obj).addClass('on');
	return !isOn;
}
function toggleRadioBtn(obj) {
	var isOn = $(obj).hasClass('on');
	$(obj).removeClass('on').parent().parent()
		  .find('.radio.on').removeClass('on');
	if (isOn) {
		// Things to do when clearing radio
		//clearData();
		clearFader = 1;
	} else {
		$(obj).addClass('on');
	}
	return !isOn;
}

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
		this.geometry.vertices[4].z = -(this.datavalue * amount);
		this.geometry.verticesNeedUpdate = true;
		
		this.material.opacity = amount * 0.9;
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

/* given a GeoJSON Feature, return a list of Vector2s
 * describing where to draw the feature, using the provided projection. */
function path(proj, feature) {
  if (feature.geometry.type == 'Polygon') {
	return polygonPath(proj, feature.geometry.coordinates);
  } else if (feature.geometry.type == 'MultiPolygon') {
	return multiPolygonPath(proj, feature.geometry.coordinates);
  }
}

/* a GeoJSON Polygon is a set of 'rings'.  The first ring is the shape of the polygon.
 * each subsequent ring is a hole inside that polygon. */
function polygonPath(proj, rings) {
  var list = [];
  var cur  = [];

  $.each(rings, function(i, ring) {
	cur = [];

	$.each(ring, function(i, coord) {
	  var pts = proj(coord);
	  cur.push(new THREE.Vector2(pts[0], pts[1]));
	});

	list.push(cur);
  });

  return list;
}

/* a GeoJSON MultiPolgyon is just a series of Polygons. */
function multiPolygonPath(proj, polys) {
  var list = [];
  $.each(polys, function(i, poly) {
	list.push(polygonPath(proj, poly));
  });
  return list;
}

// Create lights for geo-points
function renderLights(proj, features) {
	if (groupLights != null) return;
	groupLights = new THREE.Object3D();
	$.each(features, function(i, feature) {
		var pts = proj(feature.geometry.coordinates);
	  	var vect = new THREE.Vector2();
		//console.log(feature.geometry.coordinates, vect);
		
		var intensity = feature.properties.TempTrend;
		if (intensity != null) {
	
			var color = (intensity < 0.3) ? 0x00ff00 : (intensity > 0.42) ? 0xff0000 : 0xffff00;
	
			var sphere = new THREE.Mesh(new THREE.SphereGeometry(1,1,1), new THREE.MeshBasicMaterial({ color: color }));
			sphere.overdraw = true;
			sphere.position.set(pts[0], pts[1], -5);
			sphere.visible = false;
			groupLights.add( sphere );
						
			var light = new THREE.PointLight( color, (intensity-0.3)*7 );
			light.position.set(pts[0], pts[1], -5);
			light.visible = false;
			
			groupLights.add( light );
		}
	});
	scene.add( groupLights );
	groupLights.visible = false;
}

/* for each feature, find it's X/Y Path, create shape(s) with the required holes,
 * and extrude the shape */
function renderFeatures(proj, features, scene, isState) {
  var colors = [ 0xa95352 ];
  
  $.each(features, function(i, feature) {
	var polygons = path(proj, feature);
	if (feature.geometry.type != 'MultiPolygon') {
	  polygons = [polygons];
	}
	
	var poly = polygons[0];
	//$.each(polygons, function(i, poly) {
		var shape = new THREE.Shape(poly[0]);
		//var centr = computeCentroid(poly[0]);

		if (poly.length > 1) {
			shape.holes = poly.slice(1).map(function(item) { return new THREE.Shape(item); });
		}

		var geometry = new THREE.ExtrudeGeometry(shape, { 
			amount: 20, 
			bevelEnabled: false
		});
		var c = new THREE.Mesh(geometry, 
				new THREE.MeshLambertMaterial({
					//wireframe: true,
					color: colors[groupMap.length % colors.length] }) );

		c.rotation.x = Math.PI/2;
		//c.rotation.z = Math.PI;
		//c.rotation.y = Math.PI;
		//c.translateX(-290);
		//c.translateZ(50);
		//c.translateY(5);
		c.matrixAutoUpdate = false;
		c.updateMatrix();
		scene.add(c);
		//THREE.GeometryUtils.merge(groupMap, c);

		// Assign name to this pyramid and save
		c.name = feature.properties.name;
		groupMap.push(c);

		geometry.computeBoundingBox();

		var centerX = geometry.boundingBox.min.x + 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
		var centerY = geometry.boundingBox.min.y + 0.5 * ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );

		var points = [
			new THREE.Vector3( geometry.boundingBox.min.x, geometry.boundingBox.min.y, 0 ),
			new THREE.Vector3( geometry.boundingBox.min.x, geometry.boundingBox.max.y, 0 ),
			new THREE.Vector3( geometry.boundingBox.max.x, geometry.boundingBox.max.y, 0 ),
			new THREE.Vector3( geometry.boundingBox.max.x, geometry.boundingBox.min.y, 0 ),
			new THREE.Vector3( centerX, centerY, -1 )
		];

		var g = new THREE.Mesh(new THREE.ConvexGeometry( points ), 
				new THREE.MeshLambertMaterial({
					wireframe: false, transparent: true, opacity: 0, 
					color: colors[groupMap.length % colors.length] }) );
		//g.position.set( centerX, centerY, 30 );		
		//g.position.z = 0;	
		//g.rotation.z = Math.PI;
		g.rotation.x = Math.PI/2;
		//g.matrix.setRotationFromEuler(g.rotation); 
		scene.add(g);

		// Assign name to this pyramid and save
		g.name = feature.properties.name;
		groupPyramids.push(g);
	//});
  });
}

// Main WebGL init loop
function init(data) {

	container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	// camera

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000 );

	//camera.up = new THREE.Vector3(0,0,1);
	camera.position.set(0.3831291366180984, 126.37152933913376, 139.75796689218083);
	//camera.rotation.set(-0.6667187067008896, 0.002743155876198529, 0.0021586578725886407);
	
	// controls
	
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );
	
	//controls = new THREE.FirstPersonControls( camera );
	//controls.movementSpeed = 100;
	//controls.lookSpeed = 0.1;
	
	// scene

	scene = new THREE.Scene();
	
	projector = new THREE.Projector();
	
	// lights
	
	scene.add( new THREE.AmbientLight( 0x333333 ) );
	
	pointLight = new THREE.PointLight( 0xffffff, 2 );
	pointLight.position.y = 150;
	scene.add( pointLight );

	//scene.fog = new THREE.FogExp2(0xa95352, 0.0005);
		
	// textures
	
	
	
	// geometry
	
	var projG = fitProjection(d3.geo.mercator(), data, [[-100,-75],[100,75]], true);
	
	renderFeatures(projG, data.features, scene, false);
	renderLights(projG, SwissHeatmap.features);
	camera.lookAt(groupMap[0]);	

	// renderer
	
	renderer = new THREE.WebGLRenderer();
	//renderer = new THREE.CanvasRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	// stats
	/*
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );
	*/
	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );
	render();
	//stats.update();
	controls.update();
	
	var dt = clock.getDelta();
	if (pppengine != null)
		pppengine.update( dt * 0.5 );

}

function render() {

	//plane.rotation.y = cube.rotation.y += ( targetRotation - cube.rotation.y ) * 0.05;
	
	//controls.update( clock.getDelta() );
	
	/*
	 camera.lookAt( scene.position );

	  var timer = new Date().getTime() * 0.0005;
	 
	  camera.position.x = Math.floor(Math.cos( timer ) * 1900);
	  camera.position.z = Math.floor(Math.sin( timer ) * 1900);
	*/
	
	
	if (dataFader < 1) {
		dataFader += 0.01 + ((dataFader)/40);
		renderData();
	}
	
	if (clearFader > 0) {
		clearFader -= 0.05;
		clearData(clearFader);
	}

	renderer.render( scene, camera );
	
	camera.updateMatrixWorld();
	
	renderOverlay();
}



function toXYCoords(pos) {
	var vector = projector.projectVector(pos.clone(), camera);
	vector.x = (vector.x + 1)/2 * window.innerWidth;
	vector.y = -(vector.y - 1)/2 * window.innerHeight;
	return vector;
}

function renderOverlay() {
	$.each(groupPyramids, function(i) {
		this.updateMatrixWorld();
		var vect3 = this.geometry.vertices[4].clone();
		vect3.applyMatrix4(this.matrixWorld);
		vect3.y += 1;
		//vect3.getPositionFromMatrix(this.worldMatrix);
		var vect2 = toXYCoords(vect3);
		var text2 = $('#pyramid' + i);
		if (text2.length == 0) {
			text2 = $('.labels')
				.append('<div id="pyramid' + i + '"></div>')
				.find('div:last');
			text2.css({
				position: 'absolute', backgroundColor: '#fff',
				width: 100, height: 10
			}).html(this.name);
		}
		text2.css({
			left: vect2.x + 'px',
			top: vect2.y + 'px'
		});
	});
}
