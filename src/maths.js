// This is a centralised point for importing glMatrix
// Also provides a helper for globalizing for ease of use
let glMatrix = require('../libs/gl-matrix-min');

// Created here so that any local variables in the Maths Module
// does not stop the globalising of the variable.
let globalize = () => {
  // Lets create some globals!
  mat2 = glMatrix.mat2;
  mat3 = glMatrix.mat3;
  mat4 = glMatrix.mat4;
  quat = glMatrix.quat;
  quat2 = glMatrix.quat2;
  vec2 = glMatrix.vec2;
  vec3 = glMatrix.vec3;
  vec4 = glMatrix.vec4;
  // Would be nice if there was a way to add to the context a function
  // was called in but don't think that's possible?
};

// Use of object freeze has funnily enough frozen these objects
// if we wish to extend we'll need to update our fork of glMatrix (done)
// make the changes and then build - I *think* we just want to remove the freezes?
// then we can extend it here for clarity?

let Maths = module.exports = (function() {
  let exports = {
    glMatrix: glMatrix,
    toRadian: glMatrix.glMatrix.toRadian,
    equals: glMatrix.glMatrix.equals,
    mat2: glMatrix.mat2,
    mat3: glMatrix.mat3,
    mat4: glMatrix.mat4,
    quat: glMatrix.quat,
    quat2: glMatrix.quat2,
    vec2: glMatrix.vec2,
    vec3: glMatrix.vec3,
    vec4:  glMatrix.vec4
  };

  // TODO: Add plane 'class' - it's a vec4 with 0-2 being the normal vector and 3 being the distance to the origin from the plane along the normal vector
  // I.e. the dot product of the offset point?

  var vec3X = exports.vec3X = glMatrix.vec3.fromValues(1,0,0);
  var vec3Y = exports.vec3Y = glMatrix.vec3.fromValues(0,1,0);
  var vec3Z = exports.vec3Z = glMatrix.vec3.fromValues(0,0,1);

  let equals = glMatrix.glMatrix.equals;

  // TODO: create quat from euler

  exports.quatIdentity = function(q) {
    // Is the provided quaterion identity
    return (equals(q[0], 0) && equals(q[1], 0) && equals(q[2], 0) && equals(q[3], 1));
  }

  exports.quatRotate = (function() {
  	var i = glMatrix.quat.create();
  	return function(out, q, rad, axis) {
  		glMatrix.quat.setAxisAngle(i, axis, rad);
  		return glMatrix.quat.multiply(out, i, q);
  	};
  })();

  exports.quatLocalAxes = function(q, localX, localY, localZ) {
    glMatrix.vec3.transformQuat(localX, vec3X, q);
    glMatrix.vec3.transformQuat(localY, vec3Y, q);
    glMatrix.vec3.transformQuat(localZ, vec3Z, q);
  };

  // See https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
  // Note: They define roll as rotation around x axis, pitch around y axis, and yaw around z-axis
  // I do not agree, roll is around z-axis, pitch around x-axis, and yaw around y-axis.
  // Methods renamed accordingly

  // I attempted to swap and rearrange some of the formula so pitch could be -pi/2 to pi/2 range
  // and yaw would be -pi to pi but naively swapping the formula according to the apparent pattern did not work
  // c.f. 7dfps player class for hacky work around - TODO: Fix these
  exports.calculatePitch = function(q) {
  	// x-axis rotation
  	let w = q[3], x = q[0], y = q[1], z = q[2];
  	return Math.atan2(2 * (w*x + y*z), 1 - 2 * (x*x + y*y)); // use atan and probably would get -90:90?
  };

  exports.calculateYaw = function(q) {
  	// y-axis rotation
  	let w = q[3], x = q[0], y = q[1], z = q[2];
  	let sinp = 2 * (w*y - z*x);
    if (Math.abs(sinp) >= 1) sinp = Math.sign(sinp) * (Math.PI / 2);  // Use 90 if out of range
  	return Math.asin(sinp) // returns pi/2 -> - pi/2 range
  };

  exports.calculateRoll = function(q) {
  	// z-axis rotation
  	let w = q[3], x = q[0], y = q[1], z = q[2];
  	return Math.atan2(2 * (w*z + x*y), 1 - 2 * (y*y + z*z));
    // This seems to occasionally return PI or -PI instead of 0
    // It does seem to be related to crossing boundaries but it's not entirely predictable
  };

  exports.globalize = globalize;

  return exports;
})();
