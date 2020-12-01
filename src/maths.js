// This is a centralised point for importing glMatrix
// Also provides a helper for globalizing for ease of use
let glMatrix = require('../libs/gl-matrix-min');

// Created here so that any local variables in the Maths Module
// does not spot the globalising of the variable.
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

  exports.globalize = globalize;

  return exports;
})();
