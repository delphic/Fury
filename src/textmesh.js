// Simple single line text mesh using Atlas
// Broadly similar to tilemap, however supports varying position based on custom tile widths
// Prefabs generated by Atlas do not adjust for variable width so there is unnecessary blending / overdraw

const Atlas = require('./atlas');
const { vec3 } = require('./maths');

module.exports = (function(){
	let exports = {};

	let Alignment = exports.Alignment = {
		"left": 0,
		"center": 1,
		"right": 2
	};

	// Determines how round initial left most position when aligning
	// No rounding, floor to integer, or floor to the atlas.tileSize
	// Note: grid only works with atlases with static tile widths
	let AlignmentStyle = exports.AlignmentStyle = {
		"free": 0,
		"integer": 1,
		"grid": 2,
	};

	// Default alignment style - Assumes UI is pixel perfect, so integer
	exports.alignmentStyle = AlignmentStyle.integer;

	let atlasWidths = {};

	let generateCharWidthLookup = (atlas) => {
		let lookup = {};
		if (hasVariableTileWidths(atlas)) {
			for (let i = 0, l = atlas.customTileWidths.length; i < l; i++) {
				let { width, tiles } = atlas.customTileWidths[i];
				for (let j = 0, n = tiles.length; j < n; j++) {
					lookup[tiles[j]] = width;
				}
			}
		} 
		atlasWidths[atlas.id] = lookup;
	};

	let hasVariableTileWidths = exports.hasVariableTileWidths = (atlas) => {
		return atlas.customTileWidths && atlas.customTileWidths.length;
	};

	let getCharWidth = exports.getCharWidth = (atlas, char) => {
		let tileWidth = atlas.tileWidth;
		let lookup = atlasWidths[atlas.id];
		if (lookup && lookup[char] !== undefined) {
			tileWidth = lookup[char];
		}
		return tileWidth;
	};

	exports.create = (config) => {
		let { text, scene, atlas, position, alignment, color, alignmentStyle } = config;

		if (alignmentStyle === undefined || alignmentStyle === null) {
			alignmentStyle = exports.alignmentStyle;
		}

		if (!atlasWidths[atlas.id]) {
			generateCharWidthLookup(atlas);
		}

		let tiles = [];

		let textMesh = {};
		textMesh.remove = () => {
			for (let i = 0, l = tiles.length; i < l; i++) {
				scene.remove(tiles[i]);
			}
			tiles.length = 0;
		};

		let calculateWidth = textMesh.calculateWidth = (text) => {
			let width = 0;
			if (hasVariableTileWidths(atlas)) {
				for (let i = 0, l = text.length; i < l; i++) {
					width += getCharWidth(atlas, text[i]);
				}
			} else {
				width = text.length * atlas.tileWidth;
			}
			return width;
		};

		let calculateAlignmentOffset = (alignment, text) => {
			let offset = 0;
			if (alignment == Alignment.center) {
				if (alignmentStyle == AlignmentStyle.grid && !hasVariableTileWidths(atlas)) {
					offset = Math.floor(text.length / 2) * atlas.tileWidth;
				} else {
					offset = calculateWidth(text) / 2;
				}
			} else if (alignment == Alignment.right) {
				offset = calculateWidth(text);
			}
			if (offset && alignmentStyle == AlignmentStyle.integer) {
				offset = Math.floor(offset);
			}
			return offset;
		};

		textMesh.getText = () => text;
		textMesh.setText = (value) => {
			textMesh.remove();

			let offset = calculateAlignmentOffset(alignment, value);
			
			let x = position[0] - offset, y = position[1], z = position[2];
			for (let i = 0, l = value.length; i < l; i++) {
				let char = value[i];
				let name = Atlas.createTilePrefab({ atlas: atlas, tile: char, color: color });
				tiles.push(scene.instantiate({
					name: name,
					position: vec3.fromValues(x, y, z)
				}));
				x += getCharWidth(atlas, char);
			}
			text = value;
		};

		textMesh.setText(text);

		return textMesh;
	};

	return exports;
})();