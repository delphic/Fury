// glMatrix assumed Global
var Camera = module.exports = function() {
	var exports = {};
	var prototype = {
		// Set Rotation from Euler
		// Set Position x, y, z
		// Note do not have enforced copy setters, the user is responsible for this
		getProjectionMatrix: function(out, ratio) {
			if(this.type == Camera.Type.Perspective) {
				mat4.perspective(out, this.fov, ratio, this.near, this.far);
			} else {
				var left = - (this.height * ratio) / 2;
				var right = - left;
				var top = - this.height / 2;
				var bottom = -top;
				mat4.ortho(out, left, right, bottom, top, this.near, this.far);
			}
			return out;
		}
	};
	var Type = exports.Type = {
		Perspective: "Perspective",
		Orthonormal: "Orthonormal"
	};
	var create = exports.create = function(parameters) {
		var camera = Object.create(prototype);
		// TODO: Arguement Checking
		camera.type = parameters.type ? parameters.type : Type.Perspective;
		camera.near = parameters.near;
		camera.far = parameters.far;
		if(camera.type == Type.Perspective) {
			camera.fov = parameters.fov;
		} else if (camera.type == Type.Orthonormal) {
			camera.height = parameters.height;

		} else {
			throw new Error("Unrecognised Camera Type '"+camera.type+"'");
		}
		camera.position = parameters.position ? parameters.position : vec3.create();
		camera.rotation = parameters.rotation ? parameters.rotation : quat.create();
		return camera;
	};
	return exports;
}();