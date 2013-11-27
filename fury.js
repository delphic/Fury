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

},{"./camera":2,"./material":3,"./renderer":4,"./mesh":5,"./scene":6,"./shader":7}],2:[function(require,module,exports){
// glMatrix assumed Global
var Camera = module.exports = function() {
	var exports = {};
	var prototype = {
		// Set Rotation from Euler
		// Set Position x, y, z
		// Note do not have enforced copy setters, the user is responsible for this
		getProjectionMatrix: function(out) {
			if(this.type == Camera.Type.Perspective) {
				mat4.perspective(out, this.fov, this.ratio, this.near, this.far);
			} else {
				var left = - (this.height * this.ratio) / 2.0;
				var right = - left;
				var top = this.height / 2.0;
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
		camera.ratio = parameters.ratio ? parameters.ratio : 1.0;
		camera.position = parameters.position ? parameters.position : vec3.create();
		camera.rotation = parameters.rotation ? parameters.rotation : quat.create();

		// TODO: Arguably post-processing effects and target could/should be on the camera, the other option is on the scene

		return camera;
	};
	return exports;
}();
},{}],4:[function(require,module,exports){
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

exports.createBuffer = function(data, itemSize, indexed) {
	var buffer = gl.createBuffer();
	if(!indexed) {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	} else {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
	}
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

exports.setIndexedAttribute = function(buffer) {	// Should arguably be renamed - there's isn't an index attribute
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
var RenderMode = exports.RenderMode = {
	Triangles: "triangles",
	TriangleStrip: "triangleStrip",
	Lines: "lines",
	Points: "points"
};

var drawTriangles = exports.drawTriangles = function(count) {
	gl.drawArrays(gl.TRIANGLES, 0, count);
};
var drawTriangleStrip = exports.drawTriangleStrip = function(count) {
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
};
var drawLines = exports.drawLines = function(count) {
	gl.drawArrays(gl.LINES, 0, count);
};
var drawPoints = exports.drawPoints = function(count) {
	gl.drawArrays(gl.POINTS, 0, count);
};
var drawIndexedTriangles = exports.drawIndexedTriangles = function(count, offset) {
	gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, offset);
};
var drawIndexedTriangleStrip = exports.drawIndexedTriangleStrip = function(count, offset) {
	gl.drawElements(gl.TRIANGLE_STRIP, count, gl.UNSIGNED_SHORT, offset);
}
var drawIndexedLines = exports.drawIndexedLines = function(count, offset) {
	gl.drawElements(gl.LINES, count, gl.UNSIGNED_SHORT, offset);
};
var drawIndexedPoints = exports.drawIndexedPoints = function(count, offset) {
	gl.drawElements(gl.POINTS, count, gl.UNSIGNED_SHORT, offset);
};

exports.draw = function(renderMode, count, indexed, offset) {
	switch(renderMode) {
		case RenderMode.Triangles:
			if(!indexed) { 
				drawTriangles(count);
			} else {
				drawIndexedTriangles(count, offset);
			}
			break;
		case RenderMode.TriangleStrip:
			if(!indexed) {
				drawTriangleStrip(count);
			} else {
				drawIndexedTriangleStrip(count);
			}
			break;
		case RenderMode.Lines:
			if(!indexed) {
				drawLines(count);
			} else {
				drawIndexedLines(count, offset);
			}
			break;
		case RenderMode.Points:
			if(!indexed) {
				drawPoints(count);
			} else {
				drawIndexedPoints(count, offset);
			}
			break;
		default:
			throw new Error("Unrecognised renderMode '"+renderMode+"'");
	}
};
},{}],3:[function(require,module,exports){
var Material = module.exports = function(){
	var exports = {};
	var prototype = {
		setTexture: function(name, texture) {
			// TODO: Check that its a valid GL texture
			this.textures[name] = texture;
		}
	};

	var create = exports.create = function(parameters) {
		var material = Object.create(prototype);

		if(!parameters.shader) {
			throw new Error("Shader must be provided");
		}
		material.shader = parameters.shader;

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
},{}],5:[function(require,module,exports){
var r = require('./renderer');

var Mesh = module.exports = function(){
	exports = {};

	var prototype = {
		calculateNormals: function() {
			// TODO: Calculate Normals from Vertex information
		},
		updateVertices: function() {
			this.vertexBuffer = r.createBuffer(this.vertices, 3);
		},
		updateTextureCoordinates: function() {
			this.textureBuffer = r.createBuffer(this.textureCoordinates, 2);
		},
		updateNormals: function() {
			this.normalBuffer = r.createBuffer(this.normals, 3);
		},
		updateIndexBuffer: function() {
			this.indexBuffer = r.createBuffer(this.indices, 1, true);
			this.indexed = true;
		}
	};

	var create = exports.create = function(parameters) {
		var mesh = Object.create(prototype);
		if(parameters) {
			if(parameters.vertices) {
				mesh.vertices = parameters.vertices;
				mesh.updateVertices();
			} 
			if(parameters.textureCoordinates) {
				mesh.textureCoordinates = parameters.textureCoordinates;
				mesh.updateTextureCoordinates();
			}
			if(parameters.normals) {
				mesh.normals = parameters.normals;
				mesh.updateNormals();
			}
			if(parameters.indices) {
				mesh.indices = parameters.indices;
				mesh.updateIndexBuffer();
			} else {
				mesh.indexed = false;
			}
			if(parameters.renderMode) {
				mesh.renderMode = parameters.renderMode;
			} else {
				mesh.renderMode = r.RenderMode.Triangles;
			}
		}
		return mesh;
	};

	return exports;
}();
},{"./renderer":4}],6:[function(require,module,exports){
(function(){// glMatrix assumed global
var r = require('./renderer');
var indexedMap = require('./indexedMap');

var Scene = module.exports = function() {
	var nextSceneId = 0;
	var exports = {};
	var prototype = {};

	// Note Meshes and Materials shared across scenes
	// Going to use dictionaries but with an array of keys for enumeration (hence private with accessor methods)
	var meshes = indexedMap.create();
	var materials = indexedMap.create();
	
	var create = exports.create = function(parameters) {
		var sceneId = (nextSceneId++).toString();
		var cameras = {};
		var cameraNames = [];
		var mainCameraName = "main";
		var pMatrix = mat4.create(), mvMatrix = mat4.create(), cameraMatrix = mat4.create();	// mvMatrix may need to be a stack in future (although a stack which avoids unnecessary mat4.creates)

		var scene = Object.create(prototype);

		var renderObjects = indexedMap.create(); // No explicit instancing just yet - just a list of render renderObjects 
		// these renderObjects need to contain at minimum materialId, meshId, and transform (currently object just has material and mesh as well as transform)

		// Add Object 
		scene.add = function(object) {
			if(!object || !object.mesh || !object.material) {
				throw new Error("Mesh and Material must be present on the object.");
			}
			if(!object.material.id) {
				object.material.id = materials.add(object.material);
			}
			if(!object.mesh.id) {
				object.mesh.id = meshes.add(object.mesh);
			}

			// This shouldn't be done here, should be using a Fury.GameObject or similar concept, which will come with a transform
			// Should be adding a renderer component to said concept (?) 
			if(!object.position) {
				object.position = vec3.create();
			} 
			if(!parameters.rotation) {
				object.rotation = quat.create();
			}
			if(!object.scale) {
				object.scale = vec3.create();
			}

			var id = renderObjects.add(object);
			object.sceneId = id;
			return object;
		}
		// Add Camera
		scene.addCamera = function(camera, name) {
			var key = name ? name : "main";
			if(cameraNames.length == 0) {
				mainCameraName = key;
			} 
			if(!cameras.hasOwnProperty(key)) {
				cameraNames.push(key);
			}
			cameras[key] = camera;
		}

		// Render
		scene.render = function(cameraName) {
			var camera = cameras[cameraName ? cameraName : mainCameraName];
			camera.getProjectionMatrix(pMatrix);
			mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
			
			// Brute Force for now, rebind EVERYTHING (so no need for the meshes / materials lists just yet)

			// TODO: Scene Graph - this will probably require setters for material / mesh on render objects so we don't have to rebuild the graph every frame
			// We are going to need to reorder it every frame once we include alpha though
			// Batched first by Material
			// Then by Mesh
			// Then render each Mesh Instance

			r.clear();

			for(var i = 0, l = renderObjects.keys.length; i < l; i++) {
				var object = renderObjects[renderObjects.keys[i]];

				// TODO: Frustum Culling

				var shader = object.material.shader;
				r.useShaderProgram(shader.shaderProgram);

				r.setUniformMatrix4(shader.pMatrixUniformName, pMatrix);

				shader.bindMaterial.call(r, object.material);

				shader.bindBuffers.call(r, object.mesh);

				// TODO: If going to use child coordinate systems then will need a stack of mvMatrices and a multiply here
				mat4.fromRotationTranslation(mvMatrix, object.rotation, object.position);
				mat4.multiply(mvMatrix, cameraMatrix, mvMatrix);	

				r.setUniformMatrix4(shader.mvMatrixUniformName, mvMatrix);
				
				r.draw(object.mesh.renderMode, object.mesh.indexed ? object.mesh.indexBuffer.numItems : object.mesh.vertexBuffer.numItems, object.mesh.indexed, 0);
			}
		}

		if(parameters && parameters.camera) {
			scene.addCamera(camera);
		}

		return scene;
	};

	return exports;
}();
})()
},{"./renderer":4,"./indexedMap":8}],7:[function(require,module,exports){
// Shader Class for use with Fury Scene
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
		
		shader.vs = r.createShader("vertex", parameters.vsSource);
		shader.fs = r.createShader("fragment", parameters.fsSource);
		shader.shaderProgram = r.createShaderProgram(shader.vs, shader.fs);
		if(parameters.attributeNames) {	// Could parse these from the shader
			for(i = 0, l = parameters.attributeNames.length; i < l; i++) {
				r.initAttribute(shader.shaderProgram, parameters.attributeNames[i]);
			}
		}
		if(parameters.uniformNames) {	// Could parse these from the shader
			for(i = 0, l = parameters.uniformNames.length; i < l; i++) {
				r.initUniform(shader.shaderProgram, parameters.uniformNames[i]);
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

		shader.pMatrixUniformName = parameters.pMatrixUniformName || "pMatrix";
		shader.mvMatrixUniformName = parameters.mvMatrixUniformName || "mvMatrix";

		// TODO: decide how to deal with non-standard uniforms

		return shader;
	};

	return exports;
}();
},{"./renderer":4}],8:[function(require,module,exports){
var IndexedMap = module.exports = function(){
	// This creates a dictionary that provides its own keys
	// It also contains an array of keys for quick enumeration
	// This does of course slow removal, so this structure should
	// be used for arrays where you want to enumerate a lot and 
	// also want references that do not go out of date when 
	// you remove an item (which is hopefully rarely).
	var exports = {};
	var nextKey = 1;

	var prototype = {
		add: function(item) {
			var key = (nextKey++).toString(); 
			this[key] = item;
			this.keys.push(key);
			return key; 
		},
		remove: function(key) {
			if(key != "keys" && this.hasOwnProperty(key)) {
				delete this.key;
				for(var i = 0, l = this.keys.length; i < l; i++) {
					if(this.keys[i] == key) {
						this.keys.splice(key,1);
					}
				}
			}
		}
	};

	var create = exports.create = function() {
		var map = Object.create(prototype);
		map.keys = [];
		return map;
	};

	return exports;
}();
},{}]},{},[1])
;