const r = require('./renderer');
const Bounds = require('./bounds');
const vec3 = require('./maths').vec3;

module.exports = (function(){
	let exports = {};

	let calculateMinPoint = exports.calculateMinPoint = function(out, vertices) {
		let i, l, v1 = Number.MAX_VALUE, v2 = Number.MAX_VALUE, v3 = Number.MAX_VALUE;
		for (i = 0, l = vertices.length; i < l; i += 3) {
			v1 = Math.min(v1, vertices[i]);
			v2 = Math.min(v2, vertices[i+1]);
			v3 = Math.min(v3, vertices[i+2]);
		}
		out[0] = v1, out[1] = v2, out[2] = v3;
	};

	let calculateMaxPoint = exports.calculateMaxPoint = function(out, vertices) {
		let i, l, v1 = Number.MIN_VALUE, v2 = Number.MIN_VALUE, v3 = Number.MIN_VALUE;
		for (i = 0, l = vertices.length; i < l; i += 3) {
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

	let prototype = {
		calculateBounds: function() {
			// NOTE: all bounds in local space
			this.boundingRadius = calculateBoundingRadius(this.vertices);
			calculateMinPoint(this.bounds.min, this.vertices);
			calculateMaxPoint(this.bounds.max, this.vertices);
			this.bounds.recalculateExtents();
		},
		// TODO: Method to calculate normals from vertex information + winding info
		// TODO: Support updating arbitary buffers and support when meshConfig.isTypedBuffers == true
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

	exports.create = function(config) {
		let mesh = Object.create(prototype);

		mesh.bounds = Bounds.create({ min: vec3.create(), max: vec3.create() });

		if (config) {
			let { renderMode = r.RenderMode.Triangles, boundingRadius = 0 } = config;
			mesh.renderMode = renderMode;
			mesh.boundingRadius = boundingRadius;

			let { isTypedBuffers, vertices, textureCoordinates, normals, indices } = config;
			if (isTypedBuffers) {
				let { vertexCount, textureCoordinatesCount, normalsCount, indexCount, customBuffers } = config;

				if (vertices && vertexCount) {
					mesh.vertices = vertices;
					mesh.calculateBounds();
					mesh.vertices = null; // Note: as dynamic not supported for isTypedBuffers - remove vertices cache
					mesh.vertexBuffer = r.createArrayBuffer(vertices, 3, vertexCount);
				}
				if (textureCoordinates && textureCoordinatesCount) {
					mesh.textureBuffer = r.createArrayBuffer(textureCoordinates, 2, textureCoordinatesCount);
				}
				if (normals && normalsCount) {
					mesh.normalBuffer = r.createArrayBuffer(normals, 3, normalsCount);
				}

				if (customBuffers && customBuffers.length) {
					mesh.customBuffers = [];
					for (let i = 0, l = customBuffers.length; i < l; i++) {
						let { name, componentType, buffer, size, count } = customBuffers[i];
						switch (componentType) {
							case r.DataType.FLOAT: // Float32
								mesh.customBuffers[name] = r.createArrayBuffer(buffer, size, count);
								break;
							case r.DataType.SHORT: // Int16
								mesh.customBuffers[name] = r.createElementArrayBuffer(buffer, size, count);
								// UNTESTED
								break;
						}
					}
				}

				if (indices && indexCount) {
					mesh.indexBuffer = r.createElementArrayBuffer(indices, 1, indexCount);
					mesh.indexed = true;
				} else {
					mesh.indexed = false;
				}
			} else {
				let { customAttributes } = config;

				if (vertices) {
					mesh.vertices = vertices;
					mesh.calculateBounds();
					mesh.updateVertices();
				}
				if (textureCoordinates) {
					mesh.textureCoordinates = textureCoordinates;
					mesh.updateTextureCoordinates();
				}
				if (normals) {
					mesh.normals = normals;
					mesh.updateNormals();
				}
				if (indices) {
					mesh.indices = indices;
					mesh.updateIndexBuffer();
				} else {
					mesh.indexed = false;
				}

				if (customAttributes && customAttributes.length) {
					for (let i = 0, l = customAttributes.length; i < l; i++) {
						let { name, source, size } = customAttributes[i];
						if (!mesh[name]) {
							let data = config[source];
							if (data.buffer) {
								mesh[name] = r.createArrayBuffer(data, size, data.length);
							} else {
								mesh[name] = r.createBuffer(data, size);
							}
						} else {
							console.error("Duplicate definition of '" + name + "' in mesh configuration " + JSON.stringify(customAttributes));
						}
					}
					
					// Note - dynamic not currently supported for custom attributes
					if (config.dynamic) {
						console.warn("Mesh configuration stated dynamic but passed 2 custom attributes, these buffers will need to be updated manually");
					}
				}

				if (!config.dynamic) {
					// clear mesh data if not mesh does not need to be dynamically updated
					mesh.vertices = null;
					mesh.textureCoordinates = null;
					mesh.normals = null;
					mesh.indices = null;
				}
			}
		}
		return mesh;
	};

	return exports;
})();