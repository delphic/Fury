importScripts('perlin.js', 'simplex.js');

// Basic Cube JSON
var cubeJson = {
	vertices: [ -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0 ],
	normals: [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0],
	textureCoordinates: [ 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 ],
	indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ]
};

var cubeFaces = {
	front: 0,
	back: 1,
	top: 2,
	bottom: 3,
	right: 4,
	left: 5
};

var tileOffsets = {
	grass: {
		side: [1,0],
		top: [0,0],
		bottom: [0,1]
	},
	soil: {
		side: [0,1],
		top: [0,1],
		bottom: [0,1]
	},
	stone: {
		side: [1,1],
		top: [1,1],
		bottom: [1,1]
	}
};

// Block Prefab Creation Helpers

// Should probably be passed in
var atlasSize = [64, 64];
var atlasPadding = 2;
var atlasTileSize = 16;

var adjustTextureCoords = function(textureArray, faceIndex, tileOffset, atlasSize) {
	var tileSize = atlasTileSize;
	var tilePadding = atlasPadding;
	for(var i = 8 * faceIndex, l = i + 8; i < l; i += 2) {
		textureArray[i] = (tileSize * (textureArray[i] + tileOffset[0]) + tilePadding * tileOffset[0])  / atlasSize[0];		// s
		var pixelsFromTop = tileSize * (tileOffset[1] + 1) + tilePadding * tileOffset[1];
		textureArray[i+1] = (tileSize * textureArray[i+1] + (atlasSize[1] - pixelsFromTop)) / atlasSize[1]; 	// t
	}
};

// End Block Prefab Creation Helpers

// Predicatable but kinda random numbers for seed based generation
var createSeed = function(seedValue) {
	var minCode = seedValue.charCodeAt(0), maxCode = seedValue.charCodeAt(0), i = 0, j;
	for(var n = 1, l = seedValue.length; n < l; n++) {
		minCode = Math.min(minCode, seedValue.charCodeAt(n));
		maxCode = Math.max(maxCode, seedValue.charCodeAt(n));
	}
	var number = function(index) {
		return (seedValue.charCodeAt(index) - (minCode - 0.0001)) / (maxCode + 0.001);
	};
	j = Math.floor(seedValue.length*number(0));
	return {
		random: function() {
			var result = 0.5*(number(i) + number(j));
			i+=1;
			j+=2;
			if(i>=seedValue.length) { i = 0; }
			if(j>=seedValue.length) { j = j%seedValue.length; }
			return result;
		}
	};
};

// Use octaves where the octave integer is k you sample at x(2^k) and y(2^k) where 2^k is wavelength and naturally 1/(2^k) is frequency each octave needs a weighing

// Divide by adjustmentFactor * (maxdepth + y) and adjust m as initial way to ensure air / ground distinction
// Try < 0.5 Air, 0.5 - 0.8 Soil, 0.8 - 1.0 Stone
var getBlockType = function(value) {
  if(value < 0.5) {
    return "";
  }
  if(value < 0.8) {
    return "soil";
  }
  return "stone";
};

var createChunk = function(offset, octaves, generationArgs) {

  var maxDepth = 16, i, j, k, o, adjust;
  var numOctaves = octaves.length;
  var octaveWeightings = generationArgs.octaveWeightings;
  var baseWavelength = generationArgs.baseWavelength;
  var adjustmentFactor = generationArgs.adjustmentFactor;

  var chunk = {
    blocks: [],
    size: 32,
    addBlock: function(i, j, k, block) {
      this.blocks[i + this.size*j + this.size*this.size*k] = block;
    },
    getBlock: function(i, j, k) {
      if(i < 0 || j < 0 || k < 0 || i >= this.size || j >= this.size || k >= this.size) {
        return null;
      }
      return this.blocks[i + this.size*j + this.size*this.size*k];
    }
  };

  // Determine blocks from noise function
  for(i = 0; i < chunk.size; i++) {
    for(j = 0; j < chunk.size; j++) {
      y = j - Math.floor(chunk.size/2.0);
      for(k = 0; k < chunk.size; k++) {
        adjust = adjustmentFactor * (maxDepth + y + offset[1]);
        var value = 0;
        var totalWeight = 0;
        for(o = 0; o < numOctaves; o++) {
          var wavelength = Math.pow(2, o);
          totalWeight += octaveWeightings[o];
          value += octaveWeightings[o] * octaves[o].noise(wavelength*(i + offset[0])/baseWavelength, wavelength*(j + offset[1])/baseWavelength, wavelength*(k + offset[2])/baseWavelength);
        }
        value /= totalWeight;
        var block = getBlockType(value / adjust);
        chunk.addBlock(i,j,k,block)
      }
    }
  }

  return chunk;
}

var vorld = {
  chunkSize: 32,
  chunks: {},
  addChunk: function(chunk, i, j, k) {
    this.chunks[i+"_"+j+"_"+k] = chunk;
  },
  getChunk: function(i, j, k) {
    var key = i+"_"+j+"_"+k;
    if (this.chunks[key]) {
        return this.chunks[key];
    }
    return null;
  },
  getBlock: function(blockI, blockJ, blockK, chunkI, chunkJ, chunkK) {
    // Assumes you won't go out by more than chunkSize
    if (blockI >= this.chunkSize) {
      blockI = blockI - this.chunkSize;
      chunkI += 1;
    } else if (blockI < 0) {
      blockI = this.chunkSize + blockI;
      chunkI -= 1;
    }
    // Due to some madness chunk k is y axis, and chunk j is z axis...
    if (blockJ >= this.chunkSize) {
      blockJ = blockJ - this.chunkSize;
      chunkK += 1;
    } else if (blockJ < 0) {
      blockJ = this.chunkSize + blockJ;
      chunkK -= 1;
    }
    if (blockK >= this.chunkSize) {
      blockK = blockK - this.chunkSize;
      chunkJ += 1;
    } else if (blockK < 0) {
      blockK = this.chunkSize + blockK;
      chunkJ -= 1;
    }

    var chunk = this.getChunk(chunkI, chunkJ, chunkK);
    if (chunk) {
      // The lowest chunk seemed to be accessed 22000 times!?
      // TODO: Check wtf that is doing
      return chunk.getBlock(blockI, blockJ, blockK);
    }
    return null;
  }
};

var buildMesh = function(vorld, chunkI, chunkJ, chunkK) {
	var mesh = {
		vertices: [],
		normals: [],
		textureCoordinates: [],
		indices: []
	};

	var chunk = vorld.getChunk(chunkI, chunkJ, chunkK);

	forEachBlock(chunk, function(chunk, i, j, k, x, y, z) {
		var block = chunk.getBlock(i,j,k);

		// Exists?
		if(!block) { return; }

		if(block == "soil" && !vorld.getBlock(i, j+1, k, chunkI, chunkJ, chunkK)) {
			block = "grass";
		}
		// For Each Direction : Is Edge? Add quad to mesh!
		// Front
		if(!vorld.getBlock(i, j, k+1, chunkI, chunkJ, chunkK)) {
			addQuadToMesh(mesh, block, cubeFaces.front, x, y, z);
		}
		// Back
		if(!vorld.getBlock(i, j, k-1, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.back, x, y, z);
		}
		// Top
		if(!vorld.getBlock(i, j+1, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.top, x, y, z);
		}
		// Bottom
		if(!vorld.getBlock(i, j-1, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.bottom, x, y, z);
		}
		// Right
		if(!vorld.getBlock(i+1, j, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.right, x, y, z);
		}
		// Left
		if(!vorld.getBlock(i-1, j, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.left, x, y, z);
		}
	});

	return mesh;
};

var addQuadToMesh = function(mesh, block, faceIndex, x, y, z) {
	var tile, offset, n = mesh.vertices.length/3;
	var vertices, normals, textureCoordinates;

	if(faceIndex == cubeFaces.top) {
		tile = tileOffsets[block].top;
	} else if (faceIndex == cubeFaces.bottom) {
		tile = tileOffsets[block].bottom;
	} else {
		tile = tileOffsets[block].side;
	}

	offset = faceIndex * 12;
	vertices = cubeJson.vertices.slice(offset, offset + 12);
	for(var i = 0; i < 4; i++) {
		vertices[3*i] = 0.5 * vertices[3*i] + x;
		vertices[3*i + 1] = 0.5 * vertices[3*i +1] + y;
		vertices[3*i + 2] = 0.5 * vertices[3*i + 2] + z;
	}

	normals = cubeJson.normals.slice(offset, offset + 12);

	offset = faceIndex * 8;
	textureCoordinates = cubeJson.textureCoordinates.slice(offset, offset + 8);
	adjustTextureCoords(textureCoordinates, 0, tile, atlasSize);

	concat(mesh.vertices, vertices);
	concat(mesh.normals, normals);
	concat(mesh.textureCoordinates, textureCoordinates);
	mesh.indices.push(n,n+1,n+2, n,n+2,n+3);
};

var concat = function(a, b) {
	// GC efficient concat
	for(var i = 0, l = b.length; i < l; i++) {
		a.push(b[i]);
	}
};

// delegate should be a function taking chunk, i, j, k, x, y, z
var forEachBlock = function(chunk, delegate) {
	for(i = 0; i < chunk.size; i++) {
		x = i - Math.floor(chunk.size/2.0);
		for(j = 0; j < chunk.size; j++) {
			y = j - Math.floor(chunk.size/2.0);
			for(k = 0; k < chunk.size; k++) {
				z = k - Math.floor(chunk.size/2.0);
				delegate(chunk, i, j, k, x, y, z);
			}
		}
	}
};

// World Generation
onmessage = function(e) {

  var seedString = e.data.seed;
  var perlin = e.data.perlin;
  var numOctaves = e.data.numOctaves;
  var octaves = [];
  for(var o = 0; o < numOctaves; o++) {
    octaves.push(perlin ? new ClassicalNoise(createSeed(seedString)) : new SimplexNoise(createSeed(seedString)));
  }

  var areaExtents = e.data.areaExtents;
  var areaHeight = e.data.areaHeight;

  // Generate Chunks
  var chunkOffset = [];
  for(var i = -areaExtents; i <= areaExtents; i++) {
    for (var j = -areaExtents; j <= areaExtents; j++) {
      for(var k = areaHeight - 1; k >= 0; k--) {
        chunkOffset[0] = i * vorld.chunkSize;
        chunkOffset[1] = k * vorld.chunkSize;
        chunkOffset[2] = j * vorld.chunkSize;

        var chunk = createChunk(chunkOffset, octaves, e.data);
        vorld.addChunk(chunk, i, j, k);
				// TODO: postMessage chunk generated
      }
    }
  }

  // Create Meshes
  for(var i = -areaExtents; i <= areaExtents; i++) {
    for (var j = -areaExtents; j <= areaExtents; j++) {
      for(var k = areaHeight - 1; k >= 0; k--) {
        var mesh = buildMesh(vorld, i, j, k);
        if (mesh.indices.length > 0) {
          postMessage({ mesh: mesh, offset: [i * vorld.chunkSize, k * vorld.chunkSize, j * vorld.chunkSize] });
        }
      }
    }
  }
};
