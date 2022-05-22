// Really basic tilemap using prefabs per tile

// Could probably be vastly improved by using a custom shader
// and a lookup texture into the atlas texture 
// (i.e. single quad, single material, easy to move etc)

const Atlas = require('./atlas');
const { vec3 } = require('./maths');

module.exports = (function(){
	let exports = {};

	exports.create = (config) => {
		let { scene, width: w, height: h, position: pos, atlas, defaultTile } = config;

		let tileMap = {};
		tileMap.width = w;
		tileMap.height =  h;

		let { tileWidth, tileHeight } = atlas;
		let position = vec3.clone(pos);
		let tiles = [];

		tileMap.setTile = (x, y, tile, color) => {
			let index = x + y * w;
			if (index >= 0 && index < tiles.length) {
				let name = Atlas.createTilePrefab({ atlas: atlas, tile: tile, color: color });
				if (tiles[index]) { scene.remove(tiles[index]); }
				tiles[index] = scene.instantiate({
					name: name,
					position: vec3.fromValues(position[0] + x * tileWidth, position[1] + y * tileHeight, position[2])
				});
			}
		};

		tileMap.fill = (tile, color) => {
			let name = Atlas.createTilePrefab({ atlas: atlas, tile: tile, color: color });
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					let index = x + w * y;
					if (tiles[index]) { scene.remove(tiles[index]); }
					tiles[x + w * y] = scene.instantiate({
						name: name,
						position: vec3.fromValues(position[0] + x * tileWidth, position[1] + y * tileHeight, position[2])
					});
				}
			}
		};

		tileMap.isTileActive = (x, y) => {
			if (x >= 0 && y >= 0 && x < w && y < h) {
				return tiles[x + y * w].active;
			}
		};
		
		tileMap.setTileActive = (x, y, active) => {
			if (x >= 0 && y >= 0 && x < w && y < h) {
				tiles[x + y * w].active = active;
			}
		};

		tileMap.remove = () => {
			for (let i = 0, l = tiles.length; i < l; i++) {
				scene.remove(tiles[i]);
			}
		};

		if (defaultTile !== undefined) {
			tileMap.fill(defaultTile);
		} else {
			tiles.length = w * h;
		}

		return tileMap;
	};

	return exports;
})();