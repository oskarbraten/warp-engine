/**
 * pbrMetallicRoughness
 * A set of parameter values that are used to define the metallic-roughness material model
 * from Physically-Based Rendering (PBR) methodology.
 */

import { vec4 } from 'gl-matrix';

export default ({

    baseColorFactor = vec4.fromValues(1.0, 1.0, 1.0, 1.0),
    baseColorTexture = null,
    metallicFactor = 1.0,
    roughnessFactor = 1.0,
    metallicRoughnessTexture = null

}, name = null, extras = {}) => {

    return {
        baseColorFactor,
        baseColorTexture,
        metallicFactor,
        roughnessFactor,
        metallicRoughnessTexture,
        name,
        extras
    };

};