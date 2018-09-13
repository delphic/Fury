// TODO: Separate Data and Functions
var Vorld = (function() {
  var prototype = {
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
      // Due to some madness, chunk k is y axis, and chunk j is z axis...
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
        return chunk.getBlock(blockI, blockJ, blockK);
      }
      return null;
    },
    // TODO: Remove this function once all other functions are 'static'
    getChunkData: function() {
      var chunks = {};
      var chunkKeys = Object.keys(this.chunks);
      for(var i = 0, l = chunkKeys.length; i < l; i++) {
        chunks[chunkKeys[i]] = this.chunks[chunkKeys[i]].getData();
      }
      return {
        chunkSize: this.chunkSize,
        chunks: chunks
      };
    }
  };
  var exports = {};
  exports.create = function(parameters) {
    var vorld = Object.create(prototype);
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
  var prototype = {
    addBlock: function(i, j, k, block) {
      this.blocks[i + this.size*j + this.size*this.size*k] = block;
    },
    getBlock: function(i, j, k) {
      if(i < 0 || j < 0 || k < 0 || i >= this.size || j >= this.size || k >= this.size) {
        return null;
      }
      return this.blocks[i + this.size*j + this.size*this.size*k];
    },
		getData: function() {
			return {
				blocks: this.blocks,
				size: 32
			};
		}
  };
  var exports = {};
  exports.create = function(parameters) {
    var chunk = Object.create(prototype);
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
