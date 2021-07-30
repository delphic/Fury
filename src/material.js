var Material = module.exports = function(){
	var exports = {};
	var prototype = {
		blendEquation: "FUNC_ADD",
		sourceBlendType: "SRC_ALPHA",
		destinationBlendType: "ONE_MINUS_SRC_ALPHA"
	};

	var create = exports.create = function(parameters) {
		var material = Object.create(prototype);

		if(!parameters.shader) {
			throw new Error("Shader must be provided");
		}
		material.shader = parameters.shader;

		material.textures = {};
		if(parameters.textures) {
			var textures = parameters.textures;
			for(var i = 0, l = textures.length; i < l; i++) {
				if(textures[i].uniformName && textures[i].texture) {
					material.textures[textures[i].uniformName] = textures[i].texture;
				} else {
					throw new Error("Texture Array must contain objects with properties 'uniformName' and 'texture'");
				}
			}
		}

		if (parameters.properties) {
			let keys = Object.keys(parameters.properties);
			for (let i = 0, l = keys.length; i < l; i++) {
				material[keys[i]] = parameters.properties[keys[i]];
			}
			material._properties = keys; // Store custom properties for the copy method
		}

		if (shader.validateMaterial) {
			shader.validateMaterial(material);
		}

		return material;
	};

	var copy = exports.copy = function(material) {
		var copy = Object.create(prototype);
		copy.shader = material.shader;
		copy.textures = {};
		if(material.textures) {
			var textures = material.textures;
			for(var key in textures) {
				if(textures.hasOwnProperty(key)) {
					copy.textures[key] = textures[key];
				}
			}
		}

		if (material._properties) {
			// Note this will assign the same to the copy for reference types, rather than performing a deep clone
			// additionally it will not copy across any dynamically added properties 
			// TODO: Support dynamic properties via Object.assign ? 
			for (let i = 0, l = material._properties.length; i < l; i++) {
				copy[material._properties[i]] = material[material._properties[i]];
			}
		}
	
		return copy;
	};

	return exports;
}();
