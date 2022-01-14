module.exports = (function(){
	let exports = {};

	let prefabs = exports.prefabs = { keys: "Can't touch this, doo doo doo, do do, do do" };

	exports.create = function(config) {
		if (!config || !config.name || prefabs[config.name]) {
			throw new Error("Please provide a valid and unique name parameter for your prefab");
		} else {
			prefabs[config.name] = config;
		}
	};

	return exports;
})();