// Render a Model
// Testing a model loader class

// globalize glMatrix
Fury.Maths.globalize();

var useQueen = true, useTexture = false;
var modelName = useQueen ? "queen.gltf" : "cube.gltf";
var textureQuality = "low", textureSrc = "checkerboard.png"; 
var position = useQueen ? vec3.fromValues(0.05, 0.08, 0.1) : vec3.fromValues(2.5, 2.5, 5);
// TODO: Set default fov or position based on extents of object

// Init Fury
Fury.init("fury");

// Create shader
var shader = Fury.Shader.create({
	vsSource: [
	"attribute vec3 aVertexPosition;",
	"attribute vec3 aVertexNormal;",
    "attribute vec2 aTextureCoord;",

    "uniform mat4 uMVMatrix;",
    "uniform mat4 uPMatrix;",

    "varying vec2 vTextureCoord;",
    "varying float vLightWeight;",

    "void main(void) {",
        "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "vTextureCoord = aTextureCoord;",
        "vLightWeight = 0.5 + 0.5 * max(dot(aVertexNormal, normalize(vec3(-1.0, 2.0, 1.0))), 0.0);",
    "}"].join('\n'),
	fsSource: [
	"precision mediump float;",

    "varying vec2 vTextureCoord;",
    "varying float vLightWeight;",

    "uniform sampler2D uSampler;",

    "void main(void) {",
        "gl_FragColor = vec4(vLightWeight * vec3(1.0, 1.0, 1.0), 1.0)" + (useTexture ? " * texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));" : ";"),
    "}"].join('\n'),
	attributeNames: [ "aVertexPosition", "aVertexNormal", "aTextureCoord" ],
	uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler" ],
	textureUniformNames: [ "uSampler" ],
	pMatrixUniformName: "uPMatrix",
	mvMatrixUniformName: "uMVMatrix",
	bindMaterial: function(material) {
		this.enableAttribute("aVertexPosition");
		this.enableAttribute("aVertexNormal");
		this.enableAttribute("aTextureCoord");
	},
	bindBuffers: function(mesh) {
		this.setAttribute("aVertexPosition", mesh.vertexBuffer);
		this.setAttribute("aVertexNormal", mesh.normalBuffer);
		this.setAttribute("aTextureCoord", mesh.textureBuffer);
		this.setIndexedAttribute(mesh.indexBuffer);
	}
});

var material = Fury.Material.create({ shader : shader });

// Create Camera & Scene
var camera = Fury.Camera.create({ near: 0.01, far: 10000.0, fov: 45.0, ratio: 1.0, position: position, rotation: quat.fromValues(-0.232, 0.24, 0.06, 0.94) });
var scene = Fury.Scene.create({ camera: camera });
var modelObj = null;


var loop = () => {
	var rotation = modelObj.transform.rotation;
	quat.rotateY(rotation, rotation, 0.005);
	// TODO: Camera controls - although at that point this becomes a model viewer - which is totally legit
	scene.render();
	window.requestAnimationFrame(loop);
};

var image = new Image();
image.onload = () => {
	if (useTexture) {
		material.textures["uSampler"] = Fury.Renderer.createTexture(image, textureQuality);		
	}

	// This is what we're actually testing, the rest is boilerplate
	Fury.Model.load(modelName, (model) => {
	    // TODO: Consider using promises rather than callbacks
	    // TODO: Investigate embedded resources / resource references for materials 
	    var mesh = Fury.Mesh.create(model.meshData[0]);
	    modelObj = scene.add({ material: material, mesh: mesh });
		window.requestAnimationFrame(loop);
	});
};
image.src = textureSrc;


