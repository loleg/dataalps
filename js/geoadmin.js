var map, api14, mapData = null, map3D = null;
var cantonGenf = null;
$(document).ready(function() {

	// Initialize Swiss map
	if (typeof GeoAdmin == 'undefined') {
		console.log("Unable to detect GeoAdmin API"); //return;
		mapData = [{"x":287,"y":54,"w":256,"h":256,"s":"data/map/14-0-1.jpeg"},{"x":287,"y":310,"w":256,"h":256,"s":"data/map/14-1-1.jpeg"},{"x":31,"y":54,"w":256,"h":256,"s":"data/map/14-0-0.jpeg"},{"x":31,"y":310,"w":256,"h":256,"s":"data/map/14-1-0.jpeg"},{"x":543,"y":54,"w":256,"h":256,"s":"data/map/14-0-2.jpeg"},{"x":543,"y":310,"w":256,"h":256,"s":"data/map/14-1-2.jpeg"}];
	} else {
		//document.querySelector('#map').style.background = "none";
		document.querySelector('#map').style.width  = '800px';
		document.querySelector('#map').style.height = '600px';
		api14 = new GeoAdmin.API(); 
		map = api14.createMap({ div: "map", zoom: 3 });
	}
	var btn = $('.geoadmin').click(function() {
		var state = toggleDataBtn(this);
		if (map3D != null) {
			var o = state ? 0.5 : 0;
			map3D.children.forEach(function(n) { n.material.opacity = o })
			return;
		}
		
		// Get images from map service
		if (mapData == null) {
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
		}

		map3D = new THREE.Object3D();
		
		$(mapData).each(function(i) {
			var tile = this;
			console.log("Adding tile #" + i + " w:" + tile.w + " h:" + tile.h + " url:" + tile.s);	
			var tex = THREE.ImageUtils.loadTexture(tile.s, {}, function() {
				console.log("Loaded tile #" + i);
				var plane = new THREE.Mesh(new THREE.PlaneGeometry(tile.w, tile.h), 
					new THREE.MeshBasicMaterial({ 
						map: tex,
						transparent: true,
						//shading: THREE.FlatShading, 
						overdraw: false
					}));
				plane.doubleSided = false;
				plane.dynamic = true;
				plane.overdraw = false;
				plane.position.x = tile.x;
				plane.position.y = 600-tile.y;
				plane.material.transparent = true;
				plane.material.opacity = 0.5;
				map3D.add(plane);
			});
			tex.needsUpdate = true;
		});

		// Obtained by trial and error..
		map3D.rotation.x = -Math.PI/2;
		map3D.position.set(-100, 0.02, 156); 
		map3D.scale.set(0.37,0.37,0.37);
		scene.add(map3D);

		groupMap.forEach(function(n) { if(n.name.indexOf('Genf')>-1) { cantonGenf = n; } });
	});	
});

$('#okcon').hover(function() {
	cantonGenf.material.color.setHex(0x114f48);
}, function() {
	cantonGenf.material.color.setHex(0xa95352);
});
