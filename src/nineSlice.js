const Primitives = require('./primitives');

module.exports = (function(){
	let exports = {};

	// todo: move to UI positioniong module once it exists 
	const Anchor = exports.Anchor = {
		"topLeft": 0,
		"topCenter": 1,
		"topRight": 2,
		"middleLeft": 3,
		"middleCenter": 4,
		"middleRight": 5,
		"bottomLeft": 6,
		"bottomCenter": 7,
		"bottomRight": 9 
	};
	
	exports.PositionRounding = {
		"none": 0,
		"integer": 1,
	};

	let calculateAnchorOffsetX = function(anchor, targetWidth) {
		switch (anchor || 0) {
			case Anchor.topRight:
			case Anchor.middleRight:
			case Anchor.bottomRight:
				return anchorOffsetX = -targetWidth;
			case Anchor.topCenter:
			case Anchor.middleCenter:
			case Anchor.bottomCenter:
				return anchorOffsetX = -targetWidth / 2;
			case Anchor.topLeft:
			case Anchor.middleLeft:
			case Anchor.bottomLeft:
			default:
				return anchorOffsetX = 0;
		}
	};
	
	let calculateAnchorOffsetY = function(anchor, targetHeight) {
		switch (anchor || 0) {
			case Anchor.topLeft:
			case Anchor.topCenter:
			case Anchor.topRight:
				return -targetHeight;
			case Anchor.middleLeft:
			case Anchor.middleCenter:
			case Anchor.middleRight:
				return  -targetHeight / 2;
			case Anchor.bottomLeft:
			case Anchor.bottomCenter:
			case Anchor.bottomRight:
			default:
				return 0;
		}
	};

	exports.buildMeshConfig = (
		targetWidth,
		targetHeight,
		{ width, height, top, right, bottom, left },
		anchor,
		positionRounding
		) => {
		let anchorOffsetX = calculateAnchorOffsetX(anchor, targetWidth);
		let anchorOffsetY = calculateAnchorOffsetY(anchor, targetHeight);
	
		if (positionRounding) {
			anchorOffsetX = Math.floor(anchorOffsetX);
			anchorOffsetY = Math.floor(anchorOffsetY);
		}
	
		let positions = [];
		let uvs = [];
		let indices = [];
	
		let reference = Primitives.createUIQuadMeshConfig(1,1);
		let extendPositions = (offsetX, offsetY, scaleX, scaleY) => {
			for (let i = 0, l = reference.positions.length; i < l; i += 3) {
				positions.push(scaleX * reference.positions[i] + offsetX + anchorOffsetX);
				positions.push(scaleY * reference.positions[i + 1] + offsetY + anchorOffsetY);
				positions.push(reference.positions[i + 2]);
			}
		}
		let extendUvs = (offsetU, offsetV, scaleU, scaleV) => {
			for (let i = 0, l = reference.uvs.length; i < l; i += 2) {
				uvs.push(scaleU * reference.uvs[i] + offsetU);
				uvs.push(scaleV * reference.uvs[i + 1] + offsetV);
			}
		}
		let extendIndices = (offset) => {
			for (let i = 0, l = reference.indices.length; i < l; i++) {
				indices.push(reference.indices[i] + offset);
			}
		};
	
		// left - bottom
		let positionCount = 0;
		extendPositions(0, 0, left, bottom);
		extendUvs(0, 0, left / width, bottom / height);
		extendIndices(positionCount);
		positionCount += 4;
		// bottom
		extendPositions(left, 0, targetWidth - left - right, bottom);
		extendUvs(left / width, 0, (width - left - right) / width, bottom / height);
		extendIndices(positionCount);
		positionCount += 4;
		// right - bottom
		extendPositions(targetWidth - right, 0, right, bottom);
		extendUvs((width - right) / width, 0, right / width, bottom / height);
		extendIndices(positionCount);
		positionCount += 4;
		// left
		extendPositions(0, bottom, left, targetHeight - top - bottom);
		extendUvs(0, bottom / height, left/width, (height - bottom - top) / height);
		extendIndices(positionCount);
		positionCount += 4;
		// middle
		extendPositions(left, bottom, targetWidth - left - right, targetHeight - top - bottom);
		extendUvs(left / width, bottom / height, (width - left - right) / width, (height - bottom - top) / height);
		extendIndices(positionCount);
		positionCount += 4;
		// right
		extendPositions(targetWidth - right, bottom, right, targetHeight - top - bottom);
		extendUvs((width - right) / width, bottom / height, right / width, (height - bottom - top) / height);
		extendIndices(positionCount);
		positionCount += 4;
		// left - top
		extendPositions(0, targetHeight - top, left, top);
		extendUvs(0, (height - top) / height, left / width, top / height);
		extendIndices(positionCount);
		positionCount += 4;
		// top
		extendPositions(left, targetHeight - top, targetWidth - left - right, top);
		extendUvs(left / width, (height - top) / height, (width - left - right) / width, top / height);
		extendIndices(positionCount);
		positionCount += 4;
		// right - top
		extendPositions(targetWidth - right, targetHeight - top, right, top);
		extendUvs((width - right) / width, (height - top) / height, right / width, top / height);
		extendIndices(positionCount);
		positionCount += 4;
	
		return {
			positions: positions,
			uvs: uvs,
			indices: indices,
			renderMode: reference.renderMode
		};
	};

	return exports;
})();