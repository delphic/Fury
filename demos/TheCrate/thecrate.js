// Render a Crate!
// Testing Fury's Scene, Shader, Mesh and Material Classes 
// Compare to Arbitary Shader demo which just uses the GL Facade (renderer)

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
	bindMaterial: function(r, material) {
		r.setUniformInteger("uSampler", 0);	// This should be managed rather than manual (although also requires update to setTexture)
		r.setTexture(material.textures["crate"]); 
	},
	bindBuffers: function(r, mesh) {
		r.enableAttribute("aVertexPosition");
		r.enableAttribute("aTextureCoord");
		r.setAttribute("aVertexPosition", mesh.vertexBuffer);
		r.setAttribute("aTextureCoord", mesh.textureBuffer);
		r.setIndexedAttribute(mesh.indexBuffer);
	},
	bindProjectionMatrix: function(r, pMatrix) {
		r.setUniformMatrix4("uPMatrix", pMatrix);
	},
	bindModelViewMatrix: function(r, mvMatrix) {
		r.setUniformMatrix4("uMVMatrix", mvMatrix);
	}
});

var material = Fury.Material.create({ shader : shader });

// Create Mesh
var cube = Fury.Mesh.create({ 
	vertices: [ 
		// Front face
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,

		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,

		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		 1.0,  1.0, -1.0,

		// Bottom face
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,

		// Right face
		 1.0, -1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,

		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0], 
	textureCoordinates: [ 
		// Front face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		
		// Back face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		
		// Top face
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		
		// Bottom face
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		
		// Right face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		
		// Left face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0 ], 
	indices: [
		0, 1, 2,      0, 2, 3,    // Front face
		4, 5, 6,      4, 6, 7,    // Back face
		8, 9, 10,     8, 10, 11,  // Top face
		12, 13, 14,   12, 14, 15, // Bottom face
		16, 17, 18,   16, 18, 19, // Right face
		20, 21, 22,   20, 22, 23  // Left face
		] });


// Create Camera & Scene 
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 1.0, position: vec3.fromValues(0.0, 0.0, -6.0) });
var scene = Fury.Scene.create({ camera: camera });

// Add Crate to Scene
var crate = scene.add({ material: material, mesh: cube });

var loop = function(){
	// TODO: Rotate Crate
	quat.rotateX(crate.rotation, crate.rotation, 0.01);
	quat.rotateY(crate.rotation, crate.rotation, 0.005);
	quat.rotateZ(crate.rotation, crate.rotation, 0.0025);
	scene.render();
	setTimeout(loop, 1); 
};

// Create Texture
var texture, image = new Image();
image.onload = function() {
	material.setTexture("crate", Fury.Renderer.createTexture(image, "high"));
	loop();
};
image.src = "crate.gif";