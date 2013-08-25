// *** Based on https://github.com/pierriko/threeviz
function createHeightMap(url) {

    // load the heightmap we created as a texture
    var texture = THREE.ImageUtils.loadTexture('data/height/ch-contours-bw.png');

    // load two other textures we'll use to make the map look more real
    var detailTexture = THREE.ImageUtils.loadTexture("data/height/ch-contours.png");

    // the following configuration defines how the terrain is rendered
    var terrainShader = THREE.ShaderTerrain[ "terrain" ];
    var uniformsTerrain = THREE.UniformsUtils.clone(terrainShader.uniforms);

    // how to treat abd scale the normal texture
    uniformsTerrain[ "tNormal" ].value = detailTexture;
    uniformsTerrain[ "uNormalScale" ].value = 1;

    // the displacement determines the height of a vector, mapped to
    // the heightmap
    uniformsTerrain[ "tDisplacement" ].value = texture;
    uniformsTerrain[ "uDisplacementScale" ].value = 30;

    // the following textures can be use to finetune how
    // the map is shown. These are good defaults for simple
    // rendering
    uniformsTerrain[ "tDiffuse1" ].value = detailTexture;
    uniformsTerrain[ "tDetail" ].value = detailTexture;
    uniformsTerrain[ "enableDiffuse1" ].value = true;
    uniformsTerrain[ "enableDiffuse2" ].value = true;
    uniformsTerrain[ "enableSpecular" ].value = true;

    // diffuse is based on the light reflection
    uniformsTerrain[ "uDiffuseColor" ].value.setHex(0xcccccc);
    uniformsTerrain[ "uSpecularColor" ].value.setHex(0xff0000);
    // is the base color of the terrain
    uniformsTerrain[ "uAmbientColor" ].value.setHex(0x0000cc);

    // how shiny is the terrain
    uniformsTerrain[ "uShininess" ].value = 3;

    // handles light reflection
    uniformsTerrain[ "uRepeatOverlay" ].value.set(6, 6);

    // configure the material that reflects our terrain
    var material = new THREE.ShaderMaterial({
        uniforms:uniformsTerrain,
        vertexShader:terrainShader.vertexShader,
        fragmentShader:terrainShader.fragmentShader,
        wireframe:true,
        lights:true,
        fog:false
    });

    // we use a plane to render as terrain
    HeightmapRes = 128;
    var geometry = new THREE.PlaneGeometry(426, 300, HeightmapRes, HeightmapRes);
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeTangents();

    // create a 3D object to add
    var terrain = new THREE.Mesh(geometry, material);
    terrain.position.set(0, 0, -0.2);
    terrain.rotation.x = -Math.PI / 2;
    terrain.scale.setLength(0.8);

    return terrain;
}

function toggleHeightMap(state) {
    if (state) {
        SetupHeightMap = {
            plx: pointLight.position.x,
            ply: pointLight.position.y,
            ins: pointLight.intensity
        };
        /*pointLight.position.x = -200;
        pointLight.position.y = 160;
        pointLight.intensity = 8;*/
        scene.remove(groupLights);
        //$.each(groupMap, function() { this.visible = false; })
        scene.add(SwissHeightmap);
    } else {
        pointLight.position.x = SetupHeightMap.plx;
        pointLight.position.y = SetupHeightMap.ply;
        pointLight.intensity = SetupHeightMap.ins;
        SetupHeightMap = null;
        scene.remove(SwissHeightmap);
        //$.each(groupMap, function() { this.visible = true; })
        scene.add(groupLights);
    }
}