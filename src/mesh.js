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