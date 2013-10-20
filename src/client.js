var canvas;

// Fury Global
Fury = {};
// Modules
Fury.Renderer = require('./renderer');
Fury.Camera = require('./camera');
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
