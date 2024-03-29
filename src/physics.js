const vec3 = require('./maths').vec3;

module.exports = (function(){
	// https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection

	let exports = {};

	// For now a box is an AABB - in future we'll need to allow rotation
	let Box = exports.Box = require('./bounds');

	exports.Sphere = (function() {
		let exports = {};
		let prototype = {};

		exports.contains = function(point, sphere) {
			let dx = point[0] - sphere.center[0], dy = point[1] - sphere.center[1], dz = point[2] - sphere.center[2];
			let sqrDistance = dx * dx + dy * dy + dz * dz;
			return sqrDistance < sphere.radius * sphere.radius;
		};

		exports.intersect = function(a, b) {
			let dx = a.center[0] - b.center[0], dy = a.center[1] - b.center[1], dz = a.center[2] - b.center[2];
			let sqrDistance = dx * dx + dy * dy + dz * dz;
			return sqrDistance < (a.radius + b.radius) * (a.radius + b.radius);
		};
		
		exports.intersectBox = function(box, sphere) {
			return Box.intersectSphere(sphere, box);
		};
		
		exports.create = function({ center = vec3.create(), radius = 0 }) {
			let sphere = Object.create(prototype);
			sphere.center = center;
			sphere.radius = radius;
			return sphere;
		};
	
		return exports;
	})();
	
	return exports;
})();
