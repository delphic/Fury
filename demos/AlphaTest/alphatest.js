// Alpha Testing Demo
// Supply White Ring Texture with transparent centre as ring.png

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
    "uniform vec4 uTint;",

    "void main(void) {",
        "gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) * uTint;",
    "}"].join('\n'),
        attributeNames: [ "aVertexPosition", "aTextureCoord" ],
        uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler", "uTint" ],
        textureUniformNames: [ "uSampler" ],
        pMatrixUniformName: "uPMatrix",
        mvMatrixUniformName: "uMVMatrix",
        bindMaterial: function(material) {
        	this.setUniformVector4("uTint", material.tint);
        },
        bindBuffers: function(mesh) {
			this.enableAttribute("aVertexPosition");
			this.enableAttribute("aTextureCoord");
			this.setAttribute("aVertexPosition", mesh.vertexBuffer);
			this.setAttribute("aTextureCoord", mesh.textureBuffer);
			this.setIndexedAttribute(mesh.indexBuffer);
        }
});

// Create Materials
var whiteMaterial = Fury.Material.create({shader: shader });
var redMaterial = Fury.Material.create({ shader : shader });
var greenMaterial = Fury.Material.create({ shader: shader });
var blueMaterial = Fury.Material.create({ shader: shader });
whiteMaterial.tint = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
redMaterial.tint = vec4.fromValues(1.0, 0.0, 0.0, 0.75);
redMaterial.alpha = true;
greenMaterial.tint = vec4.fromValues(0.0, 1.0, 0.0, 0.75);
greenMaterial.alpha = true;
blueMaterial.tint = vec4.fromValues(0.0, 0.0, 1.0, 0.75);
blueMaterial.alpha = true;

// Create Mesh
var quad = Fury.Mesh.create({ 
	vertices: [
		 0.5,  0.5, 0.0,
		-0.5,  0.5, 0.0,
		 0.5, -0.5, 0.0,
		-0.5, -0.5, 0.0
	], 
	textureCoordinates: [
		1.0, 1.0,
		0.0, 1.0,
		1.0, 0.0,
		0.0, 0.0
	],
	renderMode: Fury.Renderer.RenderMode.TriangleStrip
});
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
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 1.0, position: vec3.fromValues(0.0, 0.0, -3.0) });
var scene = Fury.Scene.create({ camera: camera });

// Add Quads to Scene
var separation = 0.3, sin60 = Math.sin(Math.PI/6.0), sin30 = Math.sin(Math.PI/12.0);
var redRing = scene.add({ material: redMaterial, mesh: quad, position: vec3.fromValues(0, separation, 0) });
var greenRing = scene.add({ material: greenMaterial, mesh: quad, position: vec3.fromValues(separation*sin60, -separation*sin30, 0) });
var blueRing = scene.add({ material: blueMaterial, mesh: quad, position: vec3.fromValues(-separation*sin60, -separation*sin30, 0) });
var k = 0.5, time = 0, lastTime = Date.now();

// Add Non-alpha crate
var crate = scene.add({ material: whiteMaterial, mesh: cube, scale: vec3.fromValues(0.15, 0.15, 0.15) });

var loop = function(){
        time += (Date.now() - lastTime)/1000;
        lastTime = Date.now();
		redRing.transform.position[2] = -0.5 + Math.sin(k*time);
		greenRing.transform.position[2] = -0.5 + Math.sin((Math.PI/4.0) + k*time);
		blueRing.transform.position[2] = -0.5 + Math.sin((Math.PI/2.0) + k*time);
        var rotation = crate.transform.rotation;
        quat.rotateX(rotation, rotation, 0.01);
        quat.rotateY(rotation, rotation, 0.005);
        quat.rotateZ(rotation, rotation, 0.0025);
        scene.render();
        setTimeout(loop, 1); 
};

// Create Texture
var image1Loaded = false, image2Loaded = false;
var texture, image1 = new Image(), image2 = new Image();
image1.onload = function() {
	var texture = Fury.Renderer.createTexture(image1, "high", true);
	redMaterial.textures["uSampler"] = texture;
	greenMaterial.textures["uSampler"] = texture;
	blueMaterial.textures["uSampler"] = texture;
    image1Loaded = true;
    if(image1Loaded && image2Loaded) {
	   loop();
    }
};
image2.onload = function() {
    var texture = Fury.Renderer.createTexture(image2, "high");
    whiteMaterial.textures["uSampler"] = texture;
    image2Loaded = true;
    if(image1Loaded && image2Loaded) {
        loop();
    }
}
image1.src = "ring.png";
image2.src = "crate.gif"