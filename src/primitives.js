const { RenderMode } = require('./renderer');

module.exports = (function(){
	let exports = {};

	exports.createQuadMeshConfig = (w, h) => {
		return {
			positions: [ 
				w, h, 0.0,
				0, h, 0.0, 
				w, 0, 0.0,
				0, 0, 0.0 ],
			normals: [
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0 ],
			uvs: [
				1.0, 1.0,
				0.0, 1.0,
				1.0, 0.0,
				0.0, 0.0 ],
			renderMode: RenderMode.TriangleStrip
		};
	};

	exports.createCenteredQuadMeshConfig = (w, h) => {
		let sx = w/2, sy = h/2;
		return {
			positions: [ 
				sx, sy, 0.0,
				-sx, sy, 0.0, 
				sx, -sy, 0.0,
				-sx, -sy, 0.0 ],
			normals: [
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0 ],
			uvs: [
				1.0, 1.0,
				0.0, 1.0,
				1.0, 0.0,
				0.0, 0.0 ],
			renderMode: RenderMode.TriangleStrip
		};
	};

	exports.createUIQuadMeshConfig = function(w, h) {
		return {
			positions: [ 
				w, h, 0.0,
				0, h, 0.0, 
				w, 0, 0.0,
				0, 0, 0.0 ],
			uvs: [
				1.0, 1.0,
				0.0, 1.0,
				1.0, 0.0,
				0.0, 0.0 ],
			indices: [
				0, 1, 2, 2, 1, 3
			],
			renderMode: RenderMode.Triangles
		};
	};

	exports.createCubiodMeshConfig = (w, h, d) => {
		let x = w / 2, y = h / 2, z = d / 2;
		return {
			positions: [
				// Front face
				-x, -y,  z,
				 x, -y,  z,
				 x,  y,  z,
				-x,  y,  z,
		
				// Back face
				-x, -y, -z,
				-x,  y, -z,
				 x,  y, -z,
				 x, -y, -z,
		
				// Top face
				-x,  y, -z,
				-x,  y,  z,
				 x,  y,  z,
				 x,  y, -z,
		
				// Bottom face
				-x, -y, -z,
				 x, -y, -z,
				 x, -y,  z,
				-x, -y,  z,
		
				// Right face
				 x, -y, -z,
				 x,  y, -z,
				 x,  y,  z,
				 x, -y,  z,
		
				// Left face
				-x, -y, -z,
				-x, -y,  z,
				-x,  y,  z,
				-x,  y, -z],
			uvs: [
				// Front face
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0,
		
				// Back face
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0,
				0.0, 0.0,
		
				// Top face
				0.0, 1.0,
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,
		
				// Bottom face
				1.0, 1.0,
				0.0, 1.0,
				0.0, 0.0,
				1.0, 0.0,
		
				// Right face
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0,
				0.0, 0.0,
		
				// Left face
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,
				0.0, 1.0 ],
			normals: [
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,
				0.0, 0.0, 1.0,

				0.0, 0.0, -1.0,
				0.0, 0.0, -1.0,
				0.0, 0.0, -1.0,
				0.0, 0.0, -1.0,

				0.0, 1.0, 0.0,
				0.0, 1.0, 0.0,
				0.0, 1.0, 0.0,
				0.0, 1.0, 0.0,

				0.0, -1.0, 0.0,
				0.0, -1.0, 0.0,
				0.0, -1.0, 0.0,
				0.0, -1.0, 0.0,

				1.0, 0.0, 0.0,
				1.0, 0.0, 0.0,
				1.0, 0.0, 0.0,
				1.0, 0.0, 0.0,

				-1.0, 0.0, 0.0,
				-1.0, 0.0, 0.0,
				-1.0, 0.0, 0.0,
				-1.0, 0.0, 0.0,
			],
			indices: [
				0, 1, 2,      0, 2, 3,    // Front face
				4, 5, 6,      4, 6, 7,    // Back face
				8, 9, 10,     8, 10, 11,  // Top face
				12, 13, 14,   12, 14, 15, // Bottom face
				16, 17, 18,   16, 18, 19, // Right face
				20, 21, 22,   20, 22, 23  // Left face
				] };
	};

	return exports;
})();