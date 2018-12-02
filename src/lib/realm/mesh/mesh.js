/**
 * Mesh
 * A drawable collection of primitives.
 */

export default (primitives, node, name = null) => {

    return {
        name,
        node,
        primitives, // An array of primitives, each defining geometry to be rendered with a material.
    };
    
};