/**
 * Material
 * The material appearance of a primitive.
 */

import { ALPHA_MODE } from '../core/constants';
import { vec3, vec4 } from 'gl-matrix';

export default ({

    baseColorFactor = vec4.fromValues(1.0, 1.0, 1.0, 1.0),
    baseColorTexture = null,

    metallicFactor = 1.0,
    roughnessFactor = 1.0,
    metallicRoughnessTexture = null,

    normalTexture = null,
    occlusionTexture = null,
    emissiveTexture = null,
    emissiveFactor = vec3.create(),

    alphaMode = 'OPAQUE',
    alphaCutoff = 0.5,
    doubleSided = false

} = {}, name = null) => {

    return {
        baseColorFactor,
        baseColorTexture, // HAS_BASECOLORMAP

        metallicFactor,
        roughnessFactor,
        metallicRoughnessTexture, // HAS_METALROUGHNESSMAP

        normalTexture, // HAS_NORMALMAP
        occlusionTexture, // HAS_OCCLUSIONMAP
        emissiveTexture, // HAS_EMISSIVEMAP
        emissiveFactor,

        alphaMode: ALPHA_MODE[alphaMode], // TODO: add defines for this as well.
        alphaCutoff,
        doubleSided,

        name,
        extras: {}
    };
    
};
