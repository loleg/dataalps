if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, controls, scene, renderer, pointLight, projector, projectorGeom;

var pppengine = null;

var groupMap = [], groupPyramids = [], groupStatbox = [];

var groupLights = null;

var dataFader = 0, clearFader = 0;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var clock = new THREE.Clock();

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
    //scene.fog = new THREE.FogExp2( 0xcccccc );
	
	// geometry
	
	projectorGeom = fitProjection(d3.geo.mercator(), data, [[-100,-75],[100,75]], true);
	renderFeatures(projectorGeom, data.features, scene, false);

	if (SwissHeatmap != null)
		renderLights(projectorGeom, SwissHeatmap.features);
	
	geoShowcase(projectorGeom);
                 
	clearGradients();
	
	camera.lookAt(groupMap[0]);	

	// renderer
	
	renderer = new THREE.WebGLRenderer({ alpha: true });
	//renderer = new THREE.CanvasRenderer();
    
    renderer.setClearColor( 0x000000, 0 );
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

	$('#loading').remove();

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
	controls.update();
	//stats.update();
	
	if (pppengine != null) {
		var dt = clock.getDelta();
		pppengine.update( dt * 0.5 );
	}

	if (typeof animator === 'function') { animator(); }

}

function render() {

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
		vect3.x += 1;
		//vect3.getPositionFromMatrix(this.worldMatrix);
		var vect2 = toXYCoords(vect3);
		var text2 = $('#pyramid' + i);
		if (text2.length == 0) {
			text2 = $('.labels')
				.append('<div id="pyramid' + i + '"></div>')
				.find('div:last')
					.html("<span>" + this.name + "</span>");
		}
		text2.css({
			left: vect2.x + 'px',
			top: vect2.y + 'px',
			width: (window.innerWidth - vect2.x) + 'px'
		});
	});
}
