var map, api14, mapData, map3D = null;
var cantonGenf = null;
$(document).ready(function() {

	// Initialize Swiss map
	if (typeof GeoAdmin == 'undefined') {
		console.log("Unable to detect GeoAdmin API"); return;
	}
	//document.querySelector('#map').style.background = "none";
	document.querySelector('#map').style.width  = '800px';
	document.querySelector('#map').style.height = '600px';
	api14 = new GeoAdmin.API(); 
	map = api14.createMap({ div: "map", zoom: 3 });

	var btn = $('.geoadmin').click(function() {
		var state = toggleDataBtn(this);
		if (map3D != null) {
			var o = state ? 0.5 : 0;
			map3D.children.forEach(function(n) { n.material.opacity = o })
			return;
		}
		
		// Get images
		mapData = []; 
		$('#OpenLayers_Layer_WMTS_104 img.olTileImage').each(function() {
			mapData.push({
				x: parseInt($(this).css('left')), 
				y: parseInt($(this).css('top')),
				w: parseInt($(this).css('width')), 
				h: parseInt($(this).css('height')), 
				s: $(this).attr('src')
			});
		});
		
		map3D = new THREE.Object3D();
		
		$(mapData).each(function() {
		
			var tex = THREE.ImageUtils.loadTexture(this.s);
			tex.needsUpdate = true;
			var plane = new THREE.Mesh(new THREE.PlaneGeometry(this.w, this.h), 
				new THREE.MeshBasicMaterial({ 
					map: tex,
					transparent: true,
					//shading: THREE.FlatShading, 
					overdraw: false
				}));
			plane.doubleSided = false;
			plane.dynamic = true;
			plane.overdraw = false;
			plane.position.x = this.x;
			plane.position.y = 600-this.y;
			plane.material.transparent = true;
			plane.material.opacity = 0.5;
			map3D.add(plane);
			
		});
		
		map3D.rotation.x = -Math.PI/2;
		
		// Don't ask how I got these values..
		map3D.position.set(-100, 0.01, 156); 
		map3D.scale.set(0.37,0.37,0.37);
					
		scene.add(map3D);

		groupMap.forEach(function(n) { if(n.name.contains('Genf')) { cantonGenf = n; } });
	});

	setTimeout(function() { btn.click(); }, 1500);
	
});

$('#okcon').hover(function() {
	cantonGenf.material.color.setHex(0x114f48);
}, function() {
	cantonGenf.material.color.setHex(0xa95352);
});