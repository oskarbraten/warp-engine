
/**
 * @param  {integer} sampler The index of a sampler in this animation used to compute the value for the target.
 * @param  {integer} node The index of the node.
 * @param  {integer} path TRS property to target.
 */
export default (sampler, node = null, path) => {
    return {

        sampler,
        node,
        path
        
    };
};
