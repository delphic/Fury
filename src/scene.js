var r = require('./renderer');

var Scene = module.exports = function() {
	var exports = {};
	var prototype = {
		// Add Object (material & mesh provided, spawns mesh instance, returns object with transform)

		// Add Camera

		// Render
	};

	// private mesh list
	// private mesh instances
	// private material list

	// Going to use dictionaries but with an array of keys for enumeration (hence private with accessor methods)

	var create = exports.create = function(parameters) {
		var scene = Object.create(prototype);


		return scene;
	};

	return exports;
}();