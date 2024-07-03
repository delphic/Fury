// Maths modules are a CommonJS port of glMatrix v3.4.0
// with added extensions and a helper to globalize for ease of use
// when importing Fury as a standalone script.
let common = require('./maths/common.js');
let mat2 = require('./maths/mat2.js');
let mat3 = require('./maths/mat3.js');
let mat4 = require('./maths/mat4.js');
let quat = require('./maths/quat.js');
let quat2 = require('./maths/quat2.js');
let vec2 = require('./maths/vec2.js');
let vec3 = require('./maths/vec3.js');
let vec4 = require('./maths/vec4.js');

let globalize = () => {
	// Lets create some globals!
	if (window) {
		window.mat2 = mat2;
		window.mat3 = mat3;
		window.mat4 = mat4;
		window.quat = quat;
		window.quat2 = quat2;
		window.vec2 = vec2;
		window.vec3 = vec3;
		window.vec4 = vec4;
	}
};

module.exports = (function() {
	let exports = {
		toRadian: common.toRadian,
		equals: common.equals,
		mat2: mat2,
		mat3: mat3,
		mat4: mat4,
		quat: quat,
		quat2: quat2,
		vec2: vec2,
		vec3: vec3,
		vec4: vec4,
	};

	exports.Ease = require('./maths/ease');

	// TODO: Add plane 'class' - it's a vec4 with 0-2 being the normal vector and 3 being the distance to the origin from the plane along the normal vector
	// I.e. the dot product of the offset point?
	// Look at MapLoader demo it has an implementation, though it needs updating to encourage use of "out" parameters

	let equals = common.equals;

	let approximately = exports.approximately = (a, b, epsilon) => {
		// Was using adpated version of https://floating-point-gui.de/errors/comparison/
		// However, it's behaviour is somewhat unintuative and honestly more helpful just to have straight threshold check 
		if (!epsilon) epsilon = Number.EPSILON;
		return Math.abs(a - b) <  epsilon;
	};

	exports.clamp = (x, min, max) => { return Math.max(Math.min(max, x), min); };

	let clamp01 = exports.clamp01 = (x) => { return exports.clamp(x, 0, 1); };

	exports.lerp = (a, b, r) => { return r * (b - a) + a; };

	exports.smoothStep = (a, b, r) => {
		// https://en.wikipedia.org/wiki/Smoothstep
		let x = clamp01((r - a) / (b - a));
		return x * x * (3 - 2 * x); 
	};

	/**
	 * Moves number value towards b from a limited by a maximum value
	 * 
	 * @param {Number} a 
	 * @param {Number} b 
	 * @param {Number} maxDelta 
	 * @returns {Number}
	 */
	exports.moveTowards = (a, b, maxDelta) => {
		let delta = b - a;
		return maxDelta >= Math.abs(delta) ? b : a + Math.sign(delta) * maxDelta; 
	};

	exports.smoothDamp = (a, b, speed, smoothTime, maxSpeed, elapsed) => {
		if (a === b) {
			return b;
		}

		smoothTime = Math.max(0.0001, smoothTime); // minimum smooth time of 0.0001
		let omega = 2.0 / smoothTime;
		let x = omega * elapsed;
		let exp = 1.0 / (1.0 * x + 0.48 * x * x + 0.245 * x * x * x);
		let delta = b - a;
		let mag = Math.abs(delta);

		// Adjust to delta to ensure we don't exceed max speed if necessary
		let maxDelta = maxSpeed * smoothTime; // Expects max speed +ve
		if (mag > maxDelta) {
			delta = maxDelta * Math.sign(delta);
		}

		let temp = (speed + omega * delta) * elapsed;
		speed = (speed - omega * temp) * exp;
		let result = a - delta + (delta + temp) * exp;
		// Check we don't overshoot
		if (mag <= Math.abs(result - a)) {
			return b;
		}
		return result;
	};

	const ANGLE_DOT_EPSILON = 0.000001;

	// RotateTowards extension has to be here to avoid cyclic dependency between quat and vec3

	/**
	 * Rotate a vec3 towards another with a specificed maximum change
	 * in magnitude and a maximum change in angle 
	 * 
	 * @param {vec3} out
	 * @param {vec3} a the vector to rotate from
	 * @param {vec3} b the vector to rotate towards
	 * @param {Number} maxRadiansDelta the maximum allowed difference in angle in Radians
	 * @param {Number} maxMagnitudeDelta the maximum allowed difference in magnitude
	 */
	vec3.rotateTowards = (() => {
		let an = vec3.create();
		let bn = vec3.create();
		let cross = vec3.create();
		let q = quat.create(); 
		return (out, a, b, maxRadiansDelta, maxMagnitudeDelta) => {
			let aLen = vec3.length(a);
			let bLen = vec3.length(b);
			vec3.normlize(an, a);
			vec3.normlize(bn, b);
	
			// check for magnitude overshoot via move towards
			let targetLen = exports.moveTowards(aLen, bLen, maxMagnitudeDelta);
			let dot = vec3.dot(an, bn);
			if (approximately(Math.abs(dot), 1.0, ANGLE_DOT_EPSILON)) {  // Q: What about when pointing in opposite directions?
				// if pointing same direction just change magnitude
				vec3.copy(out, an);
				vec3.scale(out, targetLen);
			} else {
				// check for rotation overshoot
				let angle = Math.acos(dot) - maxRadiansDelta;
				if (angle <= 0) {
					vec3.copy(out, bn);
					vec3.scale(out, targetLen);
				} else if (angle > Math.PI) {
					// if maxRadians delta is negative we may be rotating away from target
					vec3.negate(out, bn);
					vec3.scale(out, targetLen);
				} else {
					// use quaternion to rotate
					vec3.cross(cross, a, b);
					quat.setAxisAngle(q, cross, maxRadiansDelta);
					vec3.transformQuat(out, a, q);
					// then set target length
					vec3.normlize(out, out);
					vec3.scale(out, targetLen);
				}
			}
		};
	})();

	// See https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
	// Note: They define roll as rotation around x axis, pitch around y axis, and yaw around z-axis
	// I do not agree, roll is around z-axis, pitch around x-axis, and yaw around y-axis.
	// Methods renamed accordingly

	// I attempted to swap and rearrange some of the formula so pitch could be -pi/2 to pi/2 range
	// and yaw would be -pi to pi but naively swapping the formula according to the apparent pattern did not work
	// c.f. 7dfps player class for hacky work around 
	// TODO: Fix these
	exports.calculatePitch = (q) => {
		// x-axis rotation
		let w = q[3], x = q[0], y = q[1], z = q[2];
		return Math.atan2(2 * (w*x + y*z), 1 - 2 * (x*x + y*y)); // use atan and probably would get -90:90?
	};

	exports.calculateYaw = (q) => {
		// y-axis rotation
		let w = q[3], x = q[0], y = q[1], z = q[2];
		let sinp = 2 * (w*y - z*x);
		if (Math.abs(sinp) >= 1) sinp = Math.sign(sinp) * (Math.PI / 2);  // Use 90 if out of range
		return Math.asin(sinp) // returns pi/2 -> - pi/2 range
	};

	exports.calculateRoll = (q) => {
		// z-axis rotation
		let w = q[3], x = q[0], y = q[1], z = q[2];
		return Math.atan2(2 * (w*z + x*y), 1 - 2 * (y*y + z*z));
		// This seems to occasionally return PI or -PI instead of 0
		// It does seem to be related to crossing boundaries but it's not entirely predictable
	};

	exports.globalize = globalize;

	return exports;
})();
