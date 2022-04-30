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

	let createBuffer = function(data, size, indexed) {
		if (data.buffer) {
			if (!indexed) {
				return r.createArrayBuffer(data, size, Math.round(data.length / size));
			} else {
				return r.createElementArrayBuffer(data, size, data.length);
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

		if (config) {
			let { renderMode = r.RenderMode.Triangles, boundingRadius = 0 } = config;
			mesh.renderMode = renderMode;
			mesh.boundingRadius = boundingRadius;

			let { vertices, textureCoordinates, normals, indices, customAttributes } = config;
			if (vertices) {
				calculateBounds(mesh, vertices);
				mesh.vertexBuffer = createBuffer(vertices, 3);
			}
			if (textureCoordinates) {
				mesh.textureBuffer = createBuffer(textureCoordinates, 2);
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
			}
		}
		return mesh;
	};

	return exports;
})();