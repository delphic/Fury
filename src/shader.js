// Shader Class for use with Fury Scene
var r = require('./renderer');

var Shader = module.exports = function() {
	var exports = {};
	var prototype = {};

	var create = exports.create = function(parameters) {

		// TODO: Make this work as Shader Package.md desires

		var i, l;
		var shader = Object.create(prototype);

		// Argument Validation
		if(!parameters) {
			throw new Error("No paramter object supplied, shader source must be provided");
		}
		if(!parameters.vsSource) {
			throw new Error("No Vertex Shader Source 'vsSource'");
		}
		if(!parameters.fsSource) {
			throw new Error("No Fragment Shader Source 'fsSource'");
		}
		
		shader.vs = r.createShader("vertex", vsSource);
		shader.fs = r.createShader("fragment", fsSource);
		shader.shaderProgram = r.createShaderProgram(vs, fs);
		if(parameters.attributeNames) {
			for(i = 0, l = attributeNames.length; i < l; i++) {
				r.initAttribute(shaderProgram, attributeNames[i]);
			}
		}
		if(parameters.uniformNames) {
			for(i = 0, l = uniformNames.length; i < l; i++) {
				r.initUniform(shaderProgram, uniformNames[i]);
			}
		}

		// TODO: Add binding functions		

		return shader;
	};

	return exports;
}();