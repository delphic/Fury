// Shader Class for use with Fury Scene
const r = require('./renderer');

module.exports = (function() {
	let exports = {};

	exports.create = function(config) {
		let shader = {};

		// Argument Validation
		if (!config) {
			throw new Error("No config object supplied, shader source must be provided");
		}
		if (!config.vsSource) {
			throw new Error("No Vertex Shader Source 'vsSource'");
		}
		if (!config.fsSource) {
			throw new Error("No Fragment Shader Source 'fsSource'");
		}

		shader.vs = r.createShader("vertex", config.vsSource);
		shader.fs = r.createShader("fragment", config.fsSource);
		shader.shaderProgram = r.createShaderProgram(shader.vs, shader.fs);
		if (config.attributeNames) {	// Could parse these from the shader
			for (let i = 0, l = config.attributeNames.length; i < l; i++) {
				r.initAttribute(shader.shaderProgram, config.attributeNames[i]);
			}
		}
		if (config.uniformNames) {	// Could parse these from the shader
			for (let i = 0, l = config.uniformNames.length; i < l; i++) {
				r.initUniform(shader.shaderProgram, config.uniformNames[i]);
			}
		}
		if (config.textureUniformNames) {
			if (config.textureUniformNames.length > r.TextureLocations.length) {
				throw new Error("Shader can not use more texture than total texture locations (" + r.TextureLocations.length + ")");
			}
			shader.textureUniformNames = config.textureUniformNames;	// Again could parse from the shader, and could also not require duplicate between uniformNames and textureUniformNames
		} else {
			shader.textureUniformNames = [];
		}

		if (!config.bindMaterial || typeof(config.bindMaterial) !== 'function') {
			throw new Error("You must provide a material binding function 'bindMaterial'");
		}
		shader.bindMaterial = config.bindMaterial;

		if (!config.bindBuffers || typeof(config.bindBuffers) !== 'function') {
			throw new Error("You must provide a mesh binding function 'bindBuffers'");
		}
		shader.bindBuffers = config.bindBuffers;

		if (config.bindInstance && typeof(config.bindInstance) === 'function') {
			shader.bindInstance = config.bindInstance;
		}

		if (config.validateMaterial && typeof(config.validateMaterial) === 'function') {
			shader.validateMaterial = config.validateMaterial;
		}

		shader.pMatrixUniformName = config.pMatrixUniformName;
		shader.mvMatrixUniformName = config.mvMatrixUniformName;
		shader.nMatrixUniformName = config.nMatrixUniformName;
		shader.mMatrixUniformName = config.mMatrixUniformName;
		shader.vMatrixUniformName = config.vMatrixUniformName;

		if (!shader.pMatrixUniformName && config.uniformNames.includes("pMatrix")) {
			shader.pMatrixUniformName = "pMatrix";
		}

		if (!shader.mvMatrixUniformName && config.uniformNames.includes("mvMatrix")) {
			shader.mvMatrixUniformName = "mvMatrix";
		}

		if (!shader.mMatrixUniformName && config.uniformNames.includes("mMatrix")) {
			shader.mMatrixUniformName = "mMatrix";
		}

		if (!shader.vMatrixUniformName && config.uniformNames.includes("vMatrix")) {
			shader.vMatrixUniformName = "vMatrix";
		}

		return shader;
	};

	exports.copy = function(shader) {
		let clone = Object.assign({}, shader);
		clone.id = null;
		return clone;
	};

	return exports;
})();
