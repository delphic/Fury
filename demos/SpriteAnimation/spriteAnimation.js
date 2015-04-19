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

var scale = 1;
var canvas, ctx, clearColour = "#111111";
var spritesPerRow, spritesPerColumn, spriteWidth, spriteHeight;
var renderSpriteToCanvas = function(spriteData, paletteData) {
	
	var minSpritesPerRow = Math.ceil(Math.sqrt(spriteData.frames.length));
	spriteWidth = nextPowerOfTwo(scale * spriteData.groupWidth * minSpritesPerRow);
	spritesPerRow = Math.floor(spriteWidth / (spriteData.groupWidth * scale));
	spritesPerColumn = Math.ceil(spriteData.frames.length / spritesPerRow);
	spriteHeight = nextPowerOfTwo(scale * spriteData.groupHeight * spritesPerColumn);
	spritesPerColumn = Math.floor(spriteHeight / (spriteData.groupHeight * scale));

	canvas.width = spriteWidth;
	canvas.height = spriteHeight;

	var offsetX = 0, offsetY = 0, spritesInRow = 0;
	for(var i = 0, n = spriteData.frames.length; i < n; i++) {
		var frame = spriteData.frames[i];
		var data = frame.frameData;
		for(var y = 0, l = data.length; y < l; y++) {
			for(var x = 0, m = data[y].length; x < m; x++) {
				var paletteIndex = data[y][x];
				if(paletteIndex) { // 0 is transparent
					drawPixel(paletteData.colours[paletteIndex], x + frame.offsetX + offsetX, y + frame.offsetY + offsetY);
				}
			}
		}
		spritesInRow++;
		if(spritesInRow == spritesPerRow) {
			spritesInRow = 0;
			offsetX = 0;
			offsetY += spriteData.groupHeight;
		} else {
			offsetX += spriteData.groupWidth;
		}
	}

	material.scale[0] = 1/spritesPerRow;
	material.scale[1] = 1/spritesPerColumn;
};

var drawPixel = function(colour, x, y) {
	ctx.fillStyle = "rgb(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ")";
	ctx.fillRect(scale*x, scale*y, scale, scale);
};

var nextPowerOfTwo = function(x) {
	var powerOfTwo = 1;
	while(powerOfTwo < x) {
		powerOfTwo *= 2;
	}
	return powerOfTwo;
};

var setMaterialOffset = function(frameIndex) {
	material.offset[0] = material.scale[0] * (frameIndex % spritesPerRow);
	material.offset[1] = material.scale[1] * (spritesPerColumn - 1 - Math.floor(frameIndex / spritesPerRow));
	material.dirty = true;
}

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
	height: 1.0, 
	ratio: 1, 
	position: vec3.fromValues(0.0, 0.0, 1.0) 
});

var scene = Fury.Scene.create({ camera: camera });

var sprite = scene.add({ material: material, mesh: createQuad(1) });
var spriteData, palleteData;

var time = 0, lastTime = 0;

var lastSwitchTime = 0, spriteIndex = 0, intialSpriteIndex = 12, numberOfItterations = 5, currentItteration = 0, framesToIncrease = 17;

var loop = function() {
	var elapsed = (Date.now()/1000 - lastTime);
	lastTime = Date.now()/1000;
	time += elapsed;


	if(time - lastSwitchTime > 0.1) {
		lastSwitchTime = time;
		spriteIndex += framesToIncrease;
		currentItteration++;
		if(currentItteration > numberOfItterations || spriteIndex >= spriteData.frames.length) {
			currentItteration = 0;
			spriteIndex = intialSpriteIndex;
		}
		setMaterialOffset(spriteIndex);
	}

	scene.render();

	window.requestAnimationFrame(loop);
};

var init = function() {
	var thingsToLoad = 2;

	var finishedLoadingItem = function() {
		thingsToLoad--;
		if(!thingsToLoad) {
			canvas = document.getElementById("spriteCanvas");
			ctx = canvas.getContext("2d");	
			renderSpriteToCanvas(spriteData, palleteData, 0);

			var texture = Fury.Renderer.createTexture(canvas, "low", true);
			material.textures["uSampler"] = texture;

			lastTime = Date.now()/1000;
			setMaterialOffset(intialSpriteIndex);
			spriteIndex = intialSpriteIndex;
			loop();
		}
	};

	requestJson("zergling.json", function(responseText){
		spriteData = JSON.parse(responseText);
		finishedLoadingItem();
	});
	requestJson("Units.json", function(responseText){
		palleteData = JSON.parse(responseText);
		finishedLoadingItem();
	});
};

init();