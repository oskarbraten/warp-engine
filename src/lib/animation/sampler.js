
import { ANIMATION_INTERPOLATION } from '../core/constants';

/**
 * Returns a new animation sampler.
 * @param  {integer} input The index of an accessor containing keyframe input values, e.g., time.
 * @param  {integer} output The index of an accessor containing keyframe output values.
 * @param  {integer} interpolation Interpolation algorithm, default is LINEAR.
 */
export default (input, output, interpolation = ANIMATION_INTERPOLATION.LINEAR) => {
    return {

        input,
        output,
        interpolation
        
    };
};
