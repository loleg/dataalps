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

function geoShowcase(proj) {

    // Find us on the map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          function (pos) {
            var lonlat = [pos.coords.longitude, pos.coords.latitude];
              
            var pts = proj(lonlat);	
            var color = 0x3333ff;
            var sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 1, 1), 
                        new THREE.MeshBasicMaterial({ color: color }));
            sphere.overdraw = true;
            sphere.position.set(pts[0], 3, pts[1]);
            sphere.visible = true;
            scene.add( sphere );
          });
    }
    
    // Add towers
    $.get('data/antennes.xml', function(data) {
        groupLights = new THREE.Object3D();
        EPSG2056 = "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs";
        $('osm node', data).each(function() { 
            var lat = parseFloat($(this).attr('lat'));
            var lon = parseFloat($(this).attr('lon'));
            var hgt = parseInt($('tag', this).attr('v'))/10;
            var pxy = proj4(EPSG2056, proj4.WGS84, [lon, lat]);
            var pts = proj(pxy);	
            var color = 0x33ff33;
            var ssize = 0.2;
            var sphere = new THREE.Mesh(new THREE.SphereGeometry(ssize, ssize, ssize), 
                        new THREE.MeshBasicMaterial({ color: color }));
            sphere.overdraw = true;
            sphere.position.set(pts[0], hgt, pts[1]);
            sphere.visible = true;
            groupLights.add( sphere );
        }); 
        scene.add( groupLights );
        groupLights.visible = false;
    });
    
    // Highlight a canton
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
        
        // Zoom to it
        
        // Show extra data
        groupLights.visible = true;
    });
}