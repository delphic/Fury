var VoxelShader = (function() {
  var exports = {};

  var uvShaderSource = {
    vs: function() {
      return [
        "attribute vec3 aVertexPosition;",
        "attribute vec2 aTextureCoord;",
        "attribute vec3 aVertexNormal;",

        "uniform mat4 uMVMatrix;",
        "uniform mat4 uPMatrix;",
        "uniform mat4 uMMatrix;",

        "varying vec2 vTextureCoord;",
        "varying float vLightWeight;",

        "void main(void) {",
          "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
          "vTextureCoord = aTextureCoord;",
          "vLightWeight = 0.5 + 0.5 * max(dot(aVertexNormal, normalize(vec3(-1.0, 2.0, 1.0))), 0.0);",
        "}"].join('\n');
    },
    fs: function() {
      return [
        "precision mediump float;",

        "varying vec2 vTextureCoord;",
        "varying float vLightWeight;",

        "uniform sampler2D uSampler;",

        "void main(void) {",
            "vec4 color = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
            "gl_FragColor = vec4(vLightWeight * color.rgb, color.a);",
        "}"].join('\n');
      }
  };

  var greedyShaderSource = {
    vs: function() {
      return [
        "attribute vec3 aVertexPosition;",
        "attribute vec2 aTextureCoord;",
        "attribute vec3 aVertexNormal;",

        "uniform mat4 uMVMatrix;",
        "uniform mat4 uPMatrix;",

        "varying vec2 vTextureCoord;",
        "varying vec4 vWorldPosition;",
        "varying vec3 vNormal;",
        "varying float vLightWeight;",

        "void main(void) {",
          "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
          "vTextureCoord = aTextureCoord;",
          "vNormal = aVertexNormal;",
          // Normally would mulitply this by the world / model matrix but as models
          // are all axis aligned and we're going to be using frac value anyway, it's unnecessary
          "vWorldPosition = vec4(aVertexPosition + vec3(0.5, 0.5, 0.5), 1.0);",
          // HACK: voxels are centered on world space integers, so offset by half
          "vLightWeight = 0.5 + 0.5 * max(dot(aVertexNormal, normalize(vec3(-1.0, 2.0, 1.0))), 0.0);",
        "}"].join('\n');
    },
    fs: function(atlasWidth, atlasHeight, tileSize, tilePadding) {
      return [
        "precision mediump float;",

        "varying vec2 vTextureCoord;",
        "varying vec4 vWorldPosition;",
        "varying vec3 vNormal;",
        "varying float vLightWeight;",

        "uniform sampler2D uSampler;",

        "void main(void) {",
            // World Space Lookup
            "vec3 pos = fract(vWorldPosition.xyz);",

            // So I think this fract is causing issues with the mipmaps
            // as the samples wrap they are distant so it picks too small a mipmap,
            // can't not use fract without breaking use with larger quads
            // May need to generate own mipmaps to prevent bleeding in the mipmaps
            // https://0fps.net/2013/07/09/texture-atlases-wrapping-and-mip-mapping/
            // Don't know how well this'll interact with the anisotropic filtering ext

            // Would this extension be helpful https://developer.mozilla.org/en-US/docs/Web/API/EXT_shader_texture_lod

            "vec2 lookup = abs(vNormal.x) * pos.zy + abs(vNormal.y) * pos.xz + abs(vNormal.z) * pos.xy;",
            "float tileX = floor(vTextureCoord.s);",
            "float tileY = floor(vTextureCoord.t);",

            // Texture lookup from tile (altas size + padding)
            "float s = ((" + tileSize + " + " + tilePadding + ") * tileX + (" + tileSize + " * lookup.x))/" + atlasWidth +";",
            "float t = (" + atlasHeight + " - ((" + tileSize + " + " + tilePadding + ") * tileY + (" + tileSize + " * (1.0 - lookup.y)) ) )/" + atlasHeight +";",
            "vec4 color = texture2D(uSampler, vec2(s, t));",

            "gl_FragColor = vec4(vLightWeight * color.rgb, color.a);",
        "}"].join('\n');
      }
  };

  exports.create = function(atlasInfo) {
    // Integer values expected for atlas sizes
    var width = "" + atlasInfo.size[0] + ".0";
    var height = "" + atlasInfo.size[1] + ".0";
    var size = "" + atlasInfo.tileSize + ".0";
    var padding = "" + atlasInfo.padding + ".0";
    var greedy = atlasInfo.greedy;
    var vsSource = greedy ? greedyShaderSource.vs() : uvShaderSource.vs();
    var fsSource = greedy ? greedyShaderSource.fs(width, height, size, padding) : uvShaderSource.fs();

    var shader = {
      vsSource: vsSource,
      fsSource: fsSource,
        attributeNames: [ "aVertexPosition", "aVertexNormal", "aTextureCoord" ],
        uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler" ],
        textureUniformNames: [ "uSampler" ],
        pMatrixUniformName: "uPMatrix",
        mvMatrixUniformName: "uMVMatrix",
        bindMaterial: function(material) {
          this.enableAttribute("aVertexPosition");
          this.enableAttribute("aTextureCoord");
          this.enableAttribute("aVertexNormal");
        },
        bindBuffers: function(mesh) {
          this.setAttribute("aVertexPosition", mesh.vertexBuffer);
          this.setAttribute("aTextureCoord", mesh.textureBuffer);
          this.setAttribute("aVertexNormal", mesh.normalBuffer);
          this.setIndexedAttribute(mesh.indexBuffer);
        }
    };
    return shader;
  };
  return exports;
})();
