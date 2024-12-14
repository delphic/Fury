const Renderer = require('./renderer');

module.exports = (function(){
	let exports = {};

	let FilterType = exports.FilterType = Renderer.FilterType;

	let TextureQuality = exports.TextureQuality = {
		Pixel: "pixel",			// Uses Mips and nearest pixel
		Highest: "highest",		// Uses Mips & Interp (trilinear)
		High: "high",			// Uses Mips & Interp (bilinear)
		Medium: "medium",		// Linear Interp
		Low: "low"				// Uses nearest pixel
	};

	let QualitySettings = exports.QualitySettings = {};
	QualitySettings[TextureQuality.Low] = {
		mag: FilterType.NEAREST,
		min: FilterType.NEAREST
	};
	QualitySettings[TextureQuality.Medium] = {
		mag: FilterType.LINEAR,
		min: FilterType.LINEAR
	};
	QualitySettings[TextureQuality.High] = {
		mag: FilterType.LINEAR,
		min: FilterType.LINEAR_MIPMAP_NEAREST,
		enableAnisotropicFiltering: true,
		generateMipmaps: true
	};
	QualitySettings[TextureQuality.Highest] = {
		mag: FilterType.LINEAR,
		min: FilterType.LINEAR_MIPMAP_LINEAR,
		enableAnisotropicFiltering: true,
		generateMipmaps: true
	};
	QualitySettings[TextureQuality.Pixel] = {
		// Unfortunately you can't use MAG_FILTER NEAREST with MIN_FILTER MIPMAP when using the anisotropy extension
		// you can without it however, so there is a trade off on crisp near pixels against blurry textures at severe angles
		mag: FilterType.NEAREST,
		min: FilterType.LINEAR_MIPMAP_LINEAR,
		enableAnisotropicFiltering: true,
		generateMipmaps: true
		// Could investigate using multiple samplers in a version 300 ES Shader and blending between them,
		// or using multiple texture with different settings, potentially using dFdx and dFdy to determine / estimate MIPMAP level
	};

	exports.create = (config) => {
		let { 
			source,
			quality = TextureQuality.Low,
			clamp = false,
			flipY = true,
		} = config;

		if (!source) {
			console.error("Null source provided to Texture.create config");
			return null;
		}

		let settings = QualitySettings[quality]; 
		if (!settings) {
			console.error("Unexpected quality value: " + quality);
			return null;
		}

		return Renderer.createTexture(
			source,
			clamp,
			flipY,
			settings.mag,
			settings.min,
			settings.generateMipmaps,
			settings.enableAnisotropicFiltering);
	};

	exports.load = (uri, config, callback) => {
		config = config || {};
		let image = new Image();
		image.onload = function() {
			config.source = image;
			texture = exports.create(config);
			callback(texture);
		}
		image.src = uri;
	};

	exports.createTextureArray = (config) => {
		let {
			source,
			width,
			height,
			imageCount,
			quality = TextureQuality.Low,
			clamp = false,
			flipY = true
		} = config;

		if (!source || !width || !height || !imageCount) {
			console.error("Texture array config requires source, width, height and imageCount, provided " + JSON.stringify(config));
			return null;
		}

		let settings = QualitySettings[quality]; 
		if (!settings) {
			console.error("Unexpected quality value: " + quality);
			return null;
		}

		return Renderer.createTextureArray(
			source,
			width,
			height,
			imageCount,
			clamp,
			flipY,
			settings.mag,
			settings.min,
			settings.generateMipmaps,
			settings.enableAnisotropicFiltering);
	};

	return exports;
})();