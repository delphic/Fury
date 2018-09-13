// Voxel Terrain Generator

// Creates voxel data using multiple octaves of noise where the octave integer is k
// you sample at x(2^k) and y(2^k) where 2^k is wavelength and 1/(2^k) is frequency.
// Each octave has a weighting for determining combination with others.
// Generated value is further divided by adjustmentFactor * (maxdepth + y)
// as a way to ensure air / ground distinction, this could be expanded to
// a more general shaping function.

// TODO: Separate generation logic from worker logic (so that can be done sync or async)
importScripts('perlin.js', 'simplex.js', 'vorld.js');

var vorld = Vorld.create({ chunkSize: 32 });

// Predicatable but kinda random numbers for string seed based generation
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
			if (i >= seedValue.length) { i = 0; }
			if (j >= seedValue.length) { j = j % seedValue.length; }
			return result;
		}
	};
};

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

	var chunk = Chunk.create({ size: 32 });

  // Determine blocks from noise function
  for(i = 0; i < chunk.size; i++) {
    for(j = 0; j < chunk.size; j++) {
      y = j - Math.floor(chunk.size/2.0);
      adjust = adjustmentFactor * (maxDepth + y + offset[1]);
      for(k = 0; k < chunk.size; k++) {
        var value = 0;
        var totalWeight = 0;
        for(o = 0; o < numOctaves; o++) {
          var wavelength = Math.pow(2, o);
          totalWeight += octaveWeightings[o];
          value += octaveWeightings[o] * octaves[o].noise(wavelength*(i + offset[0])/baseWavelength, wavelength*(j + offset[1])/baseWavelength, wavelength*(k + offset[2])/baseWavelength);
        }
        value /= totalWeight;
        var block = getBlockType(value / adjust); // value < 0.5 Air, 0.5 - 0.8 Soil, 0.8 - 1.0 Stone
        chunk.addBlock(i,j,k,block)
      }
    }
  }

  return chunk;
}

// World Generation
onmessage = function(e) {
  var seedString = e.data.seed;
  var perlin = e.data.perlin;
  var numOctaves = e.data.numOctaves;
  var octaves = [];1
  for(var o = 0; o < numOctaves; o++) {
    octaves.push(perlin ? new ClassicalNoise(createSeed(seedString)) : new SimplexNoise(createSeed(seedString)));
  }

  var areaExtents = e.data.areaExtents;
  var areaHeight = e.data.areaHeight;

	postMessage({ stage: "Generating Voxel Data"});
	postMessage({ progress: 0 });

  // Generate Chunks
	var iteration = 0;
	var totalIterations = (2 * areaExtents + 1) * (2 * areaExtents + 1) * areaHeight;
  var chunkOffset = [];
  for(var i = -areaExtents; i <= areaExtents; i++) {
    for (var j = -areaExtents; j <= areaExtents; j++) {
      for(var k = areaHeight - 1; k >= 0; k--) {
        chunkOffset[0] = i * vorld.chunkSize;
        chunkOffset[1] = k * vorld.chunkSize;
        chunkOffset[2] = j * vorld.chunkSize;

        var chunk = createChunk(chunkOffset, octaves, e.data);
        vorld.addChunk(chunk, i, j, k);

				iteration++;
				postMessage({ progress: iteration / totalIterations });
      }
    }
  }

	postMessage({ stage: "Generating Meshes"});
	postMessage({ progress: 0 });

	var mesher = new Worker('mesher.js');
	mesher.onmessage = function(e) {
		postMessage(e.data);
	};

 	var chunkData = vorld.getChunkData();
	mesher.postMessage({
		areaExtents: areaExtents,
		areaHeight: areaHeight,
		chunkData: chunkData
	});
};
