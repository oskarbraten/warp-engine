/**
 * Material
 * The material appearance of a primitive.
 */

import { ALPHA_MODE } from '../core/constants';
import { vec3 } from 'gl-matrix';
import { vec4 } from 'gl-matrix';

export default ({

    baseColorFactor = vec4.fromValues(1.0, 1.0, 1.0, 1.0),
    baseColorTexture = null,
    metallicFactor = 1.0,
    roughnessFactor = 1.0,
    metallicRoughnessTexture = null,

    normalTexture = null,
    occulsionTexture = null,
    emissiveTexture = null,
    emissiveFactor = vec3.create(),

    alphaMode = 'OPAQUE',
    alphaCutoff = 0.5,
    doubleSided = false

} = {}, name = null) => {

    return {
        baseColorFactor,
        baseColorTexture,
        metallicFactor,
        roughnessFactor,
        metallicRoughnessTexture,

        normalTexture,
        occulsionTexture,
        emissiveTexture,
        emissiveFactor,

        alphaMode: ALPHA_MODE[alphaMode],
        alphaCutoff,
        doubleSided,

        name,
        extras: {}
    };
    
};

