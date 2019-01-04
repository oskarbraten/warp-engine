/**
 * Primitive
 * Geometry to be rendered with the given material.
 */

import { MODE } from '../core/constants';

export default (attributes, mode = MODE.TRIANGLES, material, indices = null) => {

    return {
        attributes,
        indices, // if defined use drawElements, else drawArrays
        material,
        mode,
        extras: {}
    };
    
};