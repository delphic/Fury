var Vorld = (function() {
  var exports = {};
  exports.addChunk = function(vorld, chunk, i, j, k) {
    vorld.chunks[i+"_"+j+"_"+k] = chunk;
  };
  exports.getChunk = function(vorld, i, j, k) {
    var key = i+"_"+j+"_"+k;
    if (vorld.chunks[key]) {
        return vorld.chunks[key];
    }
    return null;
  };
  exports.getBlock = function(vorld, blockI, blockJ, blockK, chunkI, chunkJ, chunkK) {
    // Assumes you won't go out by more than chunkSize
    if (blockI >= vorld.chunkSize) {
      blockI = blockI - vorld.chunkSize;
      chunkI += 1;
    } else if (blockI < 0) {
      blockI = vorld.chunkSize + blockI;
      chunkI -= 1;
    }
    if (blockJ >= vorld.chunkSize) {
      blockJ = blockJ - vorld.chunkSize;
      chunkJ += 1;
    } else if (blockJ < 0) {
      blockJ = vorld.chunkSize + blockJ;
      chunkJ -= 1;
    }
    if (blockK >= vorld.chunkSize) {
      blockK = blockK - vorld.chunkSize;
      chunkK += 1;
    } else if (blockK < 0) {
      blockK = vorld.chunkSize + blockK;
      chunkK -= 1;
    }

    var chunk = Vorld.getChunk(vorld, chunkI, chunkJ, chunkK);
    if (chunk) {
      return Chunk.getBlock(chunk, blockI, blockJ, blockK);
    }
    return null;
  };
  exports.create = function(parameters) {
    var vorld = {};
    if (parameters && parameters.chunkSize) {
      vorld.chunkSize = parameters.chunkSize;
    } else {
      vorld.chunkSize = 32;
    }
    vorld.chunks = {};
    if (parameters && parameters.chunks) {
      var keys = Object.keys(parameters.chunks);
      for(var i = 0, l = keys.length; i < l; i++) {
        vorld.chunks[keys[i]] = Chunk.create(parameters.chunks[keys[i]]);
      }
    }
    return vorld;
  };
  return exports;
})();

var Chunk = (function() {
  var exports = {};
  exports.addBlock = function(chunk, i, j, k, block) {
    chunk.blocks[i + chunk.size*j + chunk.size*chunk.size*k] = block;
  };
  exports.getBlock = function(chunk, i, j, k) {
    if(i < 0 || j < 0 || k < 0 || i >= chunk.size || j >= chunk.size || k >= chunk.size) {
      return null;
    }
    return chunk.blocks[i + chunk.size*j + chunk.size*chunk.size*k];
  };
  exports.create = function(parameters) {
    var chunk = {};
    if (parameters && parameters.size) {
      chunk.size = parameters.size;
    } else {
      chunk.size = 32;
    }
    if (parameters && parameters.blocks) {
      chunk.blocks = parameters.blocks;
    } else {
      chunk.blocks = [];
    }
    return chunk;
  };
  return exports;
})();

var VorldConfig = (function() {
  var exports = {};
  exports.getBlockType = function(config, value) {
    // TODO: Return id instead of string
    if(value < config.thresholds[0]) {
  		return "";
    }
    if(value < config.thresholds[1]) {
      return "soil";
    }
    return "stone";
  };
  exports.getTransformedBlockType = function(block, verticallyAdjacent) {
    if(block == "soil" && !verticallyAdjacent) {
      return "grass";
    }
    return block;
  };
  exports.getShapingFunction = function(config) {
    // TODO: Switch on requested shaping function type
    return function(x, y, z) {
  		return 1 / (config.adjustmentFactor * (y + config.yOffset));
  	};
  };
  exports.getAtlasInfo = function() {
    // TODO: Build from parameters, perhaps an init from other methods
    atlas = {};
    atlas.greedy = false;
    atlas.size = [64, 64];
    atlas.padding = 2;
    atlas.tileSize = 16;
    atlas.tileOffsets = { // TODO: Will need to switch to id look up
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
    	},
    	wood: {
    		side: [1,2],
    		top: [0,2],
    		bottom: [0,2]
    	},
    	leaves: {
    		side: [2,0],
    		top: [2,0],
    		bottom: [2,0]
    	},
    	water: {
    		side: [2,1],
    		top: [2,1],
    		bottom: [2,1]
    	},
    	bedrock: {
    		side: [2,2],
    		top: [2,2],
    		bottom: [2,2],
    	}
    };
    return atlas;
  };
  return exports;
})();
