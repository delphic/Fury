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
    // Due to some madness, chunk k is y axis, and chunk j is z axis...
    if (blockJ >= vorld.chunkSize) {
      blockJ = blockJ - vorld.chunkSize;
      chunkK += 1;
    } else if (blockJ < 0) {
      blockJ = vorld.chunkSize + blockJ;
      chunkK -= 1;
    }
    if (blockK >= vorld.chunkSize) {
      blockK = blockK - vorld.chunkSize;
      chunkJ += 1;
    } else if (blockK < 0) {
      blockK = vorld.chunkSize + blockK;
      chunkJ -= 1;
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
