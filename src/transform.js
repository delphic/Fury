const { quat, vec3, mat4 } = require('./maths');

module.exports = (function() {
	let exports = {};

	let _ = vec3.create();

	let prototype = {
		updateMatrix: function() {
			mat4.fromRotationTranslation(this.matrix, this.rotation, this.position);
			mat4.scale(this.matrix, this.matrix, this.scale);
			let parent = this.parent;
			if (parent) {
				parent.updateMatrix();
				mat4.multiply(this.matrix, parent.matrix, this.matrix);
			}
		},
		getWorldPosition: function(out) {
			if (!parent) {
				vec3.copy(out, this.position);
			} else {
				this.updateMatrix();
				mat4.getTranslation(out, this.matrix);
			}
			return out;
		},
		getWorldRotation: function(out) {
			if (!parent) {
				quat.copy(out, this.rotation);
			} else {
				this.updateMatrix();
				mat4.getRotation(out, this.matrix);
			}
			return out;
		},
		getWorldScale: function(out) {
			if (!parent) {
				vec3.copy(out, this.scale);
			} else {
				this.updateMatrix();
				mat4.getScaling(out, this.matrix);
			}
			return out;
		},
		getWorldPositionRotation: function(position, rotation) {
			if (!parent) {
				vec3.copy(position, this.position);
				quat.copy(rotation, this.rotation);
			} else {
				this.updateMatrix();
				mat4.decompose(rotation, position, _);
			}
		},
		getWorldPositionRotationScale: function(position, rotation, scale) {
			if (!parent) {
				vec3.copy(position, this.position);
				quat.copy(rotation, this.rotation);
				vec3.copy(scale, this.scale);
			} else {
				this.updateMatrix();
				mat4.decompose(rotation, position, scale);
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
