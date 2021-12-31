const Maths = require('./maths');
const quat = Maths.quat, vec3 = Maths.vec3;

module.exports = (function() {
	let exports = {};
	exports.create = function(parameters) {
		let transform = {};
		if (!parameters.position) {
			transform.position = vec3.create();
		} else {
			transform.position = parameters.position;
		}
		if (!parameters.rotation) {
			transform.rotation = quat.create();
		} else {
			transform.rotation = parameters.rotation;
		}
		if (!parameters.scale) {
			transform.scale = vec3.fromValues(1.0, 1.0, 1.0);
		} else {
			transform.scale = parameters.scale;
		}
		return transform;
	};
	return exports;
})();
