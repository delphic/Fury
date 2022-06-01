const Shader = require('./shader');

module.exports = (function() {
	let exports = {};

	let unlitColor = {
		vsSource: [
			"attribute vec3 aVertexPosition;",
	
			"uniform mat4 uMVMatrix;",
			"uniform mat4 uPMatrix;",
	
			"void main(void) {",
				"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
			"}"
		].join('\n'),
		fsSource: [
			"precision mediump float;",
	
			"uniform vec3 uColor;",
	
			"void main(void) {",
				"gl_FragColor = vec4(uColor, 1.0);",
			"}"
		].join('\n'),
		attributeNames: [ "aVertexPosition", ],
		uniformNames: [ "uMVMatrix", "uPMatrix", "uColor" ],
		pMatrixUniformName: "uPMatrix",
		mvMatrixUniformName: "uMVMatrix",
		bindMaterial: function(material) {
			this.enableAttribute("aVertexPosition");
			this.setUniformFloat3("uColor", material.color[0], material.color[1], material.color[2]);
		},
		bindBuffers: function(mesh) {
			this.setAttribute("aVertexPosition", mesh.vertexBuffer);
			this.setIndexedAttribute(mesh.indexBuffer);
		},
		validateMaterial: function(material) {
			if (!material.color) {
				console.error("No color property specified on material using UnlitColor shader");
			} else if (material.color.length < 3) {
				console.error("Color property on material using UnlitColor shader must be a vec3");
			}
		}
	};

	let unlitTextured = {
		vsSource: [
			"attribute vec3 aVertexPosition;",
	
			"uniform mat4 uMVMatrix;",
			"uniform mat4 uPMatrix;",
	
			"varying vec2 vTextureCoord;",
			"void main(void) {",
				"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
				"vTextureCoord = aTextureCoord;",
			"}"
		].join('\n'),
		fsSource: [
			"precision mediump float;",
	
			"varying vec2 vTextureCoord;",
			
			"uniform sampler2D uSampler;",
			"uniform vec4 uColor;",
	
			"void main(void) {",
				"gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;",
			"}"
		].join('\n'),
		attributeNames: [ "aVertexPosition", ],
		uniformNames: [ "uMVMatrix", "uPMatrix", "uColor" ],
		pMatrixUniformName: "uPMatrix",
		mvMatrixUniformName: "uMVMatrix",
		bindMaterial: function(material) {
			this.enableAttribute("aVertexPosition");
			this.enableAttribute("aTextureCoord");
			if (material.color) {
				this.setUniformVector4("uColor", material.color);
			} else {
				this.setUniformFloat4("uColor", 1, 1, 1, 1);
			}
		},
		bindBuffers: function(mesh) {
			this.setAttribute("aVertexPosition", mesh.vertexBuffer);
			this.setAttribute("aTextureCoord", mesh.textureBuffer);
			this.setIndexedAttribute(mesh.indexBuffer);
		},
		validateMaterial: function(material) { }
	};

	let sprite = {
		vsSource: [
		"attribute vec3 aVertexPosition;",
		"attribute vec2 aTextureCoord;",
	
		"uniform mat4 uMVMatrix;",
		"uniform mat4 uPMatrix;",
	
		"varying vec2 vTextureCoord;",
		"void main(void) {",
			"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
			"vTextureCoord = aTextureCoord;",
		"}"].join('\n'),
		fsSource: [
		"precision mediump float;",
	
		"varying vec2 vTextureCoord;",
	
		"uniform vec2 uOffset;",
		"uniform vec2 uScale;",
	
		"uniform sampler2D uSampler;",
	
		"uniform vec4 uColor;",
	
		"void main(void) {",
			"gl_FragColor = texture2D(uSampler, vec2(uOffset.x + (uScale.x * vTextureCoord.s), uOffset.y + (uScale.y * vTextureCoord.t))) * uColor;",
		"}"].join('\n'),
	
		attributeNames: [ "aVertexPosition", "aTextureCoord" ],
		uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler", "uOffset", "uScale", "uColor" ],
		textureUniformNames: [ "uSampler" ],
		pMatrixUniformName: "uPMatrix",
		mvMatrixUniformName: "uMVMatrix",
		bindMaterial: function(material) {
			this.enableAttribute("aVertexPosition");
			this.enableAttribute("aTextureCoord");
			this.setUniformVector2("uOffset", material.offset);
			this.setUniformVector2("uScale", material.scale);
			if (material.color) {
				this.setUniformVector4("uColor", material.color);
			} else {
				this.setUniformFloat4("uColor", 1, 1, 1, 1);
			}
		},
		bindBuffers: function(mesh) {
			this.setAttribute("aVertexPosition", mesh.vertexBuffer);
			this.setAttribute("aTextureCoord", mesh.textureBuffer);
			this.setIndexedAttribute(mesh.indexBuffer);
		},
		validateMaterial: function(material) {
			if (material.offset === undefined || material.offset.length != 2)
				console.error("Material using Sprite shader must have a offset property set to a vec2");
			if (material.scale === undefined || material.scale.length != 2)
				console.error("Material using Sprite shader must have scale property set to a vec2");
		}
	};

	exports.createShaders = function() {
		exports.UnlitTextured = Shader.create(unlitTextured);
		exports.UnlitColor = Shader.create(unlitColor);
		exports.Sprite = Shader.create(sprite);
	};

	return exports;
})();