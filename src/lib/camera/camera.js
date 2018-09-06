/**
 * Camera
 * A simple SceneGraph node.
 */

import { vec3, mat4, quat } from 'gl-matrix';

const TYPE = {
    PERSPECTIVE: 'perspective',
    ORTHOGRAPHIC: 'orthographic'
};


const camera = ({ type = TYPE.PERSPECTIVE, orthographic = null, perspective = null, name = null }) => {
    
    return {
        type,
        orthographic,
        perspective,
        name
    };
    
};


camera.orthographic = ({ xmag = 1.0, ymag = 1.0, zfar = 100, znear = 0 }) => {

    return {
        xmag,
        ymag,
        zfar,
        znear
    };

};

camera.perspective = ({ aspectRatio, yfov = 1.0472, zfar = null, znear = 1.0 }) => {

    return {
        aspectRatio,
        yfov,
        zfar,
        znear
    };

};

export default camera;