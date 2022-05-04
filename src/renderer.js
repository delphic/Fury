// This module is essentially a GL Context Facade
// There are - of necessity - a few hidden logical dependencies in this class
// mostly with the render functions, binding buffers before calling a function draw
let gl, currentShaderProgram, anisotropyExt, maxAnisotropy;

exports.init = function(canvas, contextAttributes) {
	gl = canvas.getContext('webgl2', contextAttributes);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);	// TODO: Make configurable
	gl.enable(gl.DEPTH_TEST);	// TODO: expose as method
	gl.enable(gl.CULL_FACE);  // TODO: expose as method

	anisotropyExt = gl.getExtension("EXT_texture_filter_anisotropic");
	if (anisotropyExt) {
		maxAnisotropy = gl.getParameter(anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	}

	// WebGL is supposed to have 32 texture locations but this seems to vary
	// Now TextureLocations.length will tell you how many there are and provide
	// a link from the integer to the actual value
	TextureLocations.length = 0;
	let i = 0;
	while(gl["TEXTURE" + i.toString()]) {
		TextureLocations.push(gl["TEXTURE" + i.toString()]);
		i++;
	}
};

exports.getContextLossExtension = function() {
	return gl.getExtension("WEBGL_lose_context");
};

// TODO: This cshould be called setClearColor
exports.clearColor = function(r, g, b, a) {
	gl.clearColor(r, g, b, a);
};

exports.clear = function() {
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); // TODO: this isn't necessary every frame
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

exports.clearDepth = function() {
	gl.clear(gl.DEPTH_BUFFER_BIT);
};

// Shader / Shader Programs

let ShaderType = exports.ShaderType = {
	Vertex: "vertex",
	Fragment: "fragment"
};

exports.createShader = function(type, glsl) {
	let shader;
	if (type == ShaderType.Vertex) {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else if (type == ShaderType.Fragment) {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else {
		throw new Error("Unrecognised shader type '" + type + "'");
	}
	gl.shaderSource(shader, glsl);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error("Could not create shader " + gl.getShaderInfoLog(shader));
	}
	return shader;
};

exports.deleteShader = function(shader) {
	gl.deleteShader(shader);
};

exports.createShaderProgram = function(vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error("Could not create shader program");
	}
	return program;
};

exports.useShaderProgram = function(shaderProgram) {
	currentShaderProgram = shaderProgram;
	gl.useProgram(shaderProgram);
};

// Buffers
exports.DataType = {
	"BYTE": 5120, // signed 8-bit integer
	"SHORT": 5122, // signed 16-bit integer
	"INT": 5124, // signed 32-bit integer
	"UNSIGNED_BYTE": 5121, // unsigned 8-bit integer
	"UNSIGNED_SHORT": 5123, // unsigned 16-bit integer
	"UNSIGNED_INT": 5125, // unsigned 32-bit integer
	"FLOAT": 5126, // 32-bit IEEE floating point number
	"HALF_FLOAT": 5131, // 16-bit IEEE floating point number
};

exports.createBuffer = function(data, itemSize, indexed) {
	let buffer = gl.createBuffer();
	if (!indexed) {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	} else {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
	}
	buffer.itemSize = itemSize;
	buffer.numItems = Math.round(data.length / itemSize);
	return buffer;
};

exports.createArrayBuffer = function(data, itemSize) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	buffer.itemSize = itemSize;
	buffer.numItems = Math.round(data.length / itemSize);
	return buffer;
};

exports.createElementArrayBuffer = function(data, itemSize) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
	buffer.itemSize = itemSize;
	buffer.numItems = Math.round(data.length / itemSize);;
	return buffer;
};

// Textures

let TextureLocations = exports.TextureLocations = [];

let TextureQuality = exports.TextureQuality = {
	Pixel: "pixel",			// Uses Mips and nearest pixel
	Highest: "highest",		// Uses Mips & Interp (trilinear)
	High: "high",			// Uses Mips & Interp (bilinear)
	Medium: "medium",		// Linear Interp
	Low: "low"				// Uses nearest pixel
};

exports.createTexture = function(source, quality, clamp, flip, disableAniso) {
	if (flip === undefined) flip = true;

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
	// If we want to create mipmaps manually provide an array source and put them into
	// different levels in texImage2D - you must provide all mipmap levels

	setTextureQuality(gl.TEXTURE_2D, quality, disableAniso);

	if (clamp) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
	texture.glTextureType = gl.TEXTURE_2D;
	return texture;
};

/// width and height are of an individual texture
exports.createTextureArray = function(source, width, height, imageCount, quality, clamp) {
	let texture = gl.createTexture();
	// gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, width, height, imageCount, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);

	setTextureQuality(gl.TEXTURE_2D_ARRAY, quality);

	if (clamp) {
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
	texture.glTextureType = gl.TEXTURE_2D_ARRAY;
	return texture;
};

let setTextureQuality = function(glTextureType, quality, disableAniso) {
	if (quality == TextureQuality.Pixel) {
		gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(glTextureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		if (!disableAniso && anisotropyExt) {
			// Unfortunately you can't use MAG_FILTER NEAREST with MIN_FILTER MIPMAP when using the anisotropy extension
			// you can without it however, so there is a trade off on crisp near pixels against blurry textures at severe angles
			
			// Could investigate using multiple samplers in a version 300 ES Shader and blending between them,
			// or using multiple texture with different settings, potentially using dFdx and dFdy to determine / estimate MIPMAP level
			gl.texParameterf(glTextureType, anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
		}
		gl.generateMipmap(glTextureType);
	} else if (quality === TextureQuality.Highest) {
		gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(glTextureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		if (!disableAniso && anisotropyExt) {
			gl.texParameterf(glTextureType, anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
		}
		gl.generateMipmap(glTextureType);
	} else if (quality === TextureQuality.High) {
		gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(glTextureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		if (!disableAniso && anisotropyExt) {
			gl.texParameterf(glTextureType, anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.round(maxAnisotropy/2));
		}
		gl.generateMipmap(glTextureType);
	} else if (quality === TextureQuality.Medium) {
		gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(glTextureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	} else {
		gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(glTextureType, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	}
};

exports.setTexture = function(location, texture) {
	gl.activeTexture(TextureLocations[location]);
	gl.bindTexture(texture.glTextureType, texture);
};

// Blending
exports.BlendEquation = {
	Add: "FUNC_ADD",
	Subtract: "FUNC_SUBTRACT",
	ReverseSubtract: "FUNC_REVERSE_SUBTRACT"
};

exports.BlendType = {
	Zero: "ZERO",
	One: "ONE",
	ConstantAlpha: "CONSTANT_ALPHA",
	ConstantColour: "CONSTANT_COLOR",
	DestinationAlpha: "DST_ALPHA",
	DestinationColour: "DST_COLOR",
	SourceAlpha: "SRC_ALPHA",
	SourceColour: "SRC_COLOR",
	OneMinusConstantAlpha: "ONE_MINUS_CONSTANT_ALPHA",
	OneMinusConstantColour: "ONE_MINUS_CONSTANT_COLOR",
	OneMinusDestinationAlpha: "ONE_MINUS_DST_ALPHA",
	OneMinusDestinationColour: "ONE_MINUS_DST_COLOR",
	OneMinusSourceAlpha: "ONE_MINUS_SRC_ALPHA",
	OneMinusSourceColour: "ONE_MINUS_SRC_COLOR",
	SourceAlphaSaturate: "SRC_ALPHA_SATURATE"
};

exports.enableBlending = function(sourceBlend, destinationBlend, equation) {
	if (equation) {
		gl.blendEquation(gl[equation]);
	}
	if(sourceBlend && destinationBlend) {
		gl.blendFunc(gl[sourceBlend], gl[destinationBlend]);
	}
	gl.enable(gl.BLEND);
	gl.depthMask(false);
};

exports.enableSeparateBlending = function(sourceColorBlend, destinationColorBlend, sourceAlphaBlend, destinationAlphaBlend, equation) {
	gl.enable(gl.BLEND);
	if (equation) {
		// Does WebGL support separate blend equations? Do we want to?
		gl.blendEquation(gl[equation]);
	}
	if (sourceColorBlend && sourceAlphaBlend && destinationColorBlend && destinationAlphaBlend) {
		gl.blendFuncSeparate(gl[sourceColorBlend], gl[destinationColorBlend], gl[sourceAlphaBlend], gl[destinationAlphaBlend]);
	}
	gl.depthMask(false);
}

exports.disableBlending = function() {
	gl.disable(gl.BLEND);
	gl.depthMask(true);
};

// Attributes and Uniforms

exports.initAttribute = function(shaderProgram, name) {
	if(!shaderProgram.attributeLocations) {
		shaderProgram.attributeLocations = {};
	}
	shaderProgram.attributeLocations[name] = gl.getAttribLocation(shaderProgram, name);
};
exports.initUniform = function(shaderProgram, name) {
	if(!shaderProgram.uniformLocations) {
		shaderProgram.uniformLocations = {};
	}
	shaderProgram.uniformLocations[name] = gl.getUniformLocation(shaderProgram, name);
};

exports.enableAttribute = function(name) {
	gl.enableVertexAttribArray(currentShaderProgram.attributeLocations[name]);
};
exports.disableAttribute = function(name) {
	gl.disableVertexAttribArray(currentShaderProgram.attributeLocations[name]);
};
exports.setAttribute = function(name, buffer) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(currentShaderProgram.attributeLocations[name], buffer.itemSize, gl.FLOAT, false, 0, 0);
};
exports.setAttributeFloat = function(name, buffer, type) {
	/* Supported types: gl.BYTE, gl.SHORT, gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, gl.FLOAT, gl.HALF_FLOAT: */
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(currentShaderProgram.attributeLocations[name], buffer.itemSize, type, false, 0, 0);
};
exports.setAttributeInteger = function(name, buffer, type) {
	/* Supported types: gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, gl.UNSIGNED_INT */
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribIPointer(currentShaderProgram.attributeLocations[name], buffer.itemSize, type, 0, 0);
};

exports.setIndexedAttribute = function(buffer) {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
};

exports.setUniformBoolean = function(name, value) {
	gl.uniform1i(currentShaderProgram.uniformLocations[name], value);
};
exports.setUniformFloat = function(name, value) {
	gl.uniform1f(currentShaderProgram.uniformLocations[name], value);
};
exports.setUniformFloat2 = function(name, value1, value2) {
	gl.uniform2f(currentShaderProgram.uniformLocations[name], value1, value2);
};
exports.setUniformFloat3 = function(name, value1, value2, value3) {
	gl.uniform3f(currentShaderProgram.uniformLocations[name], value1, value2, value3);
};
exports.setUniformFloat4 = function(name, value1, value2, value3, value4) {
	gl.uniform4f(currentShaderProgram.uniformLocations[name], value1, value2, value3, value4);
}
exports.setUniformInteger = function(name, value) {
	gl.uniform1i(currentShaderProgram.uniformLocations[name], value);
};
exports.setUniformVector2 = function(name, value) {
	gl.uniform2fv(currentShaderProgram.uniformLocations[name], value);
}
exports.setUniformVector3 = function(name, value) {
	gl.uniform3fv(currentShaderProgram.uniformLocations[name], value);
};
exports.setUniformVector4 = function(name, value) {
	gl.uniform4fv(currentShaderProgram.uniformLocations[name], value);
};
exports.setUniformMatrix3 = function(name, value) {
	gl.uniformMatrix3fv(currentShaderProgram.uniformLocations[name], false, value);
};
exports.setUniformMatrix4 = function(name, value) {
	gl.uniformMatrix4fv(currentShaderProgram.uniformLocations[name], false, value);
};

// Draw Functions
let RenderMode = exports.RenderMode = {
	Triangles: "triangles",
	TriangleStrip: "triangleStrip",
	Lines: "lines",
	Points: "points"
};

let drawTriangles = exports.drawTriangles = function(count) {
	gl.drawArrays(gl.TRIANGLES, 0, count);
};
let drawTriangleStrip = exports.drawTriangleStrip = function(count) {
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
};
let drawLines = exports.drawLines = function(count) {
	gl.drawArrays(gl.LINES, 0, count);
};
let drawPoints = exports.drawPoints = function(count) {
	gl.drawArrays(gl.POINTS, 0, count);
};
let drawIndexedTriangles = exports.drawIndexedTriangles = function(count, offset) {
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, offset);
};
let drawIndexedTriangleStrip = exports.drawIndexedTriangleStrip = function(count, offset) {
	gl.drawElements(gl.TRIANGLE_STRIP, count, gl.UNSIGNED_SHORT, offset);
}
let drawIndexedLines = exports.drawIndexedLines = function(count, offset) {
	gl.drawElements(gl.LINES, count, gl.UNSIGNED_SHORT, offset);
};
let drawIndexedPoints = exports.drawIndexedPoints = function(count, offset) {
	gl.drawElements(gl.POINTS, count, gl.UNSIGNED_SHORT, offset);
};

exports.draw = function(renderMode, count, indexed, offset) {
	switch (renderMode) {
		case RenderMode.Triangles:
			if (!indexed) {
				drawTriangles(count);
			} else {
				drawIndexedTriangles(count, offset);
			}
			break;
		case RenderMode.TriangleStrip:
			if (!indexed) {
				drawTriangleStrip(count);
			} else {
				drawIndexedTriangleStrip(count);
			}
			break;
		case RenderMode.Lines:
			if (!indexed) {
				drawLines(count);
			} else {
				drawIndexedLines(count, offset);
			}
			break;
		case RenderMode.Points:
			if (!indexed) {
				drawPoints(count);
			} else {
				drawIndexedPoints(count, offset);
			}
			break;
		default:
			throw new Error("Unrecognised renderMode '" + renderMode + "'");
	}
};
