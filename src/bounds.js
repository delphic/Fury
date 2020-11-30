var Bounds = module.exports = (function() {
	let exports = {};
	let prototype = {
		calculateMinMax: function() {
			vec3.subtract(this.min, this.center, this.extents);
			vec3.add(this.max, this.center, this.extents);
		},
		calculateExtents: function() {
			vec3.subtract(this.size, this.max, this.min);
			// If we had a vec3.zero vector could use scale and add
			this.extents[0] = 0.5 * this.size[0];
			this.extents[1] = 0.5 * this.size[1];
			this.extents[2] = 0.5 * this.size[2];
			vec3.add(this.center, this.min, this.extents);
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

				aabb.calculateMinMax();
			} else {
				// Could check min < max on all axes to make this easier to use
				aabb.min = parameters.min;
				aabb.max = parameters.max;
				aabb.center = vec3.create();
				aabb.size = vec3.create();
				aabb.extents = vec3.create();
				aabb.calculateExtents();
			}

			return aabb;
	};

	return exports;
})();
