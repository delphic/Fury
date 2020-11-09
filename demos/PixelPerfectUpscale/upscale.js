// Helpers
var requestJson = function(path, callback) {
	var request = new XMLHttpRequest();
	request.open("GET", path, true);
	request.onload = function() { callback(request.responseText); }
	request.send();
};

var createQuad = function(size) {
	return Fury.Mesh.create({ 
		vertices: [ size * 0.5, size * 0.5, 0.0, size * -0.5,  size * 0.5, 0.0, size * 0.5, size * -0.5, 0.0, size * -0.5, size * -0.5, 0.0 ], 
		textureCoordinates: [ 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0 ],
		renderMode: Fury.Renderer.RenderMode.TriangleStrip
	});
};

// Init Fury 
Fury.init("fury", { antialias: false });

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

    "uniform vec2 uOffset;",
    "uniform vec2 uScale;",

    "uniform sampler2D uSampler;",

    "void main(void) {",
        "gl_FragColor = texture2D(uSampler, vec2(uOffset.x + (uScale.x * vTextureCoord.s), uOffset.y + (uScale.y * vTextureCoord.t)));",
    "}"].join('\n'),

	attributeNames: [ "aVertexPosition", "aTextureCoord" ],
	uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler", "uOffset", "uScale" ],
	textureUniformNames: [ "uSampler" ],
	pMatrixUniformName: "uPMatrix",
	mvMatrixUniformName: "uMVMatrix",
	bindMaterial: function(material) {
		this.setUniformVector2("uOffset", material.offset);
		this.setUniformVector2("uScale", material.scale);
	},
	bindBuffers: function(mesh) {
		this.enableAttribute("aVertexPosition");
		this.enableAttribute("aTextureCoord");
		this.setAttribute("aVertexPosition", mesh.vertexBuffer);
		this.setAttribute("aTextureCoord", mesh.textureBuffer);
		this.setIndexedAttribute(mesh.indexBuffer);
	}
});

var material = Fury.Material.create({ shader : shader });
material.alpha = true;
material.scale = vec2.fromValues(1, 1);
material.offset = vec2.fromValues(0, 0);

var camera = Fury.Camera.create({ 
	type: Fury.Camera.Type.Orthonormal,
	near: 0.1,
	far: 1000000.0, 
	height: 256.0, 		// TODO: Should explicitly be canvas height
	ratio: 1, 			// TODO: Should explicitly be canvas width/height
	position: vec3.fromValues(0.0, 0.0, 1.0) 
});

var scene = Fury.Scene.create({ camera: camera });

var sprite = scene.add({ material: material, mesh: createQuad(64) });	// Size should match the pixel size of the sprite
var spriteData;

var time = 0, lastTime = 0;

var loop = function() {
	var elapsed = (Date.now()/1000 - lastTime);
	lastTime = Date.now()/1000;
	time += elapsed;

	// TODO: Alternate between rotation and translation - a JS coroutine could work here
	var rotation = sprite.transform.rotation;
	var position = sprite.transform.position;
	//quat.rotateZ(rotation, rotation, 0.0025);
	position[0] = 32 * Math.sin(time);
	position[1] = 32 * Math.cos(time/2);

	scene.render();

	window.requestAnimationFrame(loop);
};

var init = function() {
	// Create Texture
	var image = new Image();
	image.onload = function() {
		material.textures["uSampler"] = Fury.Renderer.createTexture(image, "low", true);
		var rotation = sprite.transform.rotation;
		//quat.rotateZ(rotation, rotation, Math.PI/4);
		loop();
	};
	image.src = "lena.png";
};

init();