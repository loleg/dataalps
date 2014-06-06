var api14, SwissTopomap, SwissTopoData = null, SwissTopomap3D = null;
$(document).ready(function() {

	// Initialize Swiss map
	if (typeof GeoAdmin == 'undefined') {
		console.log("Unable to detect GeoAdmin API"); //return;
		SwissTopoData = [{"x":287,"y":54,"w":256,"h":256,"s":"data/map/14-0-1.jpeg"},{"x":287,"y":310,"w":256,"h":256,"s":"data/map/14-1-1.jpeg"},{"x":31,"y":54,"w":256,"h":256,"s":"data/map/14-0-0.jpeg"},{"x":31,"y":310,"w":256,"h":256,"s":"data/map/14-1-0.jpeg"},{"x":543,"y":54,"w":256,"h":256,"s":"data/map/14-0-2.jpeg"},{"x":543,"y":310,"w":256,"h":256,"s":"data/map/14-1-2.jpeg"}];
	} else {
		//document.querySelector('#map').style.background = "none";
		document.querySelector('#map').style.width  = '800px';
		document.querySelector('#map').style.height = '600px';
		api14 = new GeoAdmin.API(); 
		SwissTopomap = api14.createMap({ div: "map", zoom: 3 });
	}
	var btn = $('.geoadmin').click(function() {
		var state = toggleDataBtn(this);
		if (SwissTopomap3D != null) {
			var o = state ? 1 : 0;
			SwissTopomap3D.children.forEach(function(n) { n.material.opacity = o })
			return;
		}
		
		// Get images from map service
		if (SwissTopoData == null) {
			SwissTopoData = []; 
			$('#OpenLayers_Layer_WMTS_104 img.olTileImage').each(function() {
				SwissTopoData.push({
					x: parseInt($(this).css('left')), 
					y: parseInt($(this).css('top')),
					w: parseInt($(this).css('width')), 
					h: parseInt($(this).css('height')), 
					s: $(this).attr('src')
				});
			});
		}

		SwissTopomap3D = new THREE.Object3D();
		
		$(SwissTopoData).each(function(i) {
			var tile = this;
			//console.log("Adding tile #" + i + " w:" + tile.w + " h:" + tile.h + " url:" + tile.s);	
			var tex = THREE.ImageUtils.loadTexture(tile.s, {}, function() {
				//console.log("Loaded tile #" + i);
				var plane = new THREE.Mesh(new THREE.PlaneGeometry(tile.w, tile.h), 
					new THREE.MeshBasicMaterial({ 
						map: tex,
						transparent: true,
						shading: THREE.FlatShading, 
						overdraw: false
					}));
				plane.doubleSided = false;
				plane.dynamic = true;
				plane.overdraw = false;
				plane.position.x = tile.x;
				plane.position.y = 600-tile.y;
				plane.material.transparent = true;
				plane.material.opacity = 1;
				SwissTopomap3D.add(plane);
			});
			tex.needsUpdate = true;
		});

		// Obtained by trial and error..
		SwissTopomap3D.rotation.x = -Math.PI/2;
		SwissTopomap3D.scale.set(0.37,0.37,0.37);
		SwissTopomap3D.position.set(-100, 2, 156); 
		scene.add(SwissTopomap3D);
	});	
});

var cantonGenf = null, genfToggle = true;
$('#geneva').click(function() {
	if (cantonGenf == null) {
		groupMap.reverse().forEach(function(n) { 
			if(n.name.indexOf('Genf')>-1) { 
				cantonGenf = n.material;
			}
		});
	} 
    if (genfToggle) {
	   cantonGenf.color.setHex(0x114f48);
    } else {
	   cantonGenf.color.setHex(0xa95352);
    }
    genfToggle = !genfToggle;
});
