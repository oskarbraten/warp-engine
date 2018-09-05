/**
 * Camera
 * A simple SceneGraph node.
 */

import { vec3, mat4, quat } from 'gl-matrix';

const TYPE = {
    PERSPECTIVE: 'perspective',
    ORTHOGRAPHIC: 'orthographic'
};

export default ({ type = 'perspective', orthographic = null, perspective = null, name = null }) => {
    
    return {
        type,
        orthographic,
        perspective,
        name
    };
    
};