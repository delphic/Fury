var Material = module.exports = function(){
	var exports = {};
	var prototype = {
		setTexture: function(name, texture) {
			// TODO: Check that its a valid GL texture
			this.textures[name] = texture;
		}
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
				if(textures[i].hasOwnProperty("name") && textures[i].hasOwnProperty("texture")) {
					material.textures[textures[i].name] = textures[i].texture;
				} else {
					throw new Error("Texture Array must contain objects with properties 'name' and 'texture'");
				}
			}
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
		return copy;
	};

	return exports;
}();