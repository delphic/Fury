const r = require('./renderer');
const Bounds = require('./bounds');
const vec3 = require('./maths').vec3;
const Utils = require('./utils');

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

	let createBuffer = function(data, size, indexed) {
		if (data.buffer) {
			if (!indexed) {
				return r.createArrayBuffer(data, size);
			} else {
				return r.createElementArrayBuffer(data, size);
			}
		} else {
			return r.createBuffer(data, size, indexed);
		}
	};

	let calculateBounds = exports.calculateBounds = function(mesh, vertices) {
		mesh.boundingRadius = calculateBoundingRadius(vertices);
		calculateMinPoint(mesh.bounds.min, vertices);
		calculateMaxPoint(mesh.bounds.max, vertices);
		mesh.bounds.recalculateExtents();
	};

	// TODO: Method to calculate normals from vertex information + winding info

	exports.create = function(config) {
		let mesh = {};

		mesh.bounds = Bounds.create({ min: vec3.create(), max: vec3.create() });
		mesh.boundingRadius = 0;

		update(mesh, config, true);

		return mesh;
	};

	let update = exports.update = function(mesh, config, firstBuild) {
		if (config) {
			if (config.renderMode !== undefined) {
				mesh.renderMode = config.renderMode;
			} else if (mesh.renderMode === undefined) {
				mesh.renderMode = r.RenderMode.Triangles;
			}

			let { positions, uvs, normals, indices, customAttributes } = config;

			// Backwards compatibility with old config naming
			if (!positions && config.vertices) {
				positions = config.vertices;
			}
			if (!uvs && config.textureCoordinates) {
				uvs = config.textureCoordinates;
			}

			if (positions) {
				calculateBounds(mesh, positions);
				mesh.vertexBuffer = createBuffer(positions, 3);
			}

			if (uvs) {
				mesh.textureBuffer = createBuffer(uvs, 2);
			}
			if (normals) {
				mesh.normalBuffer = createBuffer(normals, 3);
			}
			if (indices) {
				mesh.indexed = true;
				mesh.indexBuffer = createBuffer(indices, 1, true);
			} else {
				mesh.indexed = false;
			}

			if (customAttributes && customAttributes.length) {
				for (let i = 0, l = customAttributes.length; i < l; i++) {
					let { name, source, size } = customAttributes[i];
					if (!firstBuild || !mesh[name]) {
						let data = config[source];
						if (data.buffer) {
							mesh[name] = r.createArrayBuffer(data, size);
						} else {
							mesh[name] = r.createBuffer(data, size);
						}
					} else {
						console.error("Duplicate definition of '" + name + "' in mesh configuration " + JSON.stringify(customAttributes));
					}
				}
			}
		}
	};

	exports.combineConfig = function(meshes) {
		let result = { vertices: [], normals: [], textureCoordinates: [], indices: [] };
		for (let i = 0, l = meshes.length; i < l; i++) {
			let mesh = meshes[i];
			let indexOffset = result.vertices.length / 3;
			Utils.arrayCombine(result.vertices, mesh.vertices);
			Utils.arrayCombine(result.normals, mesh.normals);
			Utils.arrayCombine(result.textureCoordinates, mesh.textureCoordinates);
			for (let index = 0, n = mesh.indices.length; index < n; index++) {
				result.indices.push(mesh.indices[index] + indexOffset);
			}
		}
		return result;
	};

	return exports;
})();