const Renderer = require('./renderer');

module.exports = (function(){
    let exports = {};

    let TextureQuality = exports.TextureQuality = Renderer.TextureQuality;

    exports.create = (config) => {
        let { source, quality = TextureQuality.Low, clamp = false, flipY = true, disableAnsio = false } = config;

        if (!source) {
            console.error("No source provided to Texture.create");
            return null;
        }

        // For now this just enables use of config object for improved readability
        // Arguably should extract concept of texture quality from Renderer and just pass min max filters,
        // generateMipMaps, & enableAnsio
        return Renderer.createTexture(source, quality, clamp, flipY, disableAnsio);
    };

    return exports;
})();