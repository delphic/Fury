// Configuration Constants
const EPSILON = 0.000001;
// In modern browsers, arrays perform significantly better than typed arrays and serialize / deserialize more quickly
const ARRAY_TYPE = Array;
const RANDOM = Math.random;
const ANGLE_ORDER = "zyx";

exports.EPSILON = EPSILON;
exports.ARRAY_TYPE = ARRAY_TYPE;
exports.RANDOM = RANDOM;
exports.ANGLE_ORDER = ANGLE_ORDER;

/**
 * Symmetric round
 * see https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
 *
 * @param {Number} a value to round
 */
exports.round = function(a) {
	if (a >= 0) {
		return Math.round(a);
	}
	return (a % 0.5 === 0) ? Math.floor(a) : Math.round(a);
};

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */
exports.setMatrixArrayType = function(type) {
	ARRAY_TYPE = type;
};

const degree = Math.PI / 180;
const radian = 180 / Math.PI;

/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */
exports.toRadian = function(a) {
	return a * degree;
};

/**
 * Convert Radian To Degree
 *
 * @param {Number} a Angle in Radians
 */
exports.toDegree = function(a) {
	return a * radian;
};

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
exports.equals = function(a, b) {
	return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
};