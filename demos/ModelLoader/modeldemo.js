// Render a Model
// Testing a model loader class

// globalize glMatrix
Fury.Maths.globalize();

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
        "gl_FragColor = vec4(vLightWeight * vec3(1.0, 1.0, 1.0), 1.0);", //  texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
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
var camera = Fury.Camera.create({ near: 0.01, far: 10000.0, fov: 45.0, ratio: 1.0, position: vec3.fromValues(0.05, 0.08, 0.1), rotation: quat.fromValues(-0.232, 0.24, 0.06, 0.94) });
// TODO: Set default zoom based on extents of object
var scene = Fury.Scene.create({ camera: camera });
var modelObj = null;


var loop = function(){
	var rotation = modelObj.transform.rotation;
//	quat.rotateX(rotation, rotation, 0.01);
	quat.rotateY(rotation, rotation, 0.005);
//	quat.rotateZ(rotation, rotation, 0.0025);
	// TODO: Camera controls
	scene.render();
	window.requestAnimationFrame(loop);
};

Fury.Model.load("queen.gltf", function(model) {
    // TODO: Consider using promises rather than callbacks
    var mesh = Fury.Mesh.create(model.meshData[0]);
    modelObj = scene.add({ material: material, mesh: mesh });
	window.requestAnimationFrame(loop);
});

/*var image = new Image();
image.onload = function() {
	material.textures["uSampler"] = Fury.Renderer.createTexture(image, "high");
	loop();
};
image.src = "crate.gif";*/
