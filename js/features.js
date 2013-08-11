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
	
			var color = (intensity < 0.3) ? 0x0055aa : (intensity > 0.42) ? 0xff3333 : 0xdddd00;
	
			var sphere = new THREE.Mesh(new THREE.SphereGeometry(1,1,1), 
							new THREE.MeshBasicMaterial({ color: color }));
			sphere.overdraw = true;
			sphere.position.set(pts[0], 3, pts[1]);
			sphere.visible = false;
			groupLights.add( sphere );
						
			var light = new THREE.PointLight( color, 0.8 );
			light.position.set(pts[0], 3, pts[1]);
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
	var shape = new THREE.Shape(poly[0]);
	//var centr = computeCentroid(poly[0]);
	/*if (poly.length > 1) {
		shape.holes = poly.slice(1).map(function(item) { return new THREE.Shape(item); });
	}*/

	var geometry = new THREE.ExtrudeGeometry(shape, { 
		amount: 20, 
		bevelEnabled: false
	});
	var geoShape = new THREE.Mesh(geometry, 
			new THREE.MeshLambertMaterial({
				//wireframe: true,
				color: colors[groupMap.length % colors.length] }) );

	geoShape.rotation.x = Math.PI/2;
	geoShape.matrixAutoUpdate = false;
	geoShape.updateMatrix();
	scene.add(geoShape);

	// Assign name to this group and save
	geoShape.name = feature.properties.name;
	groupMap.push(geoShape);

	// Create geometry from geoShape's bounding box
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

	// Set up geometry and configure material
	var pGeometry = new THREE.ConvexGeometry(points);
	var pMaterial = new THREE.MeshLambertMaterial({
				wireframe: false, transparent: true, opacity: 1, 
				color: colors[groupMap.length % colors.length] });

	var pyramid = new THREE.Mesh(pGeometry, pMaterial);
	pyramid.rotation.x = Math.PI/2;
	scene.add(pyramid);
	pMaterial.opacity = 0;

	// Assign name to this pyramid and save
	pyramid.name = feature.properties.name;
	groupPyramids.push(pyramid);
  });
}
