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

    createDirectional(color = vec3.fromValues(1.0, 1.0, 1.0), intensity) {

        return create({
            type: LIGHT.DIRECTIONAL,
            color,
            intensity
        });

    },
    
    createPoint(color = vec3.fromValues(1.0, 1.0, 1.0), intensity, range) {

        return create({
            type: LIGHT.POINT,
            color,
            intensity,
            range
        });

    },

    createSpot(color = vec3.fromValues(1.0, 1.0, 1.0), intensity, range, innerConeAngle = 0.0, outerConeAngle = (Math.PI / 4.0)) {
        
        const angleScale = 1.0 / Math.max(0.001, Math.cos(innerConeAngle) - Math.cos(outerConeAngle));
        const angleOffset = (-Math.cos(outerConeAngle)) * angleScale;
        
        return create({
            type: LIGHT.SPOT,
            color,
            intensity,
            range,
            spot: {
                innerConeAngle,
                outerConeAngle,
                angleScale,
                angleOffset
            }
        });

    }

};