// Basic First Person Character Controller
// Test bed for AABB physics testing

// globalize glMatrix
Fury.Maths.globalize();

// Extend Maths
// See https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
Fury.Maths.calculateRoll = function(q) {
	// x-axis rotation
	let w = q[3], x = q[0], y = q[1], z = q[2];
	return Math.atan2(2 * (w*x + y*z), 1 - 2 * (x*x + y*y));
};

Fury.Maths.calculatePitch = function(q) {
	// y-axis rotation
	let w = q[3], x = q[0], y = q[1], z = q[2];
	let sinp = 2 * (w*y - z*x);
	return Math.asin(sinp);
	// returns pi/2 -> - pi/2 range only
	// which is not helpful at all.
};

Fury.Maths.calculateYaw = function(q) {
	// z-axis rotation
	let w = q[3], x = q[0], y = q[1], z = q[2];
	return Math.atan2(2 * (w*z + x*y), 1 - 2 * (y*y + z*z));
};

Fury.Maths.getRoll = function(q) {
		// Used to avoid gimbal lock
    let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
    let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    return Math.atan(sinr_cosp / cosr_cosp);
    // If you want to know sector you need atan2(sinr_cosp, cosr_cosp)
    // but we don't in this case.
};

// TODO: Move to Fury.Maths or extend glMatrix
var quatRotate = (function() {
	var i = quat.create();
	return function(out, q, rad, axis) {
		quat.setAxisAngle(i, axis, rad);
		return quat.multiply(out, i, q);
	};
})();

// Init Fury
Fury.init("fury");

// Create shader
var shader = Fury.Shader.create({
	vsSource: [
		"attribute vec3 aVertexPosition;",
    "attribute vec2 aTextureCoord;",

    "uniform mat4 uMVMatrix;",
    "uniform mat4 uPMatrix;",

    "varying vec2 vTextureCoord;",
    "void main(void) {",
        "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "vTextureCoord = aTextureCoord;",
    "}"].join('\n'),
	fsSource: [
	"precision mediump float;",

    "varying vec2 vTextureCoord;",

    "uniform sampler2D uSampler;",

    "void main(void) {",
        "gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
    "}"].join('\n'),
	attributeNames: [ "aVertexPosition", "aTextureCoord" ],
	uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler" ],
	textureUniformNames: [ "uSampler" ],
	pMatrixUniformName: "uPMatrix",
	mvMatrixUniformName: "uMVMatrix",
	bindMaterial: function(material) {
		this.enableAttribute("aVertexPosition");
		this.enableAttribute("aTextureCoord");
	},
	bindBuffers: function(mesh) {
		this.setAttribute("aVertexPosition", mesh.vertexBuffer);
		this.setAttribute("aTextureCoord", mesh.textureBuffer);
		this.setIndexedAttribute(mesh.indexBuffer);
	}
});

var material = Fury.Material.create({ shader : shader });

// Creates a cuboid origin in centre of specifed width / height / depth
// Texture coordinates scaled by size
var createCuboidMesh = function(width, height, depth) {
	let sx = width / 2, sy = height / 2, sz = depth / 2;
	return {
		vertices: [
			// Front face
			-sx, -sy,  sz,
			 sx, -sy,  sz,
			 sx,  sy,  sz,
			-sx,  sy,  sz,

			// Back face
			-sx, -sy, -sz,
			-sx,  sy, -sz,
			 sx,  sy, -sz,
			 sx, -sy, -sz,

			// Top face
			-sx,  sy, -sz,
			-sx,  sy,  sz,
			 sx,  sy,  sz,
			 sx,  sy, -sz,

			// Bottom face
			-sx, -sy, -sz,
			 sx, -sy, -sz,
			 sx, -sy,  sz,
			-sx, -sy,  sz,

			// Right face
			 sx, -sy, -sz,
			 sx,  sy, -sz,
			 sx,  sy,  sz,
			 sx, -sy,  sz,

			// Left face
			-sx, -sy, -sz,
			-sx, -sy,  sz,
			-sx,  sy,  sz,
			-sx,  sy, -sz],
		textureCoordinates: [
			// Front face
			0.0, 0.0,
			width, 0.0,
			width, height,
			0.0, height,

			// Back face
			width, 0.0,
			width, height,
			0.0, height,
			0.0, 0.0,

			// Top face
			0.0, depth,
			0.0, 0.0,
			width, 0.0,
			width, depth,

			// Bottom face
			width, depth,
			0.0, depth,
			0.0, 0.0,
			width, 0.0,

			// Right face
			depth, 0.0,
			depth, height,
			0.0, height,
			0.0, 0.0,

			// Left face
			0.0, 0.0,
			depth, 0.0,
			depth, height,
			0.0, height ],
		indices: [
			0, 1, 2,      0, 2, 3,    // Front face
			4, 5, 6,      4, 6, 7,    // Back face
			8, 9, 10,     8, 10, 11,  // Top face
			12, 13, 14,   12, 14, 15, // Bottom face
			16, 17, 18,   16, 18, 19, // Right face
			20, 21, 22,   20, 22, 23  // Left face
		] };
};

// Create Camera & Scene
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 1.0, position: vec3.fromValues(0.0, 1.0, 4.0) });
// TODO: Set fov based on screen size / ratio? c.f. voxel terrain
var scene = Fury.Scene.create({ camera: camera });

// Physics
let world = { boxes: [], spheres: [] };
// As these currently aren't polymorphic separate colldiers by type
// However with sensible prototype methods -> insterectType(other, self)
// we could use a single array

let Physics = {};

// Q: Do we want intersects to return true if touching
// I don't think we necessarily do? So we should probably
// change box comparisons to remove there "orEqualTo" aspect

// https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection
Physics.Box = (function() {
	// Technically this is identical to bounds which is something we want to use
	// in our renderer, so we've got a name issue here hehe.
	let exports = {};
	let prototype = {
		cacluateMinMax: function() {
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

	exports.intersect = function(a, b) {
		return (a.min[0] <= b.max[0] && a.max[0] >= b.min[0])
			&& (a.min[1] <= b.max[1] && a.max[1] >= b.min[1])
			&& (a.min[2] <= b.max[2] && a.max[2] >= b.min[2]);
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

				aabb.cacluateMinMax();
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

Physics.Sphere = (function() {
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
		return Physics.Box.intersectSphere(sphere, box);
	};

	exports.create = function(parameters) {
		let sphere = Object.create(prototype);

		if (parameters.center) {
			sphere.center = parameters.center;
		} else {
			sphere.center = vec3.create();
		}
		sphere.radius = parameters.radius | 0;

		return sphere;
	};

	return exports;
})();
// TODO: might quite like a cylinder and or capsule

// Build me a Room - 10x10, height 4
let walls = [], floor, roof;

var createCuboid = function(w, h, d, x, y, z) {
	let position = vec3.fromValues(x, y, z);
	let size = vec3.fromValues(w, h, d);
	let mesh = Fury.Mesh.create(createCuboidMesh(w, h, d));
	let box = Physics.Box.create({ center: position, size: size });
	// Note if you move the cuboid you have to recalculate min max

	// Add to scene and physics world
	world.boxes.push(box);
	return scene.add({ material: material, mesh: mesh, position: position });
};

// Walls
walls.push(createCuboid(10, 4, 1, 0, 2, 5.5));
walls.push(createCuboid(10, 4, 1, 0, 2, -5.5));
walls.push(createCuboid(1, 4, 10, 5.5, 2, 0));
walls.push(createCuboid(1, 4, 10, -5.5, 2, 0));

floor = createCuboid(10, 1, 10, 0, -0.5, 0);
roof = createCuboid(10, 1, 10, 0, 4.5, 0);

let playerSphere = Physics.Sphere.create({ center: camera.position, radius: 1.0 });
let playerBox = Physics.Box.create({ center: camera.position, size: vec3.fromValues(0.5, 1.95, 0.5) });
// NOTE: specifically using camera.position directly so that it moves with camera automatically

let localX = vec3.create(), localZ = vec3.create();
let unitX = vec3.fromValues(1,0,0), unitY = vec3.fromValues(0,1,0), unitZ = vec3.fromValues(0,0,1);
let vec3Cache = vec3.create();
// TODO: Add Unit Vectors to Fury.Maths or glMatrix fork

let movementSpeed = 1.5;
let lookSpeed = 1;

let yVelocity = 0, jumping = false, jumpDeltaV = 3;
// TODO: Store x/z velocity when jump and then can alter it with in air movement
// but the maximum is less

// Mouse look / pointer lock
let mouseLookSpeed = 0.1;
let pointerLocked = false;
let mdx = 0, mdy = 0; // Store accumulating deltas
let handleMouseMove = function(event) {
	mdx += event.movementX;
	mdy += event.movementY;
};
let canvas = document.getElementById("fury");
canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
// ^^ TODO: Query Fury for canvs or move pointer lock requets to Fury.Input
// Requires use of fury game loop though to make input work, need to consume events end of frame
canvas.addEventListener("mousemove", handleMouseMove);
document.addEventListener('pointerlockchange', (event) => {
	pointerLocked = !!(document.pointerLockElement || document.mozPointerLockElement);
});

let lastTime = 0;

var loop = function(){
	var elapsed = Date.now() - lastTime;
	lastTime += elapsed;
	elapsed /= 1000;

	let ry = 0, rx = 0;

	if (!pointerLocked) {
		if (Fury.Input.mouseDown(0)) {
			canvas.requestPointerLock();
		}
	} else {
		// Add the movement to rotations and clear the cache of movement delta
		ry -= mouseLookSpeed * elapsed * mdx;
		rx -= mouseLookSpeed * elapsed * mdy;
		mdx = 0;
		mdy = 0;
	}

	if (Fury.Input.keyDown("Left")) {
		ry += lookSpeed * elapsed;
	}
	if (Fury.Input.keyDown("Right")) {
		ry -= lookSpeed * elapsed;
	}
	if (Fury.Input.keyDown("Up")) {
		rx += lookSpeed * elapsed;
	}
	if (Fury.Input.keyDown("Down")) {
		rx -= lookSpeed * elapsed;
	}

	quatRotate(camera.rotation, camera.rotation, ry, unitY);

	let roll = Fury.Maths.getRoll(camera.rotation); // Note doesn't lock in the right place if you're using atan2 version
	let clampAngle = 10 * Math.PI/180;
	if (Math.sign(roll) == Math.sign(-rx) || Math.abs(roll - rx) < 0.5*Math.PI - clampAngle) {
		quat.rotateX(camera.rotation, camera.rotation, rx);
	}

	let dx = 0, dz = 0;
	// TODO: Invert camera look direction for the love of my sanity
	if (Fury.Input.keyDown("w")) {
		dz -= 1;
	}
	if (Fury.Input.keyDown("s")) {
		dz += 1;
	}
	if (Fury.Input.keyDown("a")) {
		dx -= 1;
	}
	if (Fury.Input.keyDown("d")) {
		dx += 1;
	}

	// Calculate local axes for camera - ignoring roll
	// This would be easier with a character transform
	// Wouldn't need to zero the y component
	vec3.transformQuat(localX, unitX, camera.rotation);
	vec3.transformQuat(localZ, unitZ, camera.rotation);
	localX[1] = 0;
	vec3.normalize(localX, localX);
	localZ[1] = 0;
	vec3.normalize(localZ, localZ);

	vec3.copy(vec3Cache, camera.position);
	vec3.scaleAndAdd(camera.position, camera.position, localZ, movementSpeed * elapsed * dz);
	vec3.scaleAndAdd(camera.position, camera.position, localX, movementSpeed * elapsed * dx);

	let collision = false, useBox = true;

	// This is basically character controller move
	if (useBox) {
		playerBox.cacluateMinMax();
	}

	for (let i = 0, l = world.boxes.length; i < l; i++) {
		if (useBox) {
			if (Physics.Box.intersect(playerBox, world.boxes[i])) {
				collision = true;
				break;
			}
		} else if (Physics.Box.intersectSphere(playerSphere, world.boxes[i])) {
			collision = true;
			break;
		}
	}
	if (collision) {
		// TODO: Would like to be able to slide along an object please
		// TODO: Would be nice to move up to the object instead
		// To do this figure out which axes you moved in on - and move out to touch point
		// in order of which would would have entered first - ratio of move to overlap
		// Penetration vector.
		// need list of overlapping colliders though
		vec3.copy(camera.position, vec3Cache);

		// Also need to support steps and slopes
	}

	// Now lets do it again for gravity / jumping
	collision = false;
	if (!jumping && Fury.Input.keyDown("Space")) {
		jumping = true;
		yVelocity = jumpDeltaV;
	} else if (jumping) {
		yVelocity -= 9.8 * elapsed;
	}

	// Another Character Controller Move
	vec3.copy(vec3Cache, camera.position);
	vec3.scaleAndAdd(camera.position, camera.position, unitY, yVelocity * elapsed);
	if (useBox) {
		playerBox.cacluateMinMax();
	}

	for (let i = 0, l = world.boxes.length; i < l; i++) {
		if (useBox) {
			if (Physics.Box.intersect(playerBox, world.boxes[i])) {
				collision = true;
				break;
			}
		} else if (Physics.Box.intersectSphere(playerSphere, world.boxes[i])) {
			collision = true;
			break;
		}
	}
	if (collision) {
		// TODO: Would like to be able to slide along an object please
		// TODO: Would be nice to move up to the object instead
		// To do this figure out which axes you moved in on - and move out to touch point
		// in order of which would would have entered first - ratio of move to overlap
		// Penetration vector.
		// need list of overlapping colliders though
		vec3.copy(camera.position, vec3Cache);
		if (yVelocity < 0) {
			jumping = false;
			// ^^ TODO: Need to convert this into isGrounded check, and will need to
			// change dx / dz to be against slopes if/when we introduce them
		}
		yVelocity = 0;
	}

	scene.render();

	window.requestAnimationFrame(loop);
};

// Create Texture
var image = new Image();
image.onload = function() {
	material.textures["uSampler"] = Fury.Renderer.createTexture(image, "high");
	loop();
};
image.src = "checkerboard.png";
