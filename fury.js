;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var canvas;

// Fury Global
Fury = {};
// Modules
Fury.Camera = require('./camera');
Fury.Material = require('./material');
Fury.Mesh = require('./mesh');
Fury.Renderer = require('./renderer');
Fury.Scene = require('./scene');
Fury.Shader = require('./shader');

// Public functions
Fury.init = function(canvasId) {
	canvas = document.getElementById(canvasId);
	try {
		Fury.Renderer.init(canvas);
	} catch (error) {
		// TODO: debug.error(error.message)
		console.log(error.message);
		return false;
	}
	return true;
};

},{"./camera":2,"./material":3,"./mesh":4,"./renderer":5,"./scene":6,"./shader":7}],3:[function(require,module,exports){
var Material = module.exports = function(){
	var exports = {};
	var prototype = {
		setTexture: function(name, texture) {
			// TODO: Check that its a valid GL texture
			material.textures[name] = texture;
		}
	};

	var create = exports.create = function(parameters) {
		var material = Object.create(prototype);

		if(parameters.shader) {
			material.shader = parameters.shader;
		}
		material.textures = {};
		if(parameters.textures) {
			for(var i = 0, l = textures.length; i < l; i++) {
				if(texture[i].hasOwnProperty("name") && textures[i].hasOwnProperty("texture")) {
					material.textures[textures[i].name] = textures[i].texture;
				} else {
					throw new Error("Texture Array must contain objects with properties 'name' and 'texture'");
				}
			}
		}

		return material;
	};

	return exports;
}();
},{}],2:[function(require,module,exports){
// glMatrix assumed Global
var Camera = module.exports = function() {
	var exports = {};
	var prototype = {
		// Set Rotation from Euler
		// Set Position x, y, z
		// Note do not have enforced copy setters, the user is responsible for this
		getProjectionMatrix: function(out, ratio) {
			if(this.type == Camera.Type.Perspective) {
				mat4.perspective(out, this.fov, ratio, this.near, this.far);
			} else {
				var left = - (this.height * ratio) / 2;
				var right = - left;
				var top = this.height / 2;
				var bottom = -top;
				mat4.ortho(out, left, right, bottom, top, this.near, this.far);
			}
			return out;
		}
	};
	var Type = exports.Type = {
		Perspective: "Perspective",
		Orthonormal: "Orthonormal"
	};
	var create = exports.create = function(parameters) {
		var camera = Object.create(prototype);
		// TODO: Arguement Checking
		camera.type = parameters.type ? parameters.type : Type.Perspective;
		camera.near = parameters.near;
		camera.far = parameters.far;
		if(camera.type == Type.Perspective) {
			camera.fov = parameters.fov;
		} else if (camera.type == Type.Orthonormal) {
			camera.height = parameters.height;

		} else {
			throw new Error("Unrecognised Camera Type '"+camera.type+"'");
		}
		camera.position = parameters.position ? parameters.position : vec3.create();
		camera.rotation = parameters.rotation ? parameters.rotation : quat.create();
		return camera;
	};
	return exports;
}();
},{}],6:[function(require,module,exports){

var Scene = module.exports = function() {
	var exports = {};
	var prototype = {
		// Add Object (material & mesh provided, spawns mesh instance, returns object with transform)

		// Add Camera
	};

	// private mesh list
	// private mesh instances
	// private material list

	// Going to use dictionaries but with an array of keys for enumeration (hence private with accessor methods)

	var create = exports.create = function(parameters) {
		var scene = Object.create(prototype);


		return scene;
	};

	return exports;
}();
},{}],5:[function(require,module,exports){
// glMatrix assumed Global
// This module is essentially a GL Context Facade
// There are - of necessity - a few hidden logical dependencies in this class
// mostly with the render functions, binding buffers before calling a function draw 
var gl, currentShaderProgram;

exports.init = function(canvas) {
	gl = canvas.getContext('webgl');
	if(!gl) {
		gl = canvas.getContext('experimental-webgl');
	}
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);	// TODO: expose as method
};

exports.clearColor = function(r,g,b,a) {
	gl.clearColor(r, g, b, a);
}

exports.clear = function() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); // TODO: this isn't necessary every frame
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

// Shader / Shader Programs

var ShaderType = exports.ShaderType = {
	Vertex: "vertex",
	Fragment: "fragment"
};

exports.createShader = function(type, glsl) {
	var shader;
	if (type == ShaderType.Vertex) {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else if (type == ShaderType.Fragment) {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else {
		throw new Error("Unrecognised shader type '"+type+"'");
	}
	gl.shaderSource(shader, glsl);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error("Could not create shader " + gl.getShaderInfoLog(shader));
	}
	return shader;
};

exports.createShaderProgram = function(vertexShader, fragmentShader) {
	var program = gl.createProgram();
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

exports.createBuffer = function(data, itemSize) {
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	buffer.itemSize = itemSize;
	buffer.numItems = data.length / itemSize;
	return buffer;
};

// Textures

var TextureQuality = exports.TextureQuality = {
	High: "high",			// Uses Mips & Interp
	Medium: "medium",		// Linear Interp 
	Low: "low"				// Uses nearest pixel
};

exports.createTexture = function(source, quality) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
	if(quality === TextureQuality.High) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	else if (quality === TextureQuality.Medium) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}
	else {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
};

exports.setTexture = function(texture) {
	gl.activeTexture(gl.TEXTURE0);		// TODO: Use multi textures and expose management of this
	gl.bindTexture(gl.TEXTURE_2D, texture);
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

exports.setIndexedAttribute = function(name, buffer) {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(currentShaderProgram.attributeLocations[name], buffer.itemSize, gl.FLOAT, false, 0, 0);	
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
	gl.uniform3f(currentShaderProgram.uniformLocations[name], value);
};
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

exports.drawTriangles = function(count) {
	gl.drawArrays(gl.TRIANGLES, 0, count);
};
exports.drawTriangleStrip = function(count) {
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
};
exports.drawLines = function(count) {
	gl.drawArrays(gl.LINES, 0, count);
};
exports.drawPoints = function(count) {
	gl.drawArrays(gl.POINTS, 0, count);
};
exports.drawIndexedTriangles = function(count, offset) {
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, offset);
};
exports.drawIndexedLines = function(count, offset) {
	gl.drawElements(gl.LINES, count, gl.UNSIGNED_SHORT, offset);
};
exports.drawIndexedPoints = function(count, offset) {
	gl.drawElements(gl.POINTS, count, gl.UNSIGNED_SHORT, offset);
};

},{}],4:[function(require,module,exports){
var r = require('./renderer');

var Mesh = module.exports = function(){
	exports = {};

	var prototype = {
		calculateNormals: function() {
			// TODO: Calculate Normals from Vertex information
		},
		setVertices: function(vertices) {
			this.vertexBuffer = r.createBuffer(vertices, 3);
		},
		setTextureCoordinates: function(textureCoordinates) {
			this.textureBuffer = r.createBuffer(textureCoordinates, 2);
		},
		setNormals: function(normals) {
			this.normalBuffer = r.createBuffer(normals, 3);
		},
		setIndexBuffer: function(indices) {
			this.indexBuffer = r.createBuffer(indices, 1);
			this.indexed = true;
		}
	};

	var create = exports.create = function(parameters) {
		var mesh = Object.create(prototype);
		if(parameters) {
			if(parameters.vertices) {
				mesh.setVertices(parameters.vertices);
			} 
			if(parameters.textureCoordinates) {
				mesh.setTextureCoordinates(parameters.textureCoordinates);
			}
			if(parameters.normals) {
				mesh.setNormals(parameters.normals);
			}
			if(parameters.indices) {
				mesh.setIndexBuffer(parameters.indices);
			} else {
				mesh.indexed = false;
			}
			// TODO: Render Mode Strip, Loose Triangles, Points, Lines etc
		}
		return mesh;
	};

	return exports;
}();
},{"./renderer":5}],7:[function(require,module,exports){
var r = require('./renderer');

var Shader = module.exports = function() {
	var exports = {};
	var prototype = {};

	var create = exports.create = function(parameters) {
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
},{"./renderer":5}]},{},[1])
;