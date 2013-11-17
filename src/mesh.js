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