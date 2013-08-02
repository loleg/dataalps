if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, controls, scene, renderer;

var pppengine = null;

var groupMap = [], groupPyramids = [];

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
		
		$.getJSON('data/swiss-cantons-simplified.json', function(geodata) {

			init(geodata);
			animate();
			
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

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000 );
	//camera.position.set( 201.7, 14.5, 228 );
	
	
	controls = new THREE.OrbitControls( camera );
	controls.addEventListener( 'change', render );
	
	//controls = new THREE.FirstPersonControls( camera );
	//controls.movementSpeed = 100;
	//controls.lookSpeed = 0.1;

	scene = new THREE.Scene();
	
	// lights
	
	scene.add( new THREE.AmbientLight( 0x555555 ) );
	
	pointLight = new THREE.PointLight( 0xffffff, 2 );
	pointLight.position.y = 150;
	scene.add( pointLight );

	scene.fog = new THREE.FogExp2(0xa95352, 0.0005);
		
	// textures
	
	
	
	// geometry
	
	var proj = fitProjection(d3.geo.mercator(), data, [[-100,-75],[100,75]], true);
	
	renderFeatures(proj, data.features, scene, false);
	
	// camera
		
	camera.lookAt(groupMap[0]);
	
	camera.position.set(0.3831291366180984, 126.37152933913376, 139.75796689218083);
	camera.rotation.set(-0.6667187067008896, 0.002743155876198529, 0.0021586578725886407);

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

// August 1 Special edition fireworks
// Lee Stemkoski's Particle Engine
function fireworks() {

	if (pppengine != null) pppengine.destroy();
	if (typeof ParticleEngine == 'undefined') return;
	pppengine = new ParticleEngine();
	pppengine.setValues({
		positionStyle  : Type.SPHERE,
		positionBase   : new THREE.Vector3( -100+(200*Math.random()), 100, -100 +(200*Math.random()) ),
		positionRadius : 10,
		
		velocityStyle  : Type.SPHERE,
		speedBase      : 45,
		speedSpread    : 10,
		
		accelerationBase : new THREE.Vector3( 0, -80, 0 ),
		
		particleTexture : THREE.ImageUtils.loadTexture( 'images/spark.png' ),
		
		sizeTween    : new Tween( [0.5, 0.7, 1.3], [5, 40, 1] ),
		opacityTween : new Tween( [0.2, 0.7, 2.5], [0.75, 1, 0] ),
		colorTween   : new Tween( [0.4, 0.8, 1.0], [ new THREE.Vector3(0,1,1), new THREE.Vector3(0,1,0.6), new THREE.Vector3(0.8, 1, 0.6) ] ),
		blendStyle   : THREE.AdditiveBlending,  
		
		particlesPerSecond : 3000,
		particleDeathAge   : 2.5,		
		emitterDeathAge    : 0.2
	});
	pppengine.initialize();

	setTimeout(fireworks, 4000 + (3000 * Math.random()));
}
setTimeout(fireworks, 6000);
//

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
	
	renderer.render( scene, camera );
	
	if (dataFader < 1) {
		dataFader += 0.01 + ((dataFader)/40);
		renderData();
	}
	
	if (clearFader > 0) {
		clearFader -= 0.05;
		clearData(clearFader);
	}
	
}