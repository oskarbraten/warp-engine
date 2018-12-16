/**
 * Texture
 */

export default ({

    source = null,
    sampler = null

}, name = null) => {

    return {
        source,
        sampler,
        name,
        extras: {}
    };
    
};