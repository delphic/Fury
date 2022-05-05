const Renderer = require('./renderer');

module.exports = (function(){
    let exports = {};

    let TextureQuality = exports.TextureQuality = Renderer.TextureQuality;

    exports.create = (config) => {
        let { source, quality = TextureQuality.Low, clamp = false, flipY = true, disableAnsio = false } = config;

        // HACK: disableAnsio exists only due to the lack of ability to configure
        // texture filtering and should be removed once this capability is added

        if (!source) {
            console.error("Null source provided to Texture.create config");
            return null;
        }

        // For now this just enables use of config object for improved readability
        // Arguably should extract concept of texture quality from Renderer and just pass min max filters,
        // generateMipMaps, & enableAnsio
        return Renderer.createTexture(source, quality, clamp, flipY, disableAnsio);
    };

    exports.createTextureArray = (config) => {
        let { source, width, height, imageCount, quality = TextureQuality.Low, clamp = false } = config;

        if (!source || !width || !height || !imageCount) {
            console.error("Texture array config requires source, width, height and imageCount, provided " + JSON.stringify(config));
            return null;
        }

        return Renderer.createTextureArray(source, width, height, imageCount, quality, clamp);
    };

    return exports;
})();