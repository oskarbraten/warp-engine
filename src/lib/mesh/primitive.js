/**
 * Primitive
 * Geometry to be rendered with the given material.
 */

export default (attributes, mode = 4, material, indices = null) => {

    return {
        attributes,
        indices, // if defined use drawElements, else drawArrays
        material,
        mode,
        extras: {}
    };
    
};