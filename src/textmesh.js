// Quick and dirty monospace textmesh using tilemap
const TileMap = require('./tilemap');
const { vec3 } = require('./maths');

module.exports = (function(){
	let exports = {};

	let Alignment = exports.Alignment = {
		"left": 0,
		"center": 1,
		"right": 2
	};

	exports.create = (config) => {
		let { text, scene, atlas, position, alignment, color } = config;
		let textMesh = {
			text: text
		};

		let offset = 0;
		if (alignment == Alignment.center) {
			offset = Math.floor(text.length / 2) * atlas.tileSize;
		} else if (alignment == Alignment.right) {
			offset = text.length * atlas.tileSize;
		}
		let pos = vec3.fromValues(position[0] - offset, position[1], position[2]);

		let tileMap = TileMap.create({
			scene: scene,
			width: text.length,
			height: 1,
			position: pos,
			atlas: atlas, 
		});
	
		for (let i = 0, l = text.length; i < l; i++) {
			tileMap.setTile(i, 0, text[i], color);
		}

		textMesh.setChar = (i, char) => { tileMap.setTile(i, 0, char, color); };
		textMesh.remove = tileMap.remove;

		return textMesh;
	};

	return exports;
})();