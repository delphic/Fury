const vec3 = require('./maths').vec3;

module.exports = (function(){
	// https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection

	let exports = {};

	// For now a box is an AABB - in future we'll need to allow rotation
	let Box = exports.Box = require('./bounds');

	exports.Sphere = (function() {
		let exports = {};
		let prototype = {};

		let cacheVec3 = vec3.create();

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

		// out is vec3 of intersection point, returns intersection time or 0 if no intersection
		exports.rayCast = function(out, origin, direction, sphere) {
			// Ray = origin + time * direction
			// (intersection - sphere.center) . (intersection - sphere.center) = sphere.radius * sphere.radius
			// => (origin - sphere.center + time * direction) . (origin - sphere.center + time * direction) = spehere.radius * sphere.radius
			// Let m = origin - sphere.center, t = time, d = direction and r = sphere.radius
			// simplifies to: (m + td) . (m + td) = r*r
			// leading to quadratic equation: t*t + 2(m.d)t + (m.m) - r*r = 0
			// quadric formula: t = -b +/- sqrt(b*b - c)
			// b = m.d, c = m.m - r*r
			// discriminant (b*b - c): < 0 => no intersection, 0 => one root, > 0 implies 2 roots
			let m = cacheVec3;
			vec3.subtract(m, origin, sphere.center);
			let b = vec3.dot(m, direction);
			let c = vec3.dot(m, m) - sphere.radius * sphere.radius;
	
			if (c > 0 && b > 0) {
				// origin outside sphere (c > 0) & direction points away from sphere (b > 0)
				// No intersection
				return 0;
			}
			if (c < 0) {
				// origin inside sphere, which we exclude by convention
				return 0;
			}
			
			let discriminant = b * b - c;
			if (discriminant < 0) {
				// No real roots
				return 0;
			}
			
			let t = -b - Math.sqrt(discriminant);
			if (t < 0) {
				// Note shouldn't happen (implies inside the sphere, which we have excluded)
				t = 0;
			}
			vec3.scaleAndAdd(out, origin, direction, t);
			return t;
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
