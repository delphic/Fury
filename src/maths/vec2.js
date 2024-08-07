const { ARRAY_TYPE, EPSILON, RANDOM, round } = require("./common.js");

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
exports.create = function() {
	let out = new ARRAY_TYPE(2);
	out[0] = 0;
	out[1] = 0;
	return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {ReadonlyVec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
exports.clone = function(a) {
	let out = new ARRAY_TYPE(2);
	out[0] = a[0];
	out[1] = a[1];
	return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
exports.fromValues = function(x, y) {
	let out = new ARRAY_TYPE(2);
	out[0] = x;
	out[1] = y;
	return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the source vector
 * @returns {vec2} out
 */
exports.copy = function(out, a) {
	out[0] = a[0];
	out[1] = a[1];
	return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
exports.set = function(out, x, y) {
	out[0] = x;
	out[1] = y;
	return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
exports.add = function(out, a, b) {
	out[0] = a[0] + b[0];
	out[1] = a[1] + b[1];
	return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
exports.subtract = function(out, a, b) {
	out[0] = a[0] - b[0];
	out[1] = a[1] - b[1];
	return out;
};

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
exports.multiply = function(out, a, b) {
	out[0] = a[0] * b[0];
	out[1] = a[1] * b[1];
	return out;
};

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
exports.divide = function(out, a, b) {
	out[0] = a[0] / b[0];
	out[1] = a[1] / b[1];
	return out;
};

/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to ceil
 * @returns {vec2} out
 */
exports.ceil = function(out, a) {
	out[0] = Math.ceil(a[0]);
	out[1] = Math.ceil(a[1]);
	return out;
};

/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to floor
 * @returns {vec2} out
 */
exports.floor = function(out, a) {
	out[0] = Math.floor(a[0]);
	out[1] = Math.floor(a[1]);
	return out;
};

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
exports.min = function(out, a, b) {
	out[0] = Math.min(a[0], b[0]);
	out[1] = Math.min(a[1], b[1]);
	return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
exports.max = function(out, a, b) {
	out[0] = Math.max(a[0], b[0]);
	out[1] = Math.max(a[1], b[1]);
	return out;
};

/**
 * symmetric round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to round
 * @returns {vec2} out
 */
exports.round = function(out, a) {
	out[0] = round(a[0]);
	out[1] = round(a[1]);
	return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
exports.scale = function(out, a, b) {
	out[0] = a[0] * b;
	out[1] = a[1] * b;
	return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
exports.scaleAndAdd = function(out, a, b, scale) {
	out[0] = a[0] + b[0] * scale;
	out[1] = a[1] + b[1] * scale;
	return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} distance between a and b
 */
exports.distance = function(a, b) {
	var x = b[0] - a[0],
		y = b[1] - a[1];
	return Math.sqrt(x * x + y * y);
};

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
exports.squaredDistance = function(a, b) {
	var x = b[0] - a[0],
		y = b[1] - a[1];
	return x * x + y * y;
};

/**
 * Calculates the length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns {Number} length of a
 */
exports.length = function(a) {
	var x = a[0],
		y = a[1];
	return Math.sqrt(x * x + y * y);
};

/**
 * Calculates the squared length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
exports.squaredLength = function(a) {
	var x = a[0],
		y = a[1];
	return x * x + y * y;
};

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to negate
 * @returns {vec2} out
 */
exports.negate = function(out, a) {
	out[0] = -a[0];
	out[1] = -a[1];
	return out;
};

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to invert
 * @returns {vec2} out
 */
exports.inverse = function(out, a) {
	out[0] = 1.0 / a[0];
	out[1] = 1.0 / a[1];
	return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to normalize
 * @returns {vec2} out
 */
exports.normalize = function(out, a) {
	var x = a[0],
		y = a[1];
	var len = x * x + y * y;
	if (len > 0) {
		//TODO: evaluate use of glm_invsqrt here?
		len = 1 / Math.sqrt(len);
	}
	out[0] = a[0] * len;
	out[1] = a[1] * len;
	return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} dot product of a and b
 */
exports.dot = function(a, b) {
	return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec3} out
 */
exports.cross = function(out, a, b) {
	var z = a[0] * b[1] - a[1] * b[0];
	out[0] = out[1] = 0;
	out[2] = z;
	return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec2} out
 */
exports.lerp = function(out, a, b, t) {
	var ax = a[0],
		ay = a[1];
	out[0] = ax + t * (b[0] - ax);
	out[1] = ay + t * (b[1] - ay);
	return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec2} out
 */
exports.random = function(out, scale) {
	scale = scale === undefined ? 1.0 : scale;
	var r = RANDOM() * 2.0 * Math.PI;
	out[0] = Math.cos(r) * scale;
	out[1] = Math.sin(r) * scale;
	return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2} m matrix to transform with
 * @returns {vec2} out
 */
exports.transformMat2 = function(out, a, m) {
	var x = a[0],
		y = a[1];
	out[0] = m[0] * x + m[2] * y;
	out[1] = m[1] * x + m[3] * y;
	return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2d} m matrix to transform with
 * @returns {vec2} out
 */
exports.transformMat2d = function(out, a, m) {
	var x = a[0],
		y = a[1];
	out[0] = m[0] * x + m[2] * y + m[4];
	out[1] = m[1] * x + m[3] * y + m[5];
	return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat3} m matrix to transform with
 * @returns {vec2} out
 */
exports.transformMat3 = function(out, a, m) {
	var x = a[0],
		y = a[1];
	out[0] = m[0] * x + m[3] * y + m[6];
	out[1] = m[1] * x + m[4] * y + m[7];
	return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec2} out
 */
exports.transformMat4 = function(out, a, m) {
	let x = a[0];
	let y = a[1];
	out[0] = m[0] * x + m[4] * y + m[12];
	out[1] = m[1] * x + m[5] * y + m[13];
	return out;
};

/**
 * Rotate a 2D vector
 * @param {vec2} out The receiving vec2
 * @param {ReadonlyVec2} a The vec2 point to rotate
 * @param {ReadonlyVec2} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec2} out
 */
exports.rotate = function(out, a, b, rad) {
	//Translate point to the origin
	let p0 = a[0] - b[0],
		p1 = a[1] - b[1],
		sinC = Math.sin(rad),
		cosC = Math.cos(rad);

	//perform rotation and translate to correct position
	out[0] = p0 * cosC - p1 * sinC + b[0];
	out[1] = p0 * sinC + p1 * cosC + b[1];

	return out;
};

/**
 * Get the angle between two 2D vectors
 * @param {ReadonlyVec2} a The first operand
 * @param {ReadonlyVec2} b The second operand
 * @returns {Number} The angle in radians
 */
exports.angle = function(a, b) {
	let x1 = a[0],
		y1 = a[1],
		x2 = b[0],
		y2 = b[1],
		// mag is the product of the magnitudes of a and b
		mag = Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2)),
		// mag &&.. short circuits if mag == 0
		cosine = mag && (x1 * x2 + y1 * y2) / mag;
	// Math.min(Math.max(cosine, -1), 1) clamps the cosine between -1 and 1
	return Math.acos(Math.min(Math.max(cosine, -1), 1));
};

/**
 * Set the components of a vec2 to zero
 *
 * @param {vec2} out the receiving vector
 * @returns {vec2} out
 */
exports.zero = function(out) {
	out[0] = 0.0;
	out[1] = 0.0;
	return out;
};

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec2} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
exports.str = function(a) {
	return "vec2(" + a[0] + ", " + a[1] + ")";
};

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
exports.exactEquals = function(a, b) {
	return a[0] === b[0] && a[1] === b[1];
};

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
exports.equals = function(a, b) {
	let a0 = a[0],
		a1 = a[1];
	let b0 = b[0],
		b1 = b[1];
	return (
		Math.abs(a0 - b0) <=
			EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
		Math.abs(a1 - b1) <=
			EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1))
	);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
exports.len = exports.length;

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
exports.sub = exports.subtract;

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
exports.mul = exports.multiply;

/**
 * Alias for {@link vec2.divide}
 * @function
 */
exports.div = exports.divide;

/**
 * Alias for {@link vec2.distance}
 * @function
 */
exports.dist = exports.distance;

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
exports.sqrDist = exports.squaredDistance;

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
exports.sqrLen = exports.squaredLength;

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
exports.forEach = (function() {
	let vec = exports.create();

	return function(a, stride, offset, count, fn, arg) {
		let i, l;
		if (!stride) {
			stride = 2;
		}

		if (!offset) {
			offset = 0;
		}

		if (count) {
			l = Math.min(count * stride + offset, a.length);
		} else {
			l = a.length;
		}

		for (i = offset; i < l; i += stride) {
			vec[0] = a[i];
			vec[1] = a[i + 1];
			fn(vec, vec, arg);
			a[i] = vec[0];
			a[i + 1] = vec[1];
		}

		return a;
	};
})();

/**
 * vec2 pool for minimising garbage allocation 
 */
exports.Pool = (function(){
	let stack = [];
	for (let i = 0; i < 5; i++) {
		stack.push(exports.create());
	}
	
	return {
		/**
		 * return a borrowed vec2 to the pool
		 * @param {vec2}
		 */
		return: (v) => { stack.push(exports.zero(v)); },
		/**
		 * request a vec2 from the pool
		 * @returns {vec2}
		 */
		request: () => {
			if (stack.length > 0) {
				return stack.pop();
			}
			return exports.create();
		}
	}
})();

exports.ZERO = Object.freeze(exports.create());
exports.ONE = Object.freeze(exports.fromValues(1,1));
exports.X = Object.freeze(exports.fromValues(1,0));
exports.Y = Object.freeze(exports.fromValues(0,1));
exports.NEG_X = Object.freeze(exports.fromValues(-1,0));
exports.NEG_Y = Object.freeze(exports.fromValues(0,-1));