var Maths = require('./maths');
let vec3 = Maths.vec3, vec4 = Maths.vec4, mat4 = Maths.mat4, quat = Maths.quat;

var Camera = module.exports = function() {
	// NOTE: Camera points in -z direction
	var exports = {};

	// vec3 cache for calculations
	var localX = vec3.create();
	var localY = vec3.create();
	var localZ = vec3.create();
	var vec3Cache = vec3.create();
	var vec4Cache = vec4.create();
	var q = quat.create();

	var prototype = {
		// Set Rotation from Euler
		// Set Position x, y, z
		// Note do not have enforced copy setters, the user is responsible for this
		calculateFrustrum: function() {
			Maths.quatLocalAxes(this.rotation, localX, localY, localZ);

			// Calculate Planes
			// NOTE: Relies on the fact camera looks in -ve z direction
			// Note Right Handed but facing in negative z, so -x is left, and +x is right.

			// Planes should point inwards

			// Near
			vec3.negate(this.planes[0], localZ); // Set Normal
			vec3.scaleAndAdd(vec3Cache, this.position, localZ, -this.near);	// Calculate mid-point of plane
			this.planes[0][3] = -vec3.dot(this.planes[0], vec3Cache);	// Set [3] to distance from plane to origin along normal (normal is pointing torwards origin)
			// Far
			vec3.copy(this.planes[1], localZ);
			vec3.scaleAndAdd(vec3Cache, this.position, localZ, -this.far);
			this.planes[1][3] = -vec3.dot(this.planes[1], vec3Cache);
			// Left
			quat.identity(q);
			Maths.quatRotate(q, q, 0.5 * this.ratio * this.fov, localY);	// Rotation is anti-clockwise apparently
			vec3.transformQuat(this.planes[2], localX, q);
			this.planes[2][3] = -vec3.dot(this.planes[2], this.position);
			// Right
			quat.identity(q);
			Maths.quatRotate(q, q, -0.5 * this.ratio * this.fov, localY);
			vec3.negate(vec3Cache, localX);
			vec3.transformQuat(this.planes[3], vec3Cache, q);
			this.planes[3][3] = -vec3.dot(this.planes[3], this.position);
			// Top
			quat.identity(q);
			Maths.quatRotate(q, q, 0.5 * this.fov, localX);
			vec3.negate(vec3Cache, localY);
			vec3.transformQuat(this.planes[4], vec3Cache, q);
			this.planes[4][3] = -vec3.dot(this.planes[4], this.position);
			// Bottom
			quat.identity(q);
			Maths.quatRotate(q, q, -0.5 * this.fov, localX);
			vec3.transformQuat(this.planes[5], localY, q);
			this.planes[5][3] = -vec3.dot(this.planes[5], this.position);

			// TODO: The points too please so we can improve culling
		},
		isSphereInFrustum: function(center, radius) {
			vec4Cache[3] = 1;
			for (let i = 0; i < 6; i++) {
				// We want the point center + normal of the plane * radius
				vec3.scaleAndAdd(vec4Cache, center, this.planes[i], radius);
				if (vec4.dot(this.planes[i], vec4Cache) < 0) {
					return false;
				}
			}
			return true;
		},
		isInFrustum: function(bounds) {
			// https://iquilezles.org/www/articles/frustumcorrect/frustumcorrect.htm
			// Note : https://stackoverflow.com/questions/31788925/correct-frustum-aabb-intersection
			// TODO: Profile and try different techniques (using continue in the loop, unrolling the lot, etc)
			vec4Cache[3] = 1;
			// Consider wrapping this cache in an anon function execution to keep scope minimal, see of it improves performance
			// i.e. isInFrustum = (function() { let cache = vec4.create(); return function(bounds) { /* implementation */ }; })();
			for (let i = 0; i < 6; i++) {
				let out = 0;
				vec4Cache[0] = bounds.min[0], vec4Cache[1] = bounds.max[1], vec4Cache[2] = bounds.min[2];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// min max min
				vec4Cache[1] = bounds.min[1];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// min min min
				vec4Cache[0] = bounds.max[0];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// max min min
				vec4Cache[1] = bounds.max[1];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// max max min
				vec4Cache[2] = bounds.max[2];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// max max max
				vec4Cache[1] = bounds.min[1];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// max min max
				vec4Cache[0] = bounds.min[0];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// min min max
				vec4Cache[1] = bounds.max[1];
				out += (vec4.dot(this.planes[i], vec4Cache) < 0) ? 1 : 0;	// min max max
				if (out == 8) {
					return false;
				}
			}
			// TODO: Add check of points too
			return true;
		},
		getDepth: function(object) {
			var p0 = this.position[0], p1 = this.position[1], p2 = this.position[2],
				q0 = this.rotation[0], q1 = this.rotation[1], q2 = this.rotation[2], q3 = this.rotation[3],
				l0 = object.transform.position[0], l1 = object.transform.position[1], l2 = object.transform.position[2];
			return 2*(q1*q3 + q0*q2)*(l0 - p0) + 2*(q2*q3 - q0*q1)*(l1 - p1) + (1 - 2*q1*q1 - 2*q2*q2)*(l2 - p2);
		},
		getProjectionMatrix: function(out) {
			if(this.type == Camera.Type.Perspective) {
				mat4.perspective(out, this.fov, this.ratio, this.near, this.far);
			} else {
				var left = - (this.height * this.ratio) / 2.0;
				var right = - left;
				var top = this.height / 2.0;
				var bottom = -top;
				mat4.ortho(out, left, right, bottom, top, this.near, this.far);
			}
			return out;
		},
		viewportToWorld: function(out, viewPort, z) {
			if(this.type == Camerea.Type.Orthonormal) {
				// TODO: Actually test this...
				out[0] = (this.height * this.ratio) * (viewPort[0] - 0.5) / 2.0;
				out[1] = this.height * (viewPort[1] - 0.5) / 2.0;
				out[2] = (z || 0);
				vec3.transformQuat(out, out, this.rotation);
				vec3.add(out, out, this.position);
			} else {
				throw new Error("viewportToWorld not implemented for perspective camera");
			}
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
			// vertical field of view, ratio (aspect) determines horizontal fov
			camera.fov = parameters.fov;
		} else if (camera.type == Type.Orthonormal) {
			camera.height = parameters.height;
		} else {
			throw new Error("Unrecognised Camera Type '"+camera.type+"'");
		}
		camera.ratio = parameters.ratio ? parameters.ratio : 1.0;
		camera.position = parameters.position ? parameters.position : vec3.create();
		camera.rotation = parameters.rotation ? parameters.rotation : quat.create();

		camera.planes = [];
		// Stored as plane normal, distance from plane to origin in direction of normal
		for (let i = 0; i < 6; i++) {
			camera.planes[i] = vec4.create();
		}
		camera.points = [];
		for (let i = 0; i < 8; i++) {
			camera.points[i] = vec3.create();
		}
		camera.calculateFrustrum(); // TEST - REMOVE

		// TODO: Add Clear Color

		// TODO: Arguably post-processing effects and target could/should be on the camera, the other option is on the scene

		return camera;
	};
	return exports;
}();
