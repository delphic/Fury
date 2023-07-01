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

	return exports;
})();