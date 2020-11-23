// Render a Block using texture arrays!
// Using Fury's Scene, Shader, Mesh and Material Classes

// globalize glMatrix
Fury.Maths.globalize();

// Init Fury
Fury.init("fury");

// Create shader
var shader = Fury.Shader.create({
	vsSource: [
    "#version 300 es",
    "in vec3 aVertexPosition;",
    "in vec3 aVertexNormal;",
    "in vec2 aTextureCoord;",

    "uniform mat4 uMVMatrix;",
    "uniform mat4 uPMatrix;",

    "out vec3 vTextureCoord;",

    "void main(void) {",
        "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "vTextureCoord = vec3(aTextureCoord, 1.0 + aVertexNormal.y);",
    "}"].join('\n'),
	fsSource: [
    "#version 300 es",
    "precision highp float;",
    "precision highp sampler2DArray;",

    "in vec3 vTextureCoord;",

    "uniform sampler2DArray uSampler;",

		"out vec4 fragColor;",

    "void main(void) {",
        "fragColor = texture(uSampler, vTextureCoord);",
    "}"].join('\n'),
	attributeNames: [ "aVertexPosition", "aVertexNormal", "aTextureCoord" ],
	uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler" ],
	textureUniformNames: [ "uSampler" ],
	pMatrixUniformName: "uPMatrix",
	mvMatrixUniformName: "uMVMatrix",
	bindMaterial: function(material) {
		this.enableAttribute("aVertexPosition");
		this.enableAttribute("aTextureCoord");
		this.enableAttribute("aVertexNormal");
	},
	bindBuffers: function(mesh) {
		this.setAttribute("aVertexPosition", mesh.vertexBuffer);
		this.setAttribute("aTextureCoord", mesh.textureBuffer);
		this.setAttribute("aVertexNormal", mesh.normalBuffer);
		this.setIndexedAttribute(mesh.indexBuffer);
	}
});

var material = Fury.Material.create({ shader : shader });

// Create Mesh
var cubeJson = {
	vertices: [ -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0 ],
	normals: [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0],
	textureCoordinates: [ 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 ],
	indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ]
};
var cube = Fury.Mesh.create(cubeJson);

// Create Camera & Scene
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 1.0, position: vec3.fromValues(0.0, 0.0, 6.0) });
var scene = Fury.Scene.create({ camera: camera });

Fury.Renderer.clearColor(0.1, 0.1, 0.2, 1.0);

// Add Block to Scene
var block = scene.add({ material: material, mesh: cube });

var loop = function(){
	var rotation = block.transform.rotation;

	quat.rotateX(rotation, rotation, 0.01);
	quat.rotateY(rotation, rotation, 0.005);
	quat.rotateZ(rotation, rotation, 0.0025);

	scene.render();
	window.requestAnimationFrame(loop);
};

// Create Texture
var image = new Image();
image.onload = function() {
	material.textures["uSampler"] = Fury.Renderer.createTextureArray(image, 64, 64, 3, "pixel", true);
	loop();
};
image.src = "block_texture.png";
