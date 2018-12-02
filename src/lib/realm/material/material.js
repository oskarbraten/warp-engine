/**
 * Material
 * The material appearance of a primitive.
 */

import { vec3 } from 'gl-matrix';
import createPbrMetallicRoughness from './pbrMetallicRoughness';

export default ({

    pbrMetallicRoughness = createPbrMetallicRoughness(),

    normalTexture = null,
    occulsionTexture = null,
    emissiveTexture = null,
    emissiveFactor = vec3.create(),

    alphaMode = 'opaque',
    alphaCutoff = 0.5,
    doubleSided = false

}, name = null) => {

    return {
        pbrMetallicRoughness,
        normalTexture,
        occulsionTexture,
        emissiveTexture,
        emissiveFactor,
        alphaMode,
        alphaCutoff,
        doubleSided,
        name,
        extras: {}
    };
    
};