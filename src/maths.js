// This is a centralised point for importing glMatrix
// Also provides a helper for globalizing for ease of use
let { glMatrix, mat2, mat3, mat4, quat, quat2, vec2, vec3, vec4  } = require('gl-matrix');

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

// Use of object freeze has funnily enough frozen these objects
// if we wish to extend we'll need to update our fork of glMatrix (done)
// make the changes and then build - I *think* we just want to remove the freezes?
// then we can extend it here for clarity?

module.exports = (function() {
	// Modern Browsers perform better using native arrays rather than typed arrays
	// It also (de)serializes more cleanly so...
	glMatrix.setMatrixArrayType(Array);

	let exports = {
		glMatrix: glMatrix,
		toRadian: glMatrix.toRadian,
		equals: glMatrix.equals,
		mat2: mat2,
		mat3: mat3,
		mat4: mat4,
		quat: quat,
		quat2: quat2,
		vec2: vec2,
		vec3: vec3,
		vec4: vec4
	};

	exports.Ease = require('./ease');

	// TODO: Add plane 'class' - it's a vec4 with 0-2 being the normal vector and 3 being the distance to the origin from the plane along the normal vector
	// I.e. the dot product of the offset point?

	let vec3X = exports.vec3X = vec3.fromValues(1,0,0);
	let vec3Y = exports.vec3Y = vec3.fromValues(0,1,0);
	let vec3Z = exports.vec3Z = vec3.fromValues(0,0,1);
	exports.vec3Zero = vec3.fromValues(0,0,0);
	exports.vec3One = vec3.fromValues(1,1,1);

	exports.vec3Pool = (function(){
		let stack = [];
		for (let i = 0; i < 5; i++) {
			stack.push(vec3.create());
		}
		
		return {
			return: (v) => { stack.push(v); },
			request: () => {
				if (stack.length > 0) {
					return stack.pop();
				}
				return vec3.create();
			}
		}
	})();

	exports.quatPool = (function(){
		let stack = [];
		for (let i = 0; i < 5; i++) {
			stack.push(quat.create());
		}
		
		return {
			return: (v) => { stack.push(v); },
			request: () => {
				if (stack.length > 0) {
					return stack.pop();
				}
				return quat.create();
			}
		}
	})();

	let equals = glMatrix.equals;

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

	let moveTowards = exports.moveTowards = (a, b, maxDelta) => {
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

	const angleDotEpison = 0.000001;  // If the dot product 

	// vec3 extensions adapated from https://graemepottsfolio.wordpress.com/2015/11/26/vectors-programming/
	// TODO: Tests

	exports.vec3Slerp = (() => {
		let an = vec3.create(), bn = vec3.create();
		return (out, a, b, t) => {
			vec3.normlize(an, a);
			vec3.normlize(bn, b);
			let dot = vec3.dot(an, bn);
			if (approximately(Math.abs(dot), 1.0, angleDotEpison)) {
				// lerp
				vec3.lerp(out, a, b, t);
			} else {
				// Slerp
				// a * sin ( theta * (1 - t) / sin (theta)) + b * (sin(theta * t) / sin(theta)) where theta = acos(|a|.|b|)
				let theta = Math.acos(dot);
				let sinTheta = Math.sin(theta);
				let ap = Math.sin(theta * (1.0 - t)) / sinTheta;
				let bp = Math.sin(theta * t ) / sinTheta;
				out[0] = a[0] * ap + b[0] * bp;
				out[1] = a[1] * ap + b[1] * bp;
				out[2] = a[2] * ap + b[2] * bp;
			}
		};
	})(); 

	exports.vec3MoveTowards = (() => {
		let delta = vec3.create();
		return (out, a, b, maxDelta) => {
			vec3.sub(delta, b, a);
			let sqrLen = vec3.sqrDist(a, b); 
			let sqrMaxDelta = maxDelta * maxDelta;
			if (sqrMaxDelta >= sqrLen) {
				vec3.copy(out, b);
			} else {
				vec3.scaleAndAdd(a, delta, sqrMaxDelta / sqrLen)
			}
		}; 
	})();

	exports.vec3RotateTowards = (() => {
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
			let targetLen = moveTowards(aLen, bLen, maxMagnitudeDelta);
			let dot = vec3.dot(an, bn);
			if (approximately(Math.abs(dot), 1.0, angleDotEpison)) {  // Q: What about when pointing in opposite directions?
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

	exports.vec3SmoothDamp = (() => {
		let delta = vec3.create();
		let temp = vec3.create();
		return (out, a, b, velocity, smoothTime, maxSpeed, elapsed) => { // Q: Should have outVelocity?
			if (vec3.equals(a, b)) {
				vec3.copy(out, b);
			} else {
				// Derivation: https://graemepottsfolio.wordpress.com/2016/01/11/game-programming-math-libraries/
				smoothTime = Math.max(0.0001, smoothTime); // minimum smooth time of 0.0001
				let omega = 2.0 / smoothTime;
				let x = omega * elapsed;
				let exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.245 * x * x * x);
				vec3.sub(delta, a, b);
				let length = vec3.length(delta);
				let maxDelta = maxSpeed * smoothTime;

				let deltaX = Math.min(length, maxDelta);
				vec3.scale(delta, delta, deltaX / length);

				// temp = (velocity + omega * delta) * elapsed
				vec3.scaleAndAdd(temp, velocity, delta, omega);
				vec3.scale(temp, temp, elapsed);

				// velocity = (velocity - omega * temp) * exp
				vec3.scaleAndAdd(velocity, velocity, temp, -omega);
				vec3.scale(velocity, velocity, exp);

				// out = a - delta + (delta + temp) * exp;
				vec3.sub(out, a, delta);
				vec3.scaleAndAdd(out, out, delta, exp);
				vec3.scaleAndAdd(out, out, temp, exp);

				// Ensure we don't overshoot
				if (vec3.sqrDist(b, a) <= vec3.sqrDist(out, a)) {
					vec3.copy(out, b);
					vec3.zero(velocity);
				}
			}
		};
	})();

	exports.vec3ToString = (v) => { return "(" + v[0] + ", " + v[1] + ", " + v[2] + ")"; };

	exports.quatEuler = (x, y, z) => {
		let q = quat.create();
		quat.fromEuler(q, x, y, z);
		return q;
	};

	exports.quatIsIdentity = (q) => {
		// Is the provided quaterion identity
		return (equals(q[0], 0) && equals(q[1], 0) && equals(q[2], 0) && equals(q[3], 1));
	};

	exports.quatRotate = (function() {
		let i = quat.create();
		return (out, q, rad, axis) => {
			quat.setAxisAngle(i, axis, rad);
			return quat.multiply(out, i, q);
		};
	})();

	exports.quatLocalAxes = (q, localX, localY, localZ) => {
		vec3.transformQuat(localX, vec3X, q);
		vec3.transformQuat(localY, vec3Y, q);
		vec3.transformQuat(localZ, vec3Z, q);
	};

	// See https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
	// Note: They define roll as rotation around x axis, pitch around y axis, and yaw around z-axis
	// I do not agree, roll is around z-axis, pitch around x-axis, and yaw around y-axis.
	// Methods renamed accordingly

	// I attempted to swap and rearrange some of the formula so pitch could be -pi/2 to pi/2 range
	// and yaw would be -pi to pi but naively swapping the formula according to the apparent pattern did not work
	// c.f. 7dfps player class for hacky work around - TODO: Fix these
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
