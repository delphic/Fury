var r = require('./renderer');

var Mesh = module.exports = function(){
	exports = {};

	var prototype = {
		calculateBoundingRadius: function() {
			var i, l, n, sqRadius = 0, v1, v2, v3;
			n = this.renderMode == r.RenderMode.TriangleStrip ? 2 : 3;	// Would be 1 for triangle fan
			for(i = 0, l = this.vertices.length; i < l; i+=n) {
				v1 = this.vertices[i];
				v2 = this.vertices[i+1];
				v3 = this.vertices[i+2];
				sqRadius = Math.max(sqRadius, v1*v1 + v2*v2 + v3*v3);
			}
			return Math.sqrt(sqRadius);
		},
		calculateNormals: function() {
			// TODO: Calculate Normals from Vertex information
		},
		updateVertices: function() {
		    // If vertexBuffers exists we should delete the existing buffer?
		    // or we should use the existing buffer and bind different data
			this.boundingRadius = this.calculateBoundingRadius();
			this.vertexBuffer = r.createBuffer(this.vertices, 3);
		},
		updateTextureCoordinates: function() {
		    // If uvBuffer exists we should delete the existing buffer?
		    // or we should use the existing buffer and bind different data
			this.textureBuffer = r.createBuffer(this.textureCoordinates, 2);
		},
		updateNormals: function() {
		    // If normalBuffer exists we should delete the existing buffer?
		    // or we should use the existing buffer and bind different data
			this.normalBuffer = r.createBuffer(this.normals, 3);
		},
		updateIndexBuffer: function() {
		    // If indexBuffer exists we should delete the existing buffer?
		    // or we should use the existing buffer and bind different data
			this.indexBuffer = r.createBuffer(this.indices, 1, true);
			this.indexed = true;
		}
	};

	var create = exports.create = function(parameters) {
		var mesh = Object.create(prototype);
		mesh.boundingRadius = 0;
		if(parameters) {
			if(parameters.renderMode) {
				mesh.renderMode = parameters.renderMode;
			} else {
				mesh.renderMode = r.RenderMode.Triangles;
			}
			
			if (parameters.buffers) {
			    // NOTE: update<X> methods will not work when providing buffers directly
			    // if the mesh needs to be manipulated at run time, it's best to convert the buffers
			    // to JS arrays create the mesh data with that.
			    if (parameters.vertices && parameters.vertexCount) {
			        mesh.vertexBuffer = r.createArrayBuffer(parameters.vertices, 3, parameters.vertexCount);
			    }
			    if (parameters.boundingRadius) {
			        mesh.boundingRadius = parameters.boundingRadius;
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
			}
		}
		return mesh;
	};

	var copy = exports.copy = function(mesh) {
		var copy = Object.create(prototype);

		copy.indexed = mesh.indexed;
		copy.renderMode = mesh.renderMode;
		copy.boundingRadius = mesh.boundingRadius;
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