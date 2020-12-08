var Physics = module.exports = (function(){
  // https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection

  var exports = {};

  // For now a box is an AABB - in future we'll need to allow rotation
  var Box = exports.Box = require('./bounds');

  var Sphere = exports.Sphere = (function() {
  	let exports = {};
  	let prototype = {};

  	exports.contains = function(point, sphere) {
  		let dx = point[0] - sphere.center[0], dy = point[1] - sphere.center[1], dz = point[2] - sphere.center[2];
  		let sqrDistance = dx * dx + dy * dy + dz * dz;
  		return sqrDistance < sphere.radius * sphere.radius;
  	};

  	exports.intersect = function(a, b) {
  		let dx = a.center[0] - b.center[0], dy = a.center[1] - b.center[1], dz = a.center[2] - b.center[2];
  		let sqrDistance = dx * dx + dy * dy + dz * dz;
  		return sqrDistance < (a.radius + b.radius) * (a.radius + b.radius);
  	};

  	exports.intersectBox = function(box, sphere) {
  		return Box.intersectSphere(sphere, box);
  	};

  	exports.create = function(parameters) {
  		let sphere = Object.create(prototype);

  		if (parameters.center) {
  			sphere.center = parameters.center;
  		} else {
  			sphere.center = vec3.create();
  		}
      if (parameters.radius) {
        sphere.radius = parameters.radius;
      } else {
        sphere.radius = 0;
      }

  		return sphere;
  	};

  	return exports;
  })();

  return exports;
})();
