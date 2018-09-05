/**
 * Mesh
 * A drawable collection of primitives.
 */

export default (primitives, name = null) => {
    return {
        primitives: primitives, // An array of primitives, each defining geometry to be rendered with a material.
        name: name
    };
};