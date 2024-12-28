// Client.js - for using Fury old school style as a JS file which adds a
// global which you can use. 

const Fury = require('./fury.js'); 
// Create Fury Global
window.Fury = Fury;

// Add globalize extension for maths classes for ease of use
const { Maths } = Fury;
Maths.globalize = function() {
	window.mat2 = Maths.mat2;
	window.mat3 = Maths.mat3;
	window.mat4 = Maths.mat4;
	window.quat = Maths.quat;
	window.quat2 = Maths.quat2;
	window.vec2 = Maths.vec2;
	window.vec3 = Maths.vec3;
	window.vec4 = Maths.vec4;
};
