const { quat, vec3, mat4 } = require('./maths');

module.exports = (function() {
	let exports = {};

	let prototype = {
		updateMatrix: function() {
			mat4.fromRotationTranslation(this.matrix, this.rotation, this.position);
				mat4.scale(this.matrix, this.matrix, this.scale);
				let parent = this.parent;
				if (parent) {
					parent.updateMatrix();
					mat4.multiply(this.matrix, parent.matrix, this.matrix);
				}
		}
	};

	exports.create = function({ position = vec3.create(), rotation = quat.create(), scale = vec3.fromValues(1.0, 1.0, 1.0) }) {
		let transform = Object.create(prototype);
		transform.position = position;
		transform.rotation = rotation;
		transform.scale = scale;
		transform.matrix = mat4.create();
		return transform;
	};
	return exports;
})();
