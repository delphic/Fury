// This is a centralised point for importing glMatrix
// Also provides a helper for globalizing for ease of use
let glMatrix = require('../libs/gl-matrix-min');

let Maths = module.exports = {
  mat2: glMatrix.mat2,
  mat3: glMatrix.mat3,
  mat4: glMatrix.mat4,
  quat: glMatrix.quat,
  quat2: glMatrix.quat2,
  vec2: glMatrix.vec2,
  vec3: glMatrix.vec3,
  vec4:  glMatrix.vec4,
  globalize: () => {
    // Lets create some globals!
    mat2 = glMatrix.mat2;
    mat3 = glMatrix.mat3;
    mat4 = glMatrix.mat4;
    quat = glMatrix.quat;
    quat2 = glMatrix.quat2;
    vec2 = glMatrix.vec2;
    vec3 = glMatrix.vec3;
    vec4 = glMatrix.vec4;
  }
  // Would be nice if there was a way to add to local scope
  // via a fn don't think that's possible though
};
