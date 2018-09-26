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

var createChunk = function(offset, octaves, generationArgs) {
  var maxDepth = 16, i, j, k, o, adjust;
  var numOctaves = octaves.length;
  var octaveWeightings = generationArgs.octaveWeightings;
  var baseWavelength = generationArgs.baseWavelength;

	var vorldConfig = {
		thresholds: [ 0.5, 0.8 ],
		adjustmentFactor: generationArgs.adjustmentFactor,
		yOffset: 0 // This was being calculated as a constant value minus half chunk size, but it comes out as zero
	};
	var shapingFunction = VorldConfig.getShapingFunction(vorldConfig);

	var chunk = Chunk.create({ size: 32 });

  // Determine blocks from noise function
  for(i = 0; i < chunk.size; i++) {
    for(j = 0; j < chunk.size; j++) {
      for(k = 0; k < chunk.size; k++) {
        var value = 0;
        var totalWeight = 0;
				var x = i + offset[0], y = j + offset[1], z = k + offset[2];
        for(o = 0; o < numOctaves; o++) {
          var wavelength = Math.pow(2, o);
          totalWeight += octaveWeightings[o];
          value += octaveWeightings[o] * octaves[o].noise(
						wavelength * x / baseWavelength,
						wavelength * y / baseWavelength,
						wavelength * z / baseWavelength);
        }
        value /= totalWeight;
				value = shapingFunction(x, y, z) * value;
        var block = VorldConfig.getBlockType(vorldConfig, value);
        Chunk.addBlock(chunk, i, j, k, block)
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

	postMessage({ stage: "" });
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
        Vorld.addChunk(vorld, chunk, i, j, k);

				iteration++;
				postMessage({ progress: iteration / totalIterations });
      }
    }
  }
	postMessage({ complete: true, vorld: vorld });
};
