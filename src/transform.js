const Maths = require('./maths');
const quat = Maths.quat, vec3 = Maths.vec3;

module.exports = (function() {
	let exports = {};
	exports.create = function({ position = vec3.create(), rotation = quat.create(), scale = vec3.fromValues(1.0, 1.0, 1.0) }) {
		let transform = {};
		transform.position = position;
		transform.rotation = rotation;
		transform.scale = scale;
		return transform;
	};
	return exports;
})();
