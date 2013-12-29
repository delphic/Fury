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
Fury.Transform = require('./transform');
Fury.prefabs = { keys: "Can't touch this, doo doo doo, do do, do do" };

Fury.createPrefab = function(parameters) {
	var prefabs = Fury.prefabs;
	if(!parameters || !parameters.name || prefabs[parameters.name]) {
		throw new Error("Please provide a valid and unique name parameter for your prefab");
	} else {
		prefabs[parameters.name] = parameters;
		// TODO: Once using a component system will need to transfer from parameter flat structure to gameobject structure, for now these are the same
		// Note that each component class should deal with setting up that component instance from supplied parameters itself
	}
};

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

},{"./camera":2,"./material":3,"./mesh":4,"./scene":5,"./renderer":6,"./shader":7,"./transform":8}],3:[function(require,module,exports){
var Material = module.exports = function(){
	var exports = {};
	var prototype = {
		blendEquation: "FUNC_ADD",
		sourceBlendType: "SRC_ALPHA",
		destinationBlendType: "ONE_MINUS_SRC_ALPHA"
	};

	var create = exports.create = function(parameters) {
		var material = Object.create(prototype);

		if(!parameters.shader) {
			throw new Error("Shader must be provided");
		}
		material.shader = parameters.shader;

		material.textures = {};
		if(parameters.textures) {
			var textures = parameters.textures;
			for(var i = 0, l = textures.length; i < l; i++) {
				if(textures[i].uniformName && textures[i].texture) {
					material.textures[textures[i].uniformName] = textures[i].texture;
				} else {
					throw new Error("Texture Array must contain objects with properties 'uniformName' and 'texture'");
				}
			}
		}

		return material;
	};

	var copy = exports.copy = function(material) {
		var copy = Object.create(prototype);
		copy.shader = material.shader;
		copy.textures = {};
		if(material.textures) {
			var textures = material.textures;
			for(var key in textures) {
				if(textures.hasOwnProperty(key)) {
					copy.textures[key] = textures[key];
				}
			}
		}
		return copy;
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
		getDepth: function(object) {
			var p0 = this.position[0], p1 = this.position[1], p2 = this.position[2], 
				q0 = this.rotation[0], q1 = this.rotation[1], q2 = this.rotation[2], q3 = this.rotation[3], 
				l0 = object.transform.position[0], l1 = object.transform.position[1], l2 = object.transform.position[2];
			return 2*(q1*q3 + q0*q2)*(l0 - p0) + 2*(q2*q3 - q0*q1)*(l1 - p1) + (1 - 2*q1*q1 - 2*q2*q2)*(l2 - p2);
		},
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
},{}],6:[function(require,module,exports){
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

	// WebGL is supposed to have 32 texture locations but this seems to vary
	// Now TextureLocations.length will tell you how many there are and provide
	// a link from the integer to the actual value
	TextureLocations.length = 0;
	var i = 0;
	while(gl["TEXTURE"+i.toString()]) {
		TextureLocations.push(gl["TEXTURE"+i.toString()]);
		i++;
	}
};

exports.clearColor = function(r,g,b,a) {
	gl.clearColor(r, g, b, a);
};

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

var TextureLocations = exports.TextureLocations = [];

var TextureQuality = exports.TextureQuality = {
	High: "high",			// Uses Mips & Interp
	Medium: "medium",		// Linear Interp 
	Low: "low"				// Uses nearest pixel
};

exports.createTexture = function(source, quality, clamp) {
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
	if (clamp) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
};

exports.setTexture = function(location, texture) {
	gl.activeTexture(TextureLocations[location]);
	gl.bindTexture(gl.TEXTURE_2D, texture);
};

// Blending
var BlendEquation = exports.BlendEquation = {
	Add: "FUNC_ADD",
	Subtract: "FUNC_SUBTRACT",
	ReverseSubtract: "FUNC_REVERSE_SUBTRACT"
};

var BlendType = exports.BlendType = {
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
	if(equation) {
		gl.blendEquation(gl[equation]);
	}
	if(sourceBlend && destinationBlend) {
		gl.blendFunc(gl[sourceBlend], gl[destinationBlend]);
	}
	gl.enable(gl.BLEND);
	gl.depthMask(false);

};

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
},{}],8:[function(require,module,exports){
var Transform = module.exports = function() {
	var exports = {};
	var prototype = {};
	exports.create = function(parameters) {
		var transform = Object.create(prototype);
		if(!parameters.position) {
			transform.position = vec3.create();
		}  else {
			transform.position = parameters.position;
		}
		if(!parameters.rotation) {
			transform.rotation = quat.create();
		} else {
			transform.rotation = parameters.rotation;
		}
		if(!parameters.scale) {
			transform.scale = vec3.fromValues(1.0, 1.0, 1.0);
		} else {
			transform.scale = parameters.scale;
		}
		return transform;
	};
	return exports;
}();
},{}],4:[function(require,module,exports){
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

	var copy = exports.copy = function(mesh) {
		var copy = Object.create(prototype);

		copy.indexed = mesh.indexed;
		copy.renderMode = mesh.renderMode;
		if(mesh.vertices) {
			copy.vertices = mesh.vertices.slice(0);
			copy.updateVertices();
		}
		if(mesh.textureCoordinates) {
			copy.textureCoordinates = mesh.textureCoordinates.slice(0);
			copy.updateTextureCoordinates();
		}
		if(mesh.normals) {
			copy.normals = mesh.normals.slice(0);
			copy.updateNormals();
		}
		if(mesh.indices) {
			copy.indices = mesh.indices.slice(0);
			copy.updateIndexBuffer();
		}
		return copy;
	};

	return exports;
}();
},{"./renderer":6}],5:[function(require,module,exports){
(function(){// glMatrix assumed global
var r = require('./renderer');
var indexedMap = require('./indexedMap');
var Material = require('./material');
var Mesh = require('./mesh');
var Transform = require('./transform');

var Scene = module.exports = function() {
	var nextSceneId = 0;
	var exports = {};
	var prototype = {};

	// Note Meshes and Materials shared across scenes
	// Going to use dictionaries but with an array of keys for enumeration (hence private with accessor methods)
	var meshes = indexedMap.create();
	var materials = indexedMap.create();
	var shaders = indexedMap.create();
	var textures = indexedMap.create();
	
	var create = exports.create = function(parameters) {
		var sceneId = (nextSceneId++).toString();
		var cameras = {};
		var cameraNames = [];
		var mainCameraName = "main";
		var pMatrix = mat4.create(), mvMatrix = mat4.create(), cameraMatrix = mat4.create();	// mvMatrix may need to be a stack in future (although a stack which avoids unnecessary mat4.creates)
		var currentShaderId, currentMaterialId, currentMeshId, pMatrixRebound = false;
		var nextTextureLocation = 0, currentTextureBindings = {}, currentTextureLocations = [];	// keyed on texture.id to binding location, keyed on binding location to texture.id

		var scene = Object.create(prototype);

		// these renderObjects / instances on prefabs need to contain at minimum materialId, meshId, and transform (currently object just has material and mesh as well as transform)
		var renderObjects = indexedMap.create(); // TODO: use materialId / meshId to bind
		var prefabs = { keys: [] };	// Arguably instances could be added to renderer objects and memory would still be saved, however keeping a separate list allows easier batching for now
		// TODO: Should have an equivilent to indexedMap but where you supply the keys, keyedMap?.
		var alphaRenderObjects = [];
		var depths = {};

		var addTexturesToScene = function(material) {
			for(var i = 0, l = material.shader.textureUniformNames.length; i < l; i++) {
				var uniformName = material.shader.textureUniformNames[i];
				var texture = material.textures[uniformName];
				if(texture) {
					textures.add(texture);
					bindTextureToLocation(texture);
				}
				
			}
		};

		var bindTextureToLocation = function(texture) {
			if(currentTextureLocations.length < r.TextureLocations.length) {
				r.setTexture(currentTextureLocations.length, texture);
				currentTextureBindings[texture.id] = currentTextureLocations.length;
				currentTextureLocations.push(texture.id);
			} else {
				// replace an existing texture
				delete currentTextureBindings[currentTextureLocations[nextTextureLocation]];
				r.setTexture(nextTextureLocation, texture);
				currentTextureBindings[texture.id] = nextTextureLocation;
				currentTextureLocations[nextTextureLocation] = texture.id;
				nextTextureLocation = (nextTextureLocation+1)%r.TextureLocations.length;
			}
		};

		var addToAlphaList = function(object, depth) {
			depths[object.sceneId] = depth;
			// Binary search
			// Could technically do better by batching up items with the same depth according to material / mesh like sence graph
			var less, more, itteration = 1, inserted = false, index = Math.floor(alphaRenderObjects.length/2);
			while(!inserted) {
				less = (index === 0 || depths[alphaRenderObjects[index-1].sceneId] <= depth);
				more = (index >= alphaRenderObjects.length || depths[alphaRenderObjects[index].sceneId] >= depth);
				if(less && more) {
					alphaRenderObjects.splice(index, 0, object);
					inserted = true;
				} else {
					itteration++;
					var step = Math.ceil(alphaRenderObjects.length/(2*itteration));
					if(!less) {
						index -= step;
					} else {
						index += step;
					}
				}
			}
		};

		// Add Object 
		// TODO: RenderObject / Component should have its own class
		scene.add = function(parameters) {
			var object = {};
			if(!parameters || !parameters.mesh || !parameters.material) {
				throw new Error("Mesh and Material must be present on the object.");
			}

			object.material = parameters.material;
			object.mesh = parameters.mesh;
			
			object.meshId = meshes.add(object.mesh);
			object.materialId = materials.add(object.material);
			object.material.shaderId = shaders.add(object.material.shader);	// TODO: this Id doesn't belong on the material, it's a scene thing, either store a materialId -> shaderId in scene or add to renderObject
			addTexturesToScene(object.material);

			// This shouldn't be done here, should be using a Fury.GameObject or similar concept, which will come with a transform
			// Should be adding a renderer component to said concept (?) 
			object.transform = Transform.create(parameters);

			var id = renderObjects.add(object);
			object.sceneId = id;
			object.remove = function() {
				renderObjects.remove(this.id);
			}; // TODO: Move to prototype
			return object;
		};

		scene.instantiate = function(parameters) {
			var prefab;
			if(!parameters || !parameters.name || !Fury.prefabs[parameters.name]) {
				throw new Error("You must provide a valid prefab name");
			}
			if(!prefabs[parameters.name]) {
				var defn = Fury.prefabs[parameters.name];
				if(!defn.material || !defn.mesh) {
					throw new Error("Requested prefab must have a material and a mesh present");
				}
				prefab = {
					name: parameters.name,
					instances: indexedMap.create(),
					mesh: Mesh.copy(defn.mesh),
					material: Material.copy(defn.material),
					remove: function() {
						this.instaces.remove(this.id);
						// Note not deleting the locally stored prefab, even if !instances.length as we would get duplicate mesh / materials if we were to readd
						// Keeping the prefab details around is preferable and should be low overhead
					}
				};
				prefab.meshId = meshes.add(prefab.mesh);
				prefab.materialId =  materials.add(prefab.material);
				prefab.material.shaderId = shaders.add(prefab.material.shader);	// TODO: this Id doesn't belong on the material, it's a scene thing, either store a materialId -> shaderId in scene or add to renderObject
				addTexturesToScene(prefab.material);
				prefabs[parameters.name] = prefab;
				prefabs.keys.push(parameters.name);
			} else {
				prefab = prefabs[parameters.name];
			}
			var instance = Object.create(prefab);
			instance.transform = Transform.create(parameters);
			instance.id = prefab.instances.add(instance);
			return instance;
		};

		// Add Camera
		scene.addCamera = function(camera, name) {
			var key = name ? name : "main";
			if(cameraNames.length === 0) {
				mainCameraName = key;
			}
			if(!cameras.hasOwnProperty(key)) {
				cameraNames.push(key);
			}
			cameras[key] = camera;
		};

		// Render
		scene.render = function(cameraName) {
			var camera = cameras[cameraName ? cameraName : mainCameraName];
			camera.getProjectionMatrix(pMatrix);
			mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
			pMatrixRebound = false;
			alphaRenderObjects.length = 0;
			// Simple checks for now - no ordering

			// TODO: Scene Graph 
			// Batched first by Material
			// Then by Mesh
			// Then render each Mesh Instance

			// Extension batch materials such that shaders and then textures used overlap

			r.clear();

			// TODO: Scene graph will provide these as a single thing to loop over, will then only split and loop for instances at mvMatrix binding / drawing
			// Scene Graph should be class with enumerate() method, that way it can batch as described above and sort watch its batching whilst providing a way to simple loop over all elements 
			for(var i = 0, l = renderObjects.keys.length; i < l; i++) {
				// TODO: Frustum Culling	
				var renderObject = renderObjects[renderObjects.keys[i]];
				if(renderObject.material.alpha) {
					addToAlphaList(renderObject, camera.getDepth(renderObject));
				} else {
					bindAndDraw(renderObject);
				}
			}
			for(i = 0, l = prefabs.keys.length; i < l; i++) {
				var instances = prefabs[prefabs.keys[i]].instances;
				for(var j = 0, n = instances.keys.length; j < n; j++) {
					// TODO: Frustum Culling
					var instance = instances[instances.keys[j]];
					if(instance.material.alpha) {
						addToAlphaList(instance, camera.getDepth(instance));
					} else {
						bindAndDraw(instance);
					}
				}
			}
			for(i = 0, l = alphaRenderObjects.length; i < l; i++) {
				var renderObject = alphaRenderObjects[i];
				// Could probably do this in bind and draw method
				r.enableBlending(renderObject.material.sourceBlendType, renderObject.material.destinationBlendType, renderObject.material.blendEquation);
				bindAndDraw(renderObject);
			}
			r.disableBlending();
		};

		var bindAndDraw = function(object) {	// TODO: Separate binding and drawing
			var shader = object.material.shader;
			var material = object.material;
			var mesh = object.mesh;
			// BUG: 
			// If there's only one material or one mesh in the scene real time changes to the material or mesh will not present themselves as the id will still match the currently bound
			// mesh / material, seems like we're going need a flag on mesh / material for forceRebind for this case. (should probably be called forceRebind as it 'might' be rebound anyway)
			// Having now determined that actually we don't need to rebind uniforms when switching shader programs, we'll need this flag whenever there's only one mesh or material using a given shader.

			// TODO: When scene graph implemented - check material.shaderId against shader.id, and object.materialId against material.id and object.meshId against mesh.id
			// as this indicates that this object needs reording in the graph (as it's been changed). 

			var shaderChanged = false;
			var materialChanged = false;
			if(!shader.id || shader.id != currentShaderId) {
				shaderChanged = true;
				if(!shader.id) {	// Shader was changed on the material since originally added to scene
					material.shaderId = shaders.add(shader); 	// TODO: this Id doesn't belong on the material, it's a scene thing, either store a materialId -> shaderId in scene or add to renderObject
				}
				currentShaderId = shader.id;
				r.useShaderProgram(shader.shaderProgram);
				pMatrixRebound = false;
			}

			if(!pMatrixRebound) {
				// New Shader or New Frame, rebind projection Matrix
				r.setUniformMatrix4(shader.pMatrixUniformName, pMatrix);
				pMatrixRebound = true;
			}

			if(!material.id || material.id != currentMaterialId) {
				materialChanged = true;
				if(!material.id) {	// material was changed on object since originally added to scene
					object.materialId = materials.add(material);
				}
				currentMaterialId = material.id;
				shader.bindMaterial.call(r, material);
			}

			if(shaderChanged || materialChanged) {
				// Texture Rebinding dependencies 
				// If the shader has changed you DON'T need to rebind, you only need to rebind if the on the uniforms have changed since the shaderProgram was last used...
					// NOTE Large Changes needed because of this
					// I think we're just going to have to add a flag to materials and meshes to say "rebind" (because I've changed something)
					// This also means we should move the "currentMeshId / currentMaterial id to the shader instead or keep a keyed list on shader the id 
					// Lets do this after we've done the texture binding though eh? so for now just rebind everything if shader or material changes (overkill but it'll work)
				// If the material has changed textures may need rebinding
				
				// Check for gl location rebinds needed, if any needed and rebind all to make sure we don't replace a texture we're using
				var locationRebindsNeeded = false;
				for(var i = 0, l = shader.textureUniformNames.length; i < l; i++) {
					var uniformName = shader.textureUniformNames[i];
					if(material.textures[uniformName]) {
						var texture = material.textures[uniformName];
						if(!texture.id) {
							textures.add(texture);
							locationRebindsNeeded = true;
							break;
						}
						if(isNaN(currentTextureBindings[texture.id])) {
							locationRebindsNeeded = true;
							break;
						}
					}
				}
				// Rebind if necessary and set uniforms
				for(i = 0, l = shader.textureUniformNames.length; i < l; i++) {
					var uniformName = shader.textureUniformNames[i];
					if(material.textures[uniformName]) {
						var texture = material.textures[uniformName];
						if(locationRebindsNeeded) {
							bindTextureToLocation(texture);
						}
						r.setUniformInteger(uniformName, currentTextureBindings[texture.id]);
					}
				}
			}
			
			if(!mesh.id || mesh.id != currentMeshId) {
				if(!mesh.id) {	// mesh was changed on object since originally added to scene
					object.meshId = mesh.add(mesh);
				}
				currentMeshId = mesh.id;
				shader.bindBuffers.call(r, mesh);
			}

			// TODO: If going to use child coordinate systems then will need a stack of mvMatrices and a multiply here
			mat4.fromRotationTranslation(mvMatrix, object.transform.rotation, object.transform.position);
			mat4.scale(mvMatrix, mvMatrix, object.transform.scale);
			mat4.multiply(mvMatrix, cameraMatrix, mvMatrix);
			r.setUniformMatrix4(shader.mvMatrixUniformName, mvMatrix);
				
			r.draw(mesh.renderMode, mesh.indexed ? mesh.indexBuffer.numItems : mesh.vertexBuffer.numItems, mesh.indexed, 0);
		};

		if(parameters && parameters.camera) {
			scene.addCamera(parameters.camera);
		}

		return scene;
	};

	return exports;
}();
})()
},{"./renderer":6,"./indexedMap":9,"./material":3,"./transform":8,"./mesh":4}],7:[function(require,module,exports){
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
		if(parameters.textureUniformNames) {
			if(parameters.textureUniformNames.length > r.TextureLocations.length) {
				throw new Error("Shader can not use more texture than total texture locations (" + r.TextureLocations.length + ")");
			}
			shader.textureUniformNames = parameters.textureUniformNames;	// Again could parse from the shader, and could also not require duplicate between uniformNames and textureUniformNames
		} else {
			shader.textureUniformNames = [];
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
},{"./renderer":6}],9:[function(require,module,exports){
var IndexedMap = module.exports = function(){
	// This creates a dictionary that provides its own keys
	// It also contains an array of keys for quick enumeration
	// This does of course slow removal, so this structure should
	// be used for arrays where you want to enumerate a lot and 
	// also want references that do not go out of date when 
	// you remove an item (which is hopefully rarely).

	// Please note, again for purposes of speed and ease of use 
	// this structure adds the key of the item to the id property on items added
	// this eases checking for duplicates and if you have the only reference
	// you can still remove it from the list or check if it is in the list. 
	var exports = {};
	var nextKey = 1;

	var prototype = {
		add: function(item) {
			if(!item.id) {
				var key = (nextKey++).toString();
				item.id = key;
				this[key] = item;
				this.keys.push(key);
			}
			return item.id;
		},
		remove: function(key) {
			if(key != "keys" && this.hasOwnProperty(key)) {
				delete this.key;
				for(var i = 0, l = this.keys.length; i < l; i++) {
					if(this.keys[i] == key) {
						this.keys.splice(i,1);
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