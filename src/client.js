var canvas;

// Fury Global
Fury = {};
// Modules
Fury.Camera = require('./camera');
Fury.Input = require('./input');
Fury.Material = require('./material');
Fury.Mesh = require('./mesh');
Fury.Renderer = require('./renderer');
Fury.Scene = require('./scene');
Fury.Shader = require('./shader');
Fury.Transform = require('./transform');

Fury.prefabs = { keys: "Can't touch this, doo doo doo, do do, do do" };

Fury.createPrefab = function(parameters) {
	var prefabs = Fury.prefabs;
	if(!parameters || !parameters.name || prefabs[parameters.name]) {
		throw new Error("Please provide a valid and unique name parameter for your prefab");
	} else {
		prefabs[parameters.name] = parameters;
		// TODO: Once using a component system will need to transfer from parameter flat structure to gameobject structure, for now these are the same
		// Note that each component class should deal with setting up that component instance from supplied parameters itself
	}
};

// Public functions
Fury.init = function(canvasId) {
	canvas = document.getElementById(canvasId);
	try {
		Fury.Renderer.init(canvas);
	} catch (error) {
		// TODO: debug.error(error.message)
		console.log(error.message);
		return false;
	}
	return true;
};
