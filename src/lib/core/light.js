import { LIGHT } from './constants';
import { vec3 } from 'gl-matrix';

function create({
    type = LIGHT.POINT,
    color = vec3.fromValues(1.0, 1.0, 1.0),
    intensity = 1.0,
    range = 20.0,
    spot = null
}) {

    return {
        type,
        color,
        intensity,
        range,
        spot
    };

}

export default {
    
    createPoint(color = vec3.fromValues(1.0, 1.0, 1.0), intensity = 1.0, range = 20.0) {
        return create({
            type: LIGHT.POINT,
            color,
            intensity,
            range
        });
    },
    
    createDirectional(color = vec3.fromValues(1.0, 1.0, 1.0), intensity = 1.0, range = 20.0) {
        return create({
            type: LIGHT.DIRECTIONAL,
            color,
            intensity,
            range
        });
    }

};