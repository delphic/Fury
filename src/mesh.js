var r = require('./renderer');
var Bounds = require('./bounds');
var vec3 = require('./maths').vec3;

var Mesh = module.exports = function(){
	exports = {};

	let calculateMinPoint = exports.calculateMinPoint = function(out, vertices) {
		var i, l, v1 = Number.MAX_VALUE, v2 = Number.MAX_VALUE, v3 = Number.MAX_VALUE;
		for(i = 0, l = vertices.length; i < l; i += 3) {
			v1 = Math.min(v1, vertices[i]);
			v2 = Math.min(v2, vertices[i+1]);
			v3 = Math.min(v3, vertices[i+2]);
		}
		out[0] = v1, out[1] = v2, out[2] = v3;
	};

	let calculateMaxPoint = exports.calculateMaxPoint = function(out, vertices) {
		var i, l, v1 = Number.MIN_VALUE, v2 = Number.MIN_VALUE, v3 = Number.MIN_VALUE;
		for(i = 0, l = vertices.length; i < l; i += 3) {
			v1 = Math.max(v1, vertices[i]);
			v2 = Math.max(v2, vertices[i+1]);
			v3 = Math.max(v3, vertices[i+2]);
		}
		out[0] = v1, out[1] = v2, out[2] = v3;
	};

	// Returns the furthest vertex from the local origin
	// Note this is not the same as the furthest from the mid-point of the vertices
	// This is necessray for the boundingRadius to remain accurate under rotation
	let calculateBoundingRadius = function(vertices) {
		var sqrResult = 0;
		for (let i = 0, l = vertices.length; i< l; i += 3) {
			let sqrDistance = vertices[i] * vertices[i]
				+ vertices[i + 1] * vertices[i + 1]
				+ vertices[i + 2] * vertices[i + 2];
			if (sqrDistance > sqrResult) {
				sqrResult = sqrDistance;
			}
		}
		return Math.sqrt(sqrResult);
	};

	var prototype = {
		calculateBounds: function() {
			// NOTE: all bounds in local space
			this.boundingRadius = calculateBoundingRadius(this.vertices);
			calculateMinPoint(this.bounds.min, this.vertices);
			calculateMaxPoint(this.bounds.max, this.vertices);
			this.bounds.recalculateExtents();
		},
		// TODO: Method to calculate normals from vertex information + winding info
		updateVertices: function() {
			// TODO: If vertexBuffers exists we should delete the existing buffer?
			// or we should use the existing buffer and bind different data
			if (this.vertices) {
				this.vertexBuffer = r.createBuffer(this.vertices, 3);
			} else {
				console.warn("Unable to update vertexBuffer from mesh vertices, ensure mesh was created with dynamic parameter");
			}
		},
		updateTextureCoordinates: function() {
			// TODO: If uvBuffer exists we should delete the existing buffer?
			// or we should use the existing buffer and bind different data
			if (this.textureCoordinates) {
				this.textureBuffer = r.createBuffer(this.textureCoordinates, 2);
			} else {
				console.warn("Unable to update textureBuffer from texture coordinates, ensure mesh was created with dynamic parameter");
			}
		},
		updateNormals: function() {
			// TODO: If normalBuffer exists we should delete the existing buffer?
			// or we should use the existing buffer and bind different data
			if (this.normals) {
				this.normalBuffer = r.createBuffer(this.normals, 3);
			} else {
				console.warn("Unable to update normalBuffer from mesh normals, ensure mesh was created with dynamic parameter");
			}
		},
		updateIndexBuffer: function() {
			// TODO: If indexBuffer exists we should delete the existing buffer?
			// or we should use the existing buffer and bind different data
			if (this.indices) {
				this.indexBuffer = r.createBuffer(this.indices, 1, true);
				this.indexed = true;	
			} else {
				console.warn("Unable to update indexBuffer from mesh indices, ensure mesh was created with dynamic parameter");
			}
		}
	};

	var create = exports.create = function(parameters) {
		var mesh = Object.create(prototype);

		mesh.bounds = Bounds.create({ min: vec3.create(), max: vec3.create() });

		if (parameters) {
			if (parameters.renderMode) {
				mesh.renderMode = parameters.renderMode;
			} else {
				mesh.renderMode = r.RenderMode.Triangles;
			}

			mesh.boundingRadius = parameters.boundingRadius | 0;

			if (parameters.buffers) {
				// NOTE: update<X> methods will not work when providing buffers directly
				// if the mesh needs to be manipulated at run time, it's best to convert the buffers
				// to JS arrays create the mesh data with that.
				if (parameters.vertices && parameters.vertexCount) {
					mesh.vertices = parameters.vertices;
					mesh.calculateBounds();
					mesh.vertexBuffer = r.createArrayBuffer(parameters.vertices, 3, parameters.vertexCount);
				}
				if (parameters.textureCoordinates && parameters.textureCoordinatesCount) {
					mesh.textureBuffer = r.createArrayBuffer(parameters.textureCoordinates, 2, parameters.textureCoordinatesCount);
				}
				if (parameters.normals && parameters.normalsCount) {
					mesh.normalBuffer = r.createArrayBuffer(parameters.normals, 3, parameters.normalsCount);
				}

				if (parameters.customBuffers && parameters.customBuffers.length) {
					mesh.customBuffers = [];
					for (let i = 0, l = parameters.customBuffers.length; i < l; i++) {
						let customBuffer = parameters.customBuffers[i];
						switch (customBuffer.componentType) {
							case 5126: // Float32
								mesh.customBuffers[customBuffer.name] = r.createArrayBuffer(customBuffer.buffer, customBuffer.size, customBuffer.count);
								break;
							case 5123: // Int16
								mesh.customBuffers[customBuffer.name] = r.createElementArrayBuffer(customBuffer.buffer, customBuffer.size, customBuffer.count);
								// UNTESTED
								break;
						}
					}
				}

				if (parameters.indices && parameters.indexCount) {
					mesh.indexBuffer = r.createElementArrayBuffer(parameters.indices, 1, parameters.indexCount);
					mesh.indexed = true;
				} else {
					mesh.indexed = false;
				}
			} else {
				if (parameters.vertices) {
					mesh.vertices = parameters.vertices;
					mesh.calculateBounds();
					mesh.updateVertices();
				}
				if (parameters.textureCoordinates) {
					mesh.textureCoordinates = parameters.textureCoordinates;
					mesh.updateTextureCoordinates();
				}
				if (parameters.normals) {
					mesh.normals = parameters.normals;
					mesh.updateNormals();
				}
				if (parameters.indices) {
					mesh.indices = parameters.indices;
					mesh.updateIndexBuffer();
				} else {
					mesh.indexed = false;
				}

				/*
				if (!parameters.dynamic) {
					// clear mesh data if not mesh does not need to be dynamically updated
					mesh.vertices = null;
					mesh.textureCoordinates = null;
					mesh.normals = null;
					mesh.indices = null;
				} */ 
				// TODO: Check that scene does not make use of methods which need these arrays - It does, it uses Copy for Prefabs
				// TODO: Update copy method to duplicate buffer? doesn't seem to be possible. We need to keep the data for any mesh intend to copy, either prefabs
				// mush have dynamic set *or* perhaps we do away with mesh copy and have prefabs store their mesh creation data and make new mesh instances instead,
				// same for material - I think this is cleaner, lets do that.
				// TODO: Check demos for dynamic mesh manipulation
			}
		}
		return mesh;
	};

	var copy = exports.copy = function(mesh) {
		var copy = Object.create(prototype);
		// Note this is explicit rather than automatic using reflection
		// as we do not want to copy any dynamically appended properties (i.e. id)
		copy.indexed = mesh.indexed;
		copy.renderMode = mesh.renderMode;
		copy.boundingRadius = mesh.boundingRadius;
		copy.bounds = Bounds.create({ min: mesh.bounds.min, max: mesh.bounds.max }) ;
		if (mesh.vertices) {
			copy.vertices = mesh.vertices.slice(0);
			copy.updateVertices();
		}
		if (mesh.textureCoordinates) {
			copy.textureCoordinates = mesh.textureCoordinates.slice(0);
			copy.updateTextureCoordinates();
		}
		if (mesh.normals) {
			copy.normals = mesh.normals.slice(0);
			copy.updateNormals();
		}
		if (mesh.indices) {
			copy.indices = mesh.indices.slice(0);
			copy.updateIndexBuffer();
		}
		// TODO: Copy custom buffers

		return copy;
	};

	return exports;
}();
