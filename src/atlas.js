const Maths = require('./maths');
const Prefab = require('./prefab');
const Renderer = require('./renderer');
const Shaders = require('./shaders');
const Primitives = require('./primitives');

module.exports = (function(){
	let exports = {};

	let getAtlasIndex = (atlas, name) => {
		let map = atlas.map;
		for (let i = 0, l = map.length; i < l; i++) {
			if (map[i] == name) {
				return i;
			}
		}
		return 0;
	};

	let getPrefabName = (atlas, atlasIndex, color, alpha) => {
		let name = atlas.id + "_" + atlasIndex;
		if (alpha !== undefined && alpha != atlas.materialConfig.properties.alpha) {
			name += "_" + (alpha ? "a1" : "a0");
		}

		if (color !== undefined && (color[0] != 1 || color[1] != 1 || color[2] != 1 || color[3] != 1)) {
			name += "_" + color[0] + "_" + color[1] + "_" + color[2] + "_" + color[3];
		}
		return name;
	}

	let setMaterialOffset = (config, atlasIndex, width, height) => {
		let offsetU = (atlasIndex % width) / width;
		let offsetV = 1 - (Math.floor(atlasIndex / width) + 1) / height;
		config.properties.offset = [ offsetU, offsetV ];
	};

	exports.setMaterialOffset = (config, atlas, tile) => {
		let atlasIndex = getAtlasIndex(atlas, tile);
		setMaterialOffset(config, atlasIndex, atlas.width, atlas.height);
	};

	exports.createTilePrefab = (config) => {
		let { atlas, tile, color, alpha } = config;
		let { width, height } = atlas;
		let atlasIndex = getAtlasIndex(atlas, tile);
		let prefabName = getPrefabName(atlas, atlasIndex, color, alpha);
		
		if (Prefab.prefabs[prefabName] === undefined) {
			let materialConfig = Object.create(atlas.materialConfig);
			if (alpha !== undefined) {
				materialConfig.properties.alpha = alpha;
			}
			if (color !== undefined) {
				materialConfig.properties.color = color;
			} else {
				 // This shouldn't be necessary, however it is
				materialConfig.properties.color = Maths.vec4.fromValues(1,1,1,1);
			}
			setMaterialOffset(materialConfig, atlasIndex, width, height);

			Prefab.create({
				name: prefabName, 
				meshConfig: atlas.meshConfig,
				materialConfig: materialConfig
			});
		}
		return prefabName;
	};

	exports.create = (config, image) => {
		if (!config.id || !config.map || !config.width || !config.height || !config.tileWidth || !config.tileHeight) {
			console.error("Invalid atlas definition provided, must contain properties: id, map, width, height, tileWidth and tileHeight");
		}
		let atlas = Object.create(config);
		atlas.alpha = atlas.alpha === undefined ? true : !!atlas.alpha;
		atlas.texture = Renderer.createTexture(image, "low");
		atlas.materialConfig = {
			shader: Shaders.Sprite,
			texture: atlas.texture,
			properties: {
				alpha: atlas.alpha,
				offset: [ 0, 0 ],
				scale: [ 1 / atlas.width, 1 / atlas.height ]
			}
		};
		atlas.meshConfig = Primitives.createQuadMeshConfig(atlas.tileWidth, atlas.tileHeight);
		return atlas;
	};

	exports.load = (config, callback) => {
		let image = new Image();
		image.onload = () => {
			callback(exports.create(config, image));
		};
		image.src = config.path;
	};

	return exports;
})();