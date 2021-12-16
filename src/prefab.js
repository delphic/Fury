module.exports = (function(){
	let exports = {};

	let prefabs = exports.prefabs = { keys: "Can't touch this, doo doo doo, do do, do do" };

	exports.create = (parameters) => {
		if(!parameters || !parameters.name || prefabs[parameters.name]) {
			throw new Error("Please provide a valid and unique name parameter for your prefab");
		} else {
			prefabs[parameters.name] = parameters;
		}
	};

	return exports;
})();