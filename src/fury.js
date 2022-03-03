// Fury Module can be used with 'require'
module.exports = (function() {
	let Fury = {};
	let canvas;

	// Modules
	Fury.Atlas = require('./atlas')
	Fury.Bounds = require('./bounds');
	Fury.Camera = require('./camera');
	Fury.GameLoop = require('./gameLoop');
	Fury.Input = require('./input');
	Fury.Material = require('./material');
	Fury.Maths = require('./maths');
	Fury.Mesh = require('./mesh');
	Fury.Model = require('./model');
	Fury.Physics = require('./physics');
	Fury.Prefab = require('./prefab');
	Fury.Primitives = require('./primitives');
	Fury.Random = require('./random');
	Fury.Renderer = require('./renderer');
	Fury.Scene = require('./scene');
	Fury.Shader = require('./shader');
	Fury.Shaders = require('./shaders');
	Fury.TextMesh = require('./textmesh');
	Fury.TileMap = require('./tilemap');
	Fury.Transform = require('./transform');
	Fury.Utils = require('./utils');

	Fury.init = function(parameters) {
		let disableShaderPreload = false;
		let canvasId = null;
		let contextAttributes = null;

		if (typeof(parameters) == 'string') {
			disableShaderPreload = true;
			canvasId = parameters;
		} else {
			canvasId = parameters.canvasId;
			contextAttributes = parameters.glContextAttributes;
			disableShaderPreload = !!parameters.disableShaderPreload;
		}

		canvas = document.getElementById(canvasId);
		try {
			Fury.Renderer.init(canvas, contextAttributes);
		} catch (error) {
			console.log(error.message);
			return false;
		}
		Fury.Input.init(canvas);

		if (!disableShaderPreload) {
			Fury.Shaders.createShaders();
		}
		
		if (parameters.gameLoop) {
			Fury.GameLoop.init(parameters.gameLoop);
		}

		return true;
	};

	return Fury;
})();
