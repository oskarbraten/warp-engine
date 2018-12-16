/**
 * Sampler
 */

export default ({

    magFilter = 9728,
    minFilter = 9986,
    wrapS = 10497,
    wrapT = 10497,

} = {}, name = null) => {

    return {
        magFilter,
        minFilter,
        wrapS,
        wrapT,
        name,
        extras: {}
    };
    
};