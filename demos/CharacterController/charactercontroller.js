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
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: Fury.Maths.toRadian(60), ratio: 1.0, position: vec3.fromValues(0.0, 1.0, 0.0), enableCulling: true });
var scene = Fury.Scene.create({ camera: camera });

// Physics
let world = { boxes: [], spheres: [] };
// As these currently aren't polymorphic separate colldiers by type
// However with sensible prototype methods -> insterectType(other, self)
// we could use a single array

let Maths = Fury.Maths;
let Physics = Fury.Physics;

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
let playerBox = Physics.Box.create({ center: camera.position, size: vec3.fromValues(0.5, 2, 0.5) });
// NOTE: specifically using camera.position directly so that it moves with camera automatically

let localX = vec3.create(), localZ = vec3.create();
let vec3Cache = vec3.create();

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

	Maths.quatRotate(camera.rotation, camera.rotation, ry, Maths.vec3Y);

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
	vec3.transformQuat(localX, Maths.vec3X, camera.rotation);
	vec3.transformQuat(localZ, Maths.vec3Z, camera.rotation);
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
		playerBox.calculateMinMax();
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
	vec3.scaleAndAdd(camera.position, camera.position, Maths.vec3Y, yVelocity * elapsed);
	if (useBox) {
		playerBox.calculateMinMax();
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
