var Material = module.exports = function(){
	var exports = {};
	var prototype = {
		blendSeparate: false, // Toggles use of blendFunc vs. blendFuncSeparate
		blendEquation: "FUNC_ADD",
		// blendFunc Parameters
		sourceBlendType: "SRC_ALPHA",
		destinationBlendType: "ONE_MINUS_SRC_ALPHA",
		// blendFuncSeparate Parameters 
		sourceColorBlendType: "SRC_ALPHA",
		destinationColorBlendType: "ONE_MINUS_SRC_ALPHA",
		sourceAlphaBlendType: "ZERO",
		destinationAlphaBlendType: "DST_ALPHA",
		setTexture: function(texture, uniformName) {
			if (uniformName) {
				this.textures[uniformName] = texture;
			} else {
				this.textures[this.shader.textureUniformNames[0]] = texture;
			}
		},
		setTextures: function(textures) {
			for (var i = 0, l = textures.length; i < l; i++) {
				if (textures[i].uniformName && textures[i].texture) {
					// Array of uniform name to texture objects
					this.textures[textures[i].uniformName] = textures[i].texture;
				} else if (i < this.shader.textureUniformNames.length) {
					// Assume array of textures - use uniform names
					this.textures[this.shader.textureUniformNames[i]] = textures[i];
				} else {
					throw new Error("Textures parameter must be either an array of objects containing uniformName and texture properties," 
						+ " or an array textures of length no greater than the provided shader's uniform names array");
				}
			}
		},
		setProperties: function(properties) {
			let keys = Object.keys(properties);
			for (let i = 0, l = keys.length; i < l; i++) {
				this[keys[i]] = properties[keys[i]];
			}
		}
	};

	var create = exports.create = function(parameters) {
		var material = Object.create(prototype);

		if(!parameters.shader) {
			throw new Error("Shader must be provided");
		}
		material.shader = parameters.shader;

		material.textures = {};
		if (parameters.textures) {
			material.setTextures(parameters.textures);
		} else if (parameters.texture) {
			material.setTexture(parameters.texture);
		}

		if (parameters.properties) {
			material.setProperties(parameters.properties);
		}

		if (material.shader.validateMaterial) {
			material.shader.validateMaterial(material);
		}

		return material;
	};
	
	return exports;
}();
