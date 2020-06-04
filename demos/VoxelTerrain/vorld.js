"use strict";

var Vorld = (function() {
  var exports = {};
  exports.addChunk = function(vorld, chunk, i, j, k) {
    vorld.chunks[i+"_"+j+"_"+k] = chunk;
    chunk.indices = [i, j, k];
  };
  exports.getChunk = function(vorld, i, j, k) {
    var key = i+"_"+j+"_"+k;
    if (vorld.chunks[key]) {
        return vorld.chunks[key];
    }
    return null;
  };
  exports.addBlock = function(vorld, x, y, z, block) {
    var size = vorld.chunkSize;
    var chunkI = Math.floor(x / size),
      chunkJ = Math.floor(y / size),
      chunkK = Math.floor(z / size);
    var blockI = x - (chunkI * size),
      blockJ = y - (chunkJ * size),
      blockK = z - (chunkK * size);
    var chunk = exports.getChunk(vorld, chunkI, chunkJ, chunkK);
    if (!chunk) {
      chunk = Chunk.create({ size: vorld.chunkSize });
      Vorld.addChunk(vorld, chunk, chunkI, chunkJ, chunkK);
    }
    Chunk.addBlock(chunk, blockI, blockJ, blockK, block);
  };
  exports.getBlock = function(vorld, x, y, z) {
    var size = vorld.chunkSize;
    var chunkI = Math.floor(x / size),
      chunkJ = Math.floor(y / size),
      chunkK = Math.floor(z / size);
    var blockI = x - (chunkI * size),
      blockJ = y - (chunkJ * size),
      blockK = z - (chunkK * size);
    return exports.getBlockByIndex(vorld, blockI, blockJ, blockK, chunkI, chunkJ, chunkK);
  };
  exports.getBlockByIndex = function(vorld, blockI, blockJ, blockK, chunkI, chunkJ, chunkK) {
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
    // TODO: Use UINT array?
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
  var blockIds = {
      AIR: 0,
      STONE: 1,
      SOIL: 2,
      GRASS: 3,
      WOOD: 4,
      LEAVES: 5,
      WATER: 6,
      BEDROCK: 7
  };

  exports.getBlockType = function(config, value) {
    // TODO: Return id instead of string
    if(value < config.thresholds[0]) {
  		return blockIds.AIR;
    }
    if(value < config.thresholds[1]) {
      return blockIds.SOIL;
    }
    return blockIds.STONE;
  };
  exports.getTransformedBlockType = function(block, verticallyAdjacent) {
    if(block == blockIds.SOIL && !verticallyAdjacent) {
      return blockIds.GRASS;
    }
    return block;
  };
  exports.getShapingFunction = function(config) {
    // Would be cute to take a string you could just eval
    if (config.shapingFunction == "gaussian") {
        let a = config.amplitude, sdx = config.sdx, sdz = config.sdz, x0 = 0, z0 = 0;
        return function(x, y, z) {
            let fxy = a * Math.exp(-((((x - x0) * (x - x0)) / (2 * sdx * sdx)) + (((z -z0) * (z - z0)) / (2 * sdz * sdz))));
            return Math.max(0, 1 + (fxy - y) / config.yDenominator);
        };
    } else if (config.shapingFunction == "negative_y") {
        return function(x, y, z) {
            return (config.yOffset - y) / config.yDenominator;
        };
    } else if (config.shapingFunction == "inverse_y") {
        return function(x, y, z) {
            return 1 / (config.adjustmentFactor * (y + config.yOffset));
        };
    } else {
        return function(x, y, z) {
            return 1;
        };
    }
  };
  exports.getAtlasInfo = function() {
    // TODO: Build from parameters, perhaps an init from other methods
    var atlas = {};
    atlas.tileSize = 64;
    atlas.arraySize = 9;
    atlas.tileIndices = [];
    atlas.tileIndices[blockIds.GRASS] = { side: 1, top: 0, bottom: 2 };
    atlas.tileIndices[blockIds.SOIL] = { side: 2, top: 2, bottom: 2 };
    atlas.tileIndices[blockIds.STONE] = { side: 3, top: 3, bottom: 3 };
    atlas.tileIndices[blockIds.BEDROCK] = { side: 4, top: 4, bottom: 4 };
    atlas.tileIndices[blockIds.WOOD] = { side: 6, top: 5, bottom: 5 };
    atlas.tileIndices[blockIds.LEAVES] = { side: 7, top: 7, bottom: 7 };
    atlas.tileIndices[blockIds.WATER] = { side: 8, top: 8, bottom: 8 };
    return atlas;
  };
  return exports;
})();
