// Voxel Mesher

// Data is meshed by adding quads for each visible voxel face to a mesh
// One mesh per 32 cubic 'chunk' of voxels.
// Uses texture coordinates and an atlas to allow for multiple voxel types in
// a single texture.
// An improvement would a be a shader that determined texture cordinates from
// world position and did not require texture coordinates, this would open the
// door for meshing optimisations, such as "greedy" meshing.

// TODO: Separate Mesher logic from worker logic (so that can be done sync or async)
importScripts('vorld.js');

// Basic Cube Geometry JSON
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

// Atlas Info
var atlas = VorldConfig.getAtlasInfo();

var adjustTextureCoords = function(textureArray, faceIndex, tileOffset, atlasSize) {
	var tileSize = atlas.tileSize;
	var tilePadding = atlas.padding;
	for(var i = 8 * faceIndex, l = i + 8; i < l; i += 2) {
		textureArray[i] = (tileSize * (textureArray[i] + tileOffset[0]) + tilePadding * tileOffset[0])  / atlas.size[0];		// s
		var pixelsFromTop = tileSize * (tileOffset[1] + 1) + tilePadding * tileOffset[1];
		textureArray[i+1] = (tileSize * textureArray[i+1] + (atlas.size[1] - pixelsFromTop)) / atlas.size[1]; 	// t
	}
};

var buildMesh = function(vorld, chunkI, chunkJ, chunkK) {
	var mesh = {
		vertices: [],
		normals: [],
		textureCoordinates: [],
		indices: []
	};

	var chunk = Vorld.getChunk(vorld, chunkI, chunkJ, chunkK);

	forEachBlock(chunk, function(chunk, i, j, k, x, y, z) {
		var block = Chunk.getBlock(chunk, i, j, k);

		// Exists?
		if(!block) { return; }

		// TODO: Change to transformation function
		// TODO: Move to second pass on world generation for encapulsation?
		if(block == "soil" && !Vorld.getBlock(vorld, i, j+1, k, chunkI, chunkJ, chunkK)) {
			block = "grass";
		}
		// For Each Direction : Is Edge? Add quad to mesh!
		// Front
		if(!Vorld.getBlock(vorld, i, j, k+1, chunkI, chunkJ, chunkK)) {
			addQuadToMesh(mesh, block, cubeFaces.front, x, y, z);
		}
		// Back
		if(!Vorld.getBlock(vorld, i, j, k-1, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.back, x, y, z);
		}
		// Top
		if(!Vorld.getBlock(vorld, i, j+1, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.top, x, y, z);
		}
		// Bottom
		if(!Vorld.getBlock(vorld, i, j-1, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.bottom, x, y, z);
		}
		// Right
		if(!Vorld.getBlock(vorld, i+1, j, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.right, x, y, z);
		}
		// Left
		if(!Vorld.getBlock(vorld, i-1, j, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.left, x, y, z);
		}
	});

	return mesh;
};

var addQuadToMesh = function(mesh, block, faceIndex, x, y, z) {
	var tile, offset, n = mesh.vertices.length/3;
	var vertices, normals, textureCoordinates;

	if(faceIndex == cubeFaces.top) {
		tile = atlas.tileOffsets[block].top;
	} else if (faceIndex == cubeFaces.bottom) {
		tile = atlas.tileOffsets[block].bottom;
	} else {
		tile = atlas.tileOffsets[block].side;
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
	adjustTextureCoords(textureCoordinates, 0, tile, atlas.size);

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

onmessage = function(e) {
  var areaExtents = e.data.areaExtents;
  var areaHeight = e.data.areaHeight;
  var vorld = e.data.chunkData;

	var totalIterations = (2 * areaExtents + 1) * (2 * areaExtents + 1) * areaHeight;
  iteration = 0;
  // Create Meshes
  for(var i = -areaExtents; i <= areaExtents; i++) {
    for (var j = -areaExtents; j <= areaExtents; j++) {
      for(var k = areaHeight - 1; k >= 0; k--) {
        var mesh = buildMesh(vorld, i, j, k);
        iteration++;
        if (mesh.indices.length > 0) {
          postMessage({
            mesh: mesh,
            offset: [i * vorld.chunkSize, k * vorld.chunkSize, j * vorld.chunkSize],
            progress: iteration / totalIterations
          });
        } else {
          postMessage({ progress: iteration / totalIterations });
        }
      }
    }
  }

  postMessage({ complete: true });
};