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

		particleTexture : THREE.ImageUtils.loadTexture( 'res/spark.png' ),

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