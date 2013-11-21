// Render a Crate!
// Testing Fury's Scene, Shader, Mesh and Material Classes 
// Compare to Arbitary Shader demo which just uses the GL Facade (renderer)

// Init Fury 
Fury.init("fury");

// Create shader // TODO: Actually add a shader source / bindings
var shader = Fury.Shader.create({
	vsSource: [].join('\n'),
	fsSource: [].join('\n'),
	attributeNames: [],
	uniformNames: [],
	bindMaterial: function(r, material) {
		r.setTexture(this.textures["crate"]); 
	},
	bindBuffers: function(r, mesh) {},
	bindProjectionMatrix: function(r, pMatrix) {},
	bindModelViewMatrix: function(r, mvMatrix) {}
});

var material = Fury.Material.create({ shader : shader });

// Create Texture
var texture, image = new Image();
image.onload = function() {
	material.setTexture({ name: "crate", texture: r.createTexture(image, "high") });
	loop();
};
image.src = "crate.jpg";

// Create Mesh
var cube = Fury.Mesh.create({ vertices: [], textureCoordinates: [] });	// TODO: Actually add vertices and texture coords!

// Create Camera & Scene 
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 1.0 });
var scene = Fury.Scene.create({ camera: camera });

// Add Crate to Scene
var crate = scene.add({ material: material, mesh: cube });

var loop = function(){
	// TODO: Rotate Crate
	scene.render();
	setTimeout(loop, 1); 
};

