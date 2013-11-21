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
		if(parameters.attributeNames) {	// Could parse these from the shader
			for(i = 0, l = attributeNames.length; i < l; i++) {
				r.initAttribute(shaderProgram, attributeNames[i]);
			}
		}
		if(parameters.uniformNames) {	// Could parse these from the shader
			for(i = 0, l = uniformNames.length; i < l; i++) {
				r.initUniform(shaderProgram, uniformNames[i]);
			}
		}

		if(!parameters.bindMaterial || typeof(parameters.bindMaterial) !== 'function') {
			throw new Error("You must provide a material binding function 'bindMaterial'");
		}
		shader.bindMaterial = parameters.bindMaterial;	

		if(!parameters.bindBuffers || typeof(parameters.bindBuffers) !== 'function') {
			throw new Error("You must provide a mesh binding function 'bindBuffers'");
		}
		shader.bindBuffers = parameters.bindBuffers;

		if(!parameters.bindProjectionMatrix || typeof(parameters.bindProjectionMatrix) !== 'function') {
			throw new Error("You must provide a pMatrix binding function 'bindProjectionMatrix'");	// Could probably make a guess at these, or perhaps just request the attribute name?
		}
		shader.bindProjectionMatrix = parameters.bindProjectionMatrix;

		if(!parameters.bindModelViewMatrix || typeof(parameters.bindModelViewMatrix) !== 'function') {
			throw new Error("You must provide a mvMatrix binding function 'bindModelViewMatrix'");	// Could probably make a guess at these, or perhaps just request the attribute name?
		}
		shader.bindModelViewMatrix = parameters.bindModelViewMatrix;

		// TODO: decide how to deal with non-standard uniforms

		return shader;
	};

	return exports;
}();