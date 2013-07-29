if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, controls, scene, renderer;

var cube, plane, grp;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var clock = new THREE.Clock();

$.getJSON('data/swiss-cantons-simplified.json', function(data) {

	init(data);
	animate();

});

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
  var colors = [ 0x33ccff, 0x33595B, 0x566999, 0x162978 ];
  
  var shapeGroup = [];

  $.each(features, function(i, feature) {
	var polygons = path(proj, feature);
	if (feature.geometry.type != 'MultiPolygon') {
	  polygons = [polygons];
	}
	
	$.each(polygons, function(i, poly) {
	  var shape = new THREE.Shape(poly[0]);
	  //var centr = computeCentroid(poly[0]);

	  if (poly.length > 1) {
		shape.holes = poly.slice(1).map(function(item) { return new THREE.Shape(item); });
	  }

	  var geom = new THREE.ExtrudeGeometry(shape, { 
			amount: 20, 
			bevelEnabled: true,
			bevelThickness: 40,
			bevelSegments: 1
		});
	  var c = new THREE.Mesh(geom, 
				new THREE.MeshLambertMaterial({
					//wireframe: true,
					color: colors[shapeGroup.length % colors.length] }) );

	  c.rotation.z = Math.PI;
	  c.rotation.y = Math.PI;
	  //c.translateX(-290);
	  //c.translateZ(50);
	  //c.translateY(5);

	  scene.add(c);
	  //THREE.GeometryUtils.merge(shapeGroup, c);
	  shapeGroup.push(c);
	});
  });
  
  return shapeGroup;
}

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
	
	scene.add( new THREE.AmbientLight( 0x999999 ) );
	
	pointLight = new THREE.PointLight( 0xffffff, 1 );
	pointLight.position.z = 50;
	scene.add( pointLight );

	scene.fog = new THREE.FogExp2(0xD6F1FF, 0.0005);
		
	// textures
	
	
	
	// geometry
	
	var proj = fitProjection(d3.geo.mercator(), data, [[-100,-75],[100,75]], true);
	
	grp = renderFeatures(proj, data.features, scene, false);
	
	//scene.add(grp);
	
	camera.position.set(grp[0].position.x, grp[0].position.y, grp[0].position.z + 200);
	camera.lookAt(grp[0]);
	

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

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

//

//

function animate() {

	requestAnimationFrame( animate );
	render();
	stats.update();
	controls.update();

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
	
}