const { ANGLE_ORDER, ARRAY_TYPE, EPSILON, RANDOM, equals } = require("./common.js");
const mat3 = require("./mat3.js");
const vec3 = require("./vec3.js");
const vec4 = require("./vec4.js");

/**
 * Quaternion in the format XYZW
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
exports.create = function() {
	let out = new ARRAY_TYPE(4);
	out[0] = 0;
	out[1] = 0;
	out[2] = 0;
	out[3] = 1;
	return out;
};

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
exports.identity = function(out) {
	out[0] = 0;
	out[1] = 0;
	out[2] = 0;
	out[3] = 1;
	return out;
};

const setAxisAngle = 
/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
exports.setAxisAngle = function(out, axis, rad) {
	rad = rad * 0.5;
	let s = Math.sin(rad);
	out[0] = s * axis[0];
	out[1] = s * axis[1];
	out[2] = s * axis[2];
	out[3] = Math.cos(rad);
	return out;
};

/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  {vec3} out_axis  Vector receiving the axis of rotation
 * @param  {ReadonlyQuat} q     Quaternion to be decomposed
 * @return {Number}     Angle, in radians, of the rotation
 */
exports.getAxisAngle = function(out_axis, q) {
	let rad = Math.acos(q[3]) * 2.0;
	let s = Math.sin(rad / 2.0);
	if (s > EPSILON) {
		out_axis[0] = q[0] / s;
		out_axis[1] = q[1] / s;
		out_axis[2] = q[2] / s;
	} else {
		// If s is zero, return any axis (no rotation - axis does not matter)
		out_axis[0] = 1;
		out_axis[1] = 0;
		out_axis[2] = 0;
	}
	return rad;
};

/**
 * Gets the angular distance between two unit quaternions
 *
 * @param  {ReadonlyQuat} a     Origin unit quaternion
 * @param  {ReadonlyQuat} b     Destination unit quaternion
 * @return {Number}     Angle, in radians, between the two quaternions
 */
exports.getAngle = function(a, b) {
	let dotproduct = dot(a, b);

	return Math.acos(2 * dotproduct * dotproduct - 1);
};

const multiply =
/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 */
exports.multiply = function(out, a, b) {
	let ax = a[0],
		ay = a[1],
		az = a[2],
		aw = a[3];
	let bx = b[0],
		by = b[1],
		bz = b[2],
		bw = b[3];

	out[0] = ax * bw + aw * bx + ay * bz - az * by;
	out[1] = ay * bw + aw * by + az * bx - ax * bz;
	out[2] = az * bw + aw * bz + ax * by - ay * bx;
	out[3] = aw * bw - ax * bx - ay * by - az * bz;
	return out;
};

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
exports.rotateX = function(out, a, rad) {
	rad *= 0.5;

	let ax = a[0],
		ay = a[1],
		az = a[2],
		aw = a[3];
	let bx = Math.sin(rad),
		bw = Math.cos(rad);

	out[0] = ax * bw + aw * bx;
	out[1] = ay * bw + az * bx;
	out[2] = az * bw - ay * bx;
	out[3] = aw * bw - ax * bx;
	return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
exports.rotateY = function(out, a, rad) {
	rad *= 0.5;

	let ax = a[0],
		ay = a[1],
		az = a[2],
		aw = a[3];
	let by = Math.sin(rad),
		bw = Math.cos(rad);

	out[0] = ax * bw - az * by;
	out[1] = ay * bw + aw * by;
	out[2] = az * bw + ax * by;
	out[3] = aw * bw - ay * by;
	return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
exports.rotateZ = function(out, a, rad) {
	rad *= 0.5;

	let ax = a[0],
		ay = a[1],
		az = a[2],
		aw = a[3];
	let bz = Math.sin(rad),
		bw = Math.cos(rad);

	out[0] = ax * bw + ay * bz;
	out[1] = ay * bw - ax * bz;
	out[2] = az * bw + aw * bz;
	out[3] = aw * bw - az * bz;
	return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate W component of
 * @returns {quat} out
 */
exports.calculateW = function(out, a) {
	let x = a[0],
		y = a[1],
		z = a[2];

	out[0] = x;
	out[1] = y;
	out[2] = z;
	out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
	return out;
};

const exp =
/**
 * Calculate the exponential of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */
exports.exp = function(out, a) {
	let x = a[0],
		y = a[1],
		z = a[2],
		w = a[3];

	let r = Math.sqrt(x * x + y * y + z * z);
	let et = Math.exp(w);
	let s = r > 0 ? (et * Math.sin(r)) / r : 0;

	out[0] = x * s;
	out[1] = y * s;
	out[2] = z * s;
	out[3] = et * Math.cos(r);

	return out;
};

const ln =
/**
 * Calculate the natural logarithm of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */
exports.ln = function(out, a) {
	let x = a[0],
		y = a[1],
		z = a[2],
		w = a[3];

	let r = Math.sqrt(x * x + y * y + z * z);
	let t = r > 0 ? Math.atan2(r, w) / r : 0;

	out[0] = x * t;
	out[1] = y * t;
	out[2] = z * t;
	out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);

	return out;
};

/**
 * Calculate the scalar power of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @param {Number} b amount to scale the quaternion by
 * @returns {quat} out
 */
exports.pow = function(out, a, b) {
	ln(out, a);
	scale(out, out, b);
	exp(out, out);
	return out;
};

const slerp =
/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
exports.slerp = function(out, a, b, t) {
	// benchmarks:
	//    http://jsperf.com/quaternion-slerp-implementations
	let ax = a[0],
		ay = a[1],
		az = a[2],
		aw = a[3];
	let bx = b[0],
		by = b[1],
		bz = b[2],
		bw = b[3];

	let omega, cosom, sinom, scale0, scale1;

	// calc cosine
	cosom = ax * bx + ay * by + az * bz + aw * bw;
	// adjust signs (if necessary)
	if (cosom < 0.0) {
		cosom = -cosom;
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
	}
	// calculate coefficients
	if (1.0 - cosom > EPSILON) {
		// standard case (slerp)
		omega = Math.acos(cosom);
		sinom = Math.sin(omega);
		scale0 = Math.sin((1.0 - t) * omega) / sinom;
		scale1 = Math.sin(t * omega) / sinom;
	} else {
		// "from" and "to" quaternions are very close
		//  ... so we can do a linear interpolation
		scale0 = 1.0 - t;
		scale1 = t;
	}
	// calculate final values
	out[0] = scale0 * ax + scale1 * bx;
	out[1] = scale0 * ay + scale1 * by;
	out[2] = scale0 * az + scale1 * bz;
	out[3] = scale0 * aw + scale1 * bw;

	return out;
};

/**
 * Generates a random unit quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
exports.random = function(out) {
	// Implementation of http://planning.cs.uiuc.edu/node198.html
	// TODO: Calling random 3 times is probably not the fastest solution
	let u1 = RANDOM();
	let u2 = RANDOM();
	let u3 = RANDOM();

	let sqrt1MinusU1 = Math.sqrt(1 - u1);
	let sqrtU1 = Math.sqrt(u1);

	out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
	out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
	out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
	out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
	return out;
};

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate inverse of
 * @returns {quat} out
 */
exports.invert = function(out, a) {
	let a0 = a[0],
		a1 = a[1],
		a2 = a[2],
		a3 = a[3];
	let dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
	let invDot = dot ? 1.0 / dot : 0;

	// TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

	out[0] = -a0 * invDot;
	out[1] = -a1 * invDot;
	out[2] = -a2 * invDot;
	out[3] = a3 * invDot;
	return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate conjugate of
 * @returns {quat} out
 */
exports.conjugate = function(out, a) {
	out[0] = -a[0];
	out[1] = -a[1];
	out[2] = -a[2];
	out[3] = a[3];
	return out;
};

const fromMat3 =
/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
exports.fromMat3 = function(out, m) {
	// Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
	// article "Quaternion Calculus and Fast Animation".
	let fTrace = m[0] + m[4] + m[8];
	let fRoot;

	if (fTrace > 0.0) {
		// |w| > 1/2, may as well choose w > 1/2
		fRoot = Math.sqrt(fTrace + 1.0); // 2w
		out[3] = 0.5 * fRoot;
		fRoot = 0.5 / fRoot; // 1/(4w)
		out[0] = (m[5] - m[7]) * fRoot;
		out[1] = (m[6] - m[2]) * fRoot;
		out[2] = (m[1] - m[3]) * fRoot;
	} else {
		// |w| <= 1/2
		let i = 0;
		if (m[4] > m[0]) i = 1;
		if (m[8] > m[i * 3 + i]) i = 2;
		let j = (i + 1) % 3;
		let k = (i + 2) % 3;

		fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
		out[i] = 0.5 * fRoot;
		fRoot = 0.5 / fRoot;
		out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
		out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
		out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
	}

	return out;
};

/**
 * Creates a new quaternion from the given euler angle x, y, z, with default angle order
 *
 * @param {Number} x Angle to rotate around X axis in degrees.
 * @param {Number} y Angle to rotate around Y axis in degrees.
 * @param {Number} z Angle to rotate around Z axis in degrees.
 * @returns {quat} out
 * @function
 */
exports.euler = function(x, y, z) {
	let q = quat.create();
	quat.fromEuler(q, x, y, z);
	return q;
};

/**
 * Creates a quaternion from the given euler angle x, y, z using the provided intrinsic order for the conversion.
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x Angle to rotate around X axis in degrees.
 * @param {Number} y Angle to rotate around Y axis in degrees.
 * @param {Number} z Angle to rotate around Z axis in degrees.
 * @param {'xyz'|'xzy'|'yxz'|'yzx'|'zxy'|'zyx'} order Intrinsic order for conversion, default is zyx.
 * @returns {quat} out
 * @function
 */
exports.fromEuler = function(out, x, y, z, order = ANGLE_ORDER) {
	let halfToRad = Math.PI / 360;
	x *= halfToRad;
	z *= halfToRad;
	y *= halfToRad;

	let sx = Math.sin(x);
	let cx = Math.cos(x);
	let sy = Math.sin(y);
	let cy = Math.cos(y);
	let sz = Math.sin(z);
	let cz = Math.cos(z);

	switch (order) {
		case "xyz":
			out[0] = sx * cy * cz + cx * sy * sz;
			out[1] = cx * sy * cz - sx * cy * sz;
			out[2] = cx * cy * sz + sx * sy * cz;
			out[3] = cx * cy * cz - sx * sy * sz;
			break;

		case "xzy":
			out[0] = sx * cy * cz - cx * sy * sz;
			out[1] = cx * sy * cz - sx * cy * sz;
			out[2] = cx * cy * sz + sx * sy * cz;
			out[3] = cx * cy * cz + sx * sy * sz;
			break;

		case "yxz":
			out[0] = sx * cy * cz + cx * sy * sz;
			out[1] = cx * sy * cz - sx * cy * sz;
			out[2] = cx * cy * sz - sx * sy * cz;
			out[3] = cx * cy * cz + sx * sy * sz;
			break;

		case "yzx":
			out[0] = sx * cy * cz + cx * sy * sz;
			out[1] = cx * sy * cz + sx * cy * sz;
			out[2] = cx * cy * sz - sx * sy * cz;
			out[3] = cx * cy * cz - sx * sy * sz;
			break;

		case "zxy":
			out[0] = sx * cy * cz - cx * sy * sz;
			out[1] = cx * sy * cz + sx * cy * sz;
			out[2] = cx * cy * sz + sx * sy * cz;
			out[3] = cx * cy * cz - sx * sy * sz;
			break;

		case "zyx":
			out[0] = sx * cy * cz - cx * sy * sz;
			out[1] = cx * sy * cz + sx * cy * sz;
			out[2] = cx * cy * sz - sx * sy * cz;
			out[3] = cx * cy * cz + sx * sy * sz;
			break;

		default:
			throw new Error('Unknown angle order ' + order);
	}

	return out;
};

/**
 * Returns a string representation of a quaternion
 *
 * @param {ReadonlyQuat} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
exports.str = function(a) {
	return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
};

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {ReadonlyQuat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
exports.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
exports.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the source quaternion
 * @returns {quat} out
 * @function
 */
exports.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
exports.set = vec4.set;

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 * @function
 */
exports.add = vec4.add;

/**
 * Alias for {@link quat.multiply}
 * @function
 */
exports.mul = exports.multiply;

const scale = vec4.scale;
/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {ReadonlyQuat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
exports.scale = scale;

const dot = vec4.dot;
/**
 * Calculates the dot product of two quat's
 *
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
exports.dot = dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 * @function
 */
exports.lerp = vec4.lerp;

/**
 * Calculates the length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate length of
 * @returns {Number} length of a
 */
exports.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
exports.len = vec4.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
exports.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
exports.sqrLen = vec4.squaredLength;

const normalize = 
/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
exports.normalize = vec4.normalize;

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyQuat} a The first quaternion.
 * @param {ReadonlyQuat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
exports.exactEquals = vec4.exactEquals;

/**
 * Returns whether or not the quaternions point approximately to the same direction.
 *
 * Both quaternions are assumed to be unit length.
 *
 * @param {ReadonlyQuat} a The first unit quaternion.
 * @param {ReadonlyQuat} b The second unit quaternion.
 * @returns {Boolean} True if the quaternions are equal, false otherwise.
 */
exports.equals = function(a, b) {
	return Math.abs(vec4.dot(a, b)) >= 1 - EPSILON;
};

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */
exports.rotationTo = (function () {
	let tmpvec3 = vec3.create();
	let xUnitVec3 = vec3.fromValues(1, 0, 0);
	let yUnitVec3 = vec3.fromValues(0, 1, 0);

	return function (out, a, b) {
		let dot = vec3.dot(a, b);
		if (dot < -0.999999) {
			vec3.cross(tmpvec3, xUnitVec3, a);
			if (vec3.len(tmpvec3) < 0.000001) vec3.cross(tmpvec3, yUnitVec3, a);
			vec3.normalize(tmpvec3, tmpvec3);
			setAxisAngle(out, tmpvec3, Math.PI);
			return out;
		} else if (dot > 0.999999) {
			out[0] = 0;
			out[1] = 0;
			out[2] = 0;
			out[3] = 1;
			return out;
		} else {
			vec3.cross(tmpvec3, a, b);
			out[0] = tmpvec3[0];
			out[1] = tmpvec3[1];
			out[2] = tmpvec3[2];
			out[3] = 1 + dot;
			return normalize(out, out);
		}
	};
})();

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
exports.sqlerp = (function () {
	let temp1 = exports.create();
	let temp2 = exports.create();

	return function (out, a, b, c, d, t) {
		slerp(temp1, a, d, t);
		slerp(temp2, b, c, t);
		slerp(out, temp1, temp2, 2 * t * (1 - t));

		return out;
	};
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
exports.setAxes = (function () {
	let matr = mat3.create();

	return function (out, view, right, up) {
		matr[0] = right[0];
		matr[3] = right[1];
		matr[6] = right[2];

		matr[1] = up[0];
		matr[4] = up[1];
		matr[7] = up[2];

		matr[2] = -view[0];
		matr[5] = -view[1];
		matr[8] = -view[2];

		return normalize(out, fromMat3(out, matr));
	};
})();

/**
 * quat pool for minimising garbage allocation 
 */
exports.Pool = (function(){
	let stack = [];
	for (let i = 0; i < 5; i++) {
		stack.push(exports.create());
	}
	
	return {
		/**
		 * return a borrowed quat to the pool
		 * @param {quat}
		 */
		return: (q) => { stack.push(exports.identity(q)); },
		/**
		 * request a quat from the pool
		 * @returns {quat}
		 */
		request: () => {
			if (stack.length > 0) {
				return stack.pop();
			}
			return exports.create();
		}
	}
})();

/**
 * Tests if the provided quaternion is approximately equal to the identity quaternion
 * 
 * @param {quat} q the quaternion to test 
 * @returns {Boolean} true if the quaternion is approximately an identity quaternion
 */
exports.isIdentity = (q) => {
	return (equals(q[0], 0) && equals(q[1], 0) && equals(q[2], 0) && equals(q[3], 1));
};

/**
 * Rotate a quaternion using axis angle
 * 
 * @param {quat} out the receiving quaternion
 * @param {quat} q the quaternion to rotate
 * @param {Number} rad the number of radians to rotate the quaternion by
 * @param {vec3} axis the axis around which to rotate the quaternion
 */
exports.rotate = (function() {
	let i = exports.create();
	return (out, q, rad, axis) => {
		exports.setAxisAngle(i, axis, rad);
		return exports.multiply(out, i, q);
	};
})();

/**
 * Generate a set of local cartesian axes from a quaternion rotation
 * 
 * @param {quat} q the quaternion to generate the local axes from 
 * @param {vec3} localX the receiving vector for the local x axis 
 * @param {vec3} localY the receiving vector for the local y axis
 * @param {vec3} localZ  the receiving vector for the local z axis
 */
exports.localAxes = (q, localX, localY, localZ) => {
	vec3.transformQuat(localX, vec3.X, q);
	vec3.transformQuat(localY, vec3.Y, q);
	vec3.transformQuat(localZ, vec3.Z, q);
};

exports.IDENTITY = Object.freeze(exports.create());