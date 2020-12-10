var Model = module.exports = (function() {
    var exports = {};

    // Takes a URI of a glTF file to load
    // Returns an object containing an array meshdata ready for use with Fury.Mesh
    // In future can be extended to include material information
    exports.load = function(uri, callback) {
        // TODO: Check file extension, only gltf currently supported
        // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0

        fetch(uri).then(function(response) {
            return response.json();
        }).then(function(json) {
            // Find first mesh and load it
            // TODO: Load all meshes
            // TODO: Load all sets of texture coordinates

            // TODO: Option to provide data as JS arrays (i.e. buffers: false)
            // This is so we can have the data available to JS for runtime manipulation
            var meshData = {
                buffers: true
            };

            var attributes = json.meshes[0].primitives[0].attributes;
            var positionIndex = attributes.POSITION;    // index into accessors
            var normalsIndex = attributes.NORMAL;       // index into accessors
            var uvIndex = attributes.TEXCOORD_0;        // index into accessors
            var colorIndices = [];

            var propertyName = "COLOR_";
            var propertyNameIndex = 0;
            while (attributes.hasOwnProperty(propertyName + propertyNameIndex)) {
              colorIndices.push(attributes[propertyName + propertyNameIndex]);
              propertyNameIndex++;
            }

            var indicesIndex = json.meshes[0].primitives[0].indices;
            // ^^ I think this is the index and not the index count, should check with a more complex / varied model

            // Calculate bounding radius
            var max = json.accessors[positionIndex].max;
            var min = json.accessors[positionIndex].min;
            var maxPointSqrDistance = max[0]*max[0] + max[1]*max[1] + max[2]*max[2];
            var minPointSqrDistance = min[0]*min[0] + min[1]*min[1] + min[2]*min[2];
            meshData.boundingRadius = Math.sqrt(Math.max(maxPointSqrDistance, minPointSqrDistance));

            var vertexCount = json.accessors[positionIndex].count;
            var positionBufferView = json.bufferViews[json.accessors[positionIndex].bufferView];

            var indexCount = json.accessors[indicesIndex].count;
            var indicesBufferView = json.bufferViews[json.accessors[indicesIndex].bufferView];

            if (positionBufferView.buffer != indicesBufferView.buffer) {
                console.error("Triangle Indices Buffer Index does not match Position Buffer Index");
            }

            var normalsCount, uvCount;
            var normalsBufferView, uvBufferView;

            if (normalsIndex !== undefined) {
                normalsCount = json.accessors[normalsIndex].count;
                normalsBufferView = json.bufferViews[json.accessors[normalsIndex].bufferView];
                if (positionBufferView.buffer != normalsBufferView.buffer) {
                    console.error("Normals Buffer Index does not match Position Buffer Index");
                }
            }

            if (uvIndex !== undefined) {
                uvCount = json.accessors[uvIndex].count;
                uvBufferView = json.bufferViews[json.accessors[uvIndex].bufferView];
                if (positionBufferView.buffer != uvBufferView.buffer) {
                    console.error("Texture Coordinates Buffer Index does not match Position Buffer Index");
                }
            }

            var colorsCounts = [];
            var colorsBufferViews = [];

            for (let i = 0, l = colorIndices.length; i < l; i++) {
              let colorIndex = colorIndices[i];
              let accessor = json.accessors[colorIndex];
              colorsCounts[i] = accessor.count;
              colorsBufferViews[i] = json.bufferViews[accessor.bufferView];
              if (positionBufferView.buffer != colorsBufferViews[i].buffer) {
                console.error("The COLOR_" + i +" Buffer Index does not match Position Buffer Index");
              }
            }

            fetch(json.buffers[positionBufferView.buffer].uri).then(function(response) {
                return response.arrayBuffer();
            }).then(function(arrayBuffer) {
                // TODO: pick typedarray type from accessors[index].componentType (5126 => Float32, 5123 => Int16)
                // TODO: Get size from data from accessors[index].type rather than hardcoding
                meshData.vertices = new Float32Array(arrayBuffer, positionBufferView.byteOffset, vertexCount * 3);
                meshData.vertexCount = vertexCount;

                if (normalsIndex !== undefined) {
                    meshData.normals = new Float32Array(arrayBuffer, normalsBufferView.byteOffset, normalsCount * 3);
                    meshData.normalsCount = normalsCount;
                }

                if (uvIndex !== undefined) {
                    meshData.textureCoordinates = new Float32Array(arrayBuffer, uvBufferView.byteOffset, uvCount * 2);
                    meshData.textureCoordinatesCount = uvCount;
                }

                meshData.indices = new Int16Array(arrayBuffer, indicesBufferView.byteOffset, indexCount);
                meshData.indexCount = indexCount;

                if(colorIndices.length > 0) {
                  meshData.customBuffers = [];
                  // Assumed componentType = 5126 => Float32, type = "VEC4" => count * 4
                  for (let i = 0, l = colorIndices.length; i < l; i++) {
                    meshData.customBuffers.push({
                      name: "COLOR_" + i,
                      buffer: new Float32Array(arrayBuffer, colorsBufferViews[i].byteOffset, colorsCounts[i] * 4),
                      count: colorsCounts[i],
                      componentType: 5126,
                      size: 4
                    });
                  }
                }

                callback({ meshData: [ meshData ]});

            }).catch(function(error) {
                console.error("Unable to fetch data buffer from model");
            });

        }).catch(function(error) {
            console.error("Unable to load model at " + uri);
        });
    };

    return exports;
})();
