var r = require('./renderer');
var Bounds = require('./bounds');

var Mesh = module.exports = function(){
	exports = {};

	let calculateMinVertex = function(mesh, out) {
		var i, l, v1 = Number.MAX_VALUE, v2 = Number.MAX_VALUE, v3 = Number.MAX_VALUE;
		for(i = 0, l = mesh.vertices.length; i < l; i += 3) {
			v1 = Math.min(v1, mesh.vertices[i]);
			v2 = Math.min(v2, mesh.vertices[i+1]);
			v3 = Math.min(v3, mesh.vertices[i+2]);
		}
		out[0] = v1, out[1] = v2, out[2] = v3;
	};

	let calculateMaxVertex = function(mesh, out) {
		var i, l, v1 = Number.MIN_VALUE, v2 = Number.MIN_VALUE, v3 = Number.MIN_VALUE;
		for(i = 0, l = mesh.vertices.length; i < l; i += 3) {
			v1 = Math.max(v1, mesh.vertices[i]);
			v2 = Math.max(v2, mesh.vertices[i+1]);
			v3 = Math.max(v3, mesh.vertices[i+2]);
		}
		out[0] = v1, out[1] = v2, out[2] = v3;
	};

	var prototype = {
		calculateBounds: function() {
			// NOTE: bounds in local space
			calculateMinVertex(this, this.bounds.min);
			calculateMaxVertex(this, this.bounds.max);
			this.bounds.calculateExtents();
		},
		calculateNormals: function() {
			// TODO: Calculate Normals from Vertex information
		},
		updateVertices: function() {
			this.vertexBuffer = r.createBuffer(this.vertices, 3);
			// TODO: If vertexBuffers exists we should delete the existing buffer?
			// or we should use the existing buffer and bind different data
		},
		updateTextureCoordinates: function() {
		  // TODO: If uvBuffer exists we should delete the existing buffer?
		  // or we should use the existing buffer and bind different data
			this.textureBuffer = r.createBuffer(this.textureCoordinates, 2);
		},
		updateNormals: function() {
		  // TODO: If normalBuffer exists we should delete the existing buffer?
		  // or we should use the existing buffer and bind different data
			this.normalBuffer = r.createBuffer(this.normals, 3);
		},
		updateIndexBuffer: function() {
		  // TODO: If indexBuffer exists we should delete the existing buffer?
		  // or we should use the existing buffer and bind different data
			this.indexBuffer = r.createBuffer(this.indices, 1, true);
			this.indexed = true;
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
			}
		}
		return mesh;
	};

	var copy = exports.copy = function(mesh) {
		var copy = Object.create(prototype);

		copy.indexed = mesh.indexed;
		copy.renderMode = mesh.renderMode;
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

		return copy;
	};

	return exports;
}();
