var vec3 = require('./maths').vec3;

var Bounds = module.exports = (function() {
	let exports = {};
	let prototype = {
		calculateMinMax: function(center, extents) {
			vec3.subtract(this.min, center, extents);
			vec3.add(this.max, center, extents);
		},
		calculateExtents: function(min, max) {
			vec3.subtract(this.size, max, min);
			// If we had a vec3.zero vector could use scale and add
			this.extents[0] = 0.5 * this.size[0];
			this.extents[1] = 0.5 * this.size[1];
			this.extents[2] = 0.5 * this.size[2];
			vec3.add(this.center, min, this.extents);
		}
	};

	exports.contains = function(point, box) {
		return point[0] >= box.min[0] && point[0] <= box.max[0]
			&& point[1] >= box.min[1] && point[1] <= box.max[1]
			&& point[2] >= box.min[2] && point[2] <= box.max[2];
	};

	// TODO: Adds Touches methods which use <= and >=
	// Note - ray casts should probably return true for touches

	exports.intersect = function(a, b) {
		return (a.min[0] < b.max[0] && a.max[0] > b.min[0])
			&& (a.min[1] < b.max[1] && a.max[1] > b.min[1])
			&& (a.min[2] < b.max[2] && a.max[2] > b.min[2]);
	};

	// Enters functions return true if box b did not intersect box a on specified axis
	// before displacement but would afterwards. Calculating the point of entry could be useful.
	// If it's always needed we could return the distance and use > 0 check for does enter
	exports.entersX = function(a, b, displacement) {
		return !(a.min[0] < b.max[0] && a.max[0] > b.min[0])
			&& (a.min[0] < b.max[0] + displacement && a.max[0] > b.min[0] + displacement);
	};
	exports.entersY = function(a, b, displacement) {
		return !(a.min[1] < b.max[1] && a.max[1] > b.min[1])
			&& (a.min[1] < b.max[1] + displacement && a.max[1] > b.min[1] + displacement);
	};
	exports.entersZ = function(a, b, displacement) {
		return !(a.min[2] < b.max[2] && a.max[2] > b.min[2])
			&& (a.min[2] < b.max[2] + displacement && a.max[2] > b.min[2] + displacement);
	};

	// Entered is the same as enters but it assumes you've already moved the box
	exports.enteredX = function(a, b, displacement) {
		return !(a.min[0] < b.max[0] - displacement && a.max[0] > b.min[0] - displacement)
			&& (a.min[0] < b.max[0] && a.max[0] > b.min[0]);
	}
	exports.enteredY = function(a, b, displacement) {
		return !(a.min[1] < b.max[1] - displacement && a.max[1] > b.min[1] - displacement)
			&& (a.min[1] < b.max[1] && a.max[0] > b.min[1]);
	}
	exports.enteredZ = function(a, b, displacement) {
		return !(a.min[2] < b.max[2] - displacement && a.max[2] > b.min[2] - displacement)
			&& (a.min[2] < b.max[2] && a.max[2] > b.min[2]);
	}

	exports.rayCast = function(out, origin, direction, box) {
		// Using 0 to imply no intersection so we can return distance (if normalized)
		// Wouldn't work if we included origin touching as impact

		// Check we aren't in the box - note also includes touching
		if (exports.contains(origin, box)) {
			return 0;
		}

		// AABB: is box center in at least one direction from origin?
		for (let i = 0; i < 3; i++) {
			if (Math.sign(box.center[i] - origin[i]) == Math.sign(direction[i])
				&& !(origin[i] >= box.min[i] && origin[i] <= box.max[i])) { // and NOT INSIDE the box on this axis
				axis = i;

				// Move along that axis to find the intersection point on this axis
				let ip = box.center[axis] - Math.sign(direction[axis]) * box.extents[axis];
				let s = ip - origin[axis];	// distance to intersection
				let k = s / direction[axis];	// how many dir vectors to get to ip
				// ^^ may need to do abs on these but I think they cancel

				// calculate the intersection point
				vec3.scaleAndAdd(out, origin, direction, k);

				let isHit = (axis == 0 || (out[0] >= box.min[0] && out[0] <= box.max[0]))
					&& (axis == 1 || (out[1] >= box.min[1] && out[1] <= box.max[1]))
					&& (axis == 2 || (out[2] >= box.min[2] && out[2] <= box.max[2]));

				if (isHit) {
					return k;
				}
				// If it doesn't collide on this face, maybe it collides on another, keep going!
			}
		}
		return 0;
	}

	exports.intersectSphere = function(sphere, box) {
		// closest point on box to sphere center
		let x = Math.max(box.min[0], Math.min(sphere.center[0], box.max[0]));
		let y = Math.max(box.min[1], Math.min(sphere.center[1], box.max[1]));
		let z = Math.max(box.min[2], Math.min(sphere.center[2], box.max[2]));

		let sqrDistance = (x - sphere.center[0]) * (x - sphere.center[0]) +
		 	(y - sphere.center[1]) * (y - sphere.center[1]) +
			(z - sphere.center[2]) * (z - sphere.center[2]);

		return sqrDistance < sphere.radius * sphere.radius;
	};

	exports.create = function(parameters) {
			// Note - you are expected to recalculate min/max when position or extents change
			// or alternatively if you change min/max you can recalculate extents/size/center
			let aabb = Object.create(prototype);

			if (parameters.center || parameters.size || parameters.extents) {
				if (parameters.center) {
					aabb.center = parameters.center;
				} else {
					aabb.center = vec3.create();
				}

				if (parameters.size) {
					aabb.size = parameters.size;
					aabb.extents = vec3.fromValues(0.5 * aabb.size[0], 0.5 * aabb.size[1], 0.5 * aabb.size[2])
				} else if (parameters.extents) {
					aabb.extents = parameters.extents;
					aabb.size = vec3.fromValues(2 * aabb.extents[0], 2 * aabb.extents[1], 2 * aabb.extents[2]);
				}
				aabb.min = vec3.create();
				aabb.max = vec3.create();

				aabb.calculateMinMax(aabb.center, aabb.extents);
			} else {
				// Could check min < max on all axes to make this easier to use
				aabb.min = parameters.min;
				aabb.max = parameters.max;
				aabb.center = vec3.create();
				aabb.size = vec3.create();
				aabb.extents = vec3.create();
				aabb.calculateExtents(aabb.min, aabb.max);
			}

			return aabb;
	};

	return exports;
})();
