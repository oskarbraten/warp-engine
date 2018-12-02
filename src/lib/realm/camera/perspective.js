/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */

import { mat4 } from 'gl-matrix';

export default ({ aspectRatio, yfov = 1.0472, zfar = null, znear = 1.0}, name = null ) => {

    return {
        
        type: 'perspective',
        perspective: {
            aspectRatio,
            yfov,
            zfar,
            znear
        },
        orthographic: null,
        name,

        projectionMatrix: mat4.perspective(mat4.create(), yfov, aspectRatio, znear, zfar),

        updateProjectionMatrix() {
            const { aspectRatio, yfov, zfar, znear } = this.perspective;
            this.projectionMatrix = mat4.perspective(mat4.create(), yfov, aspectRatio, znear, zfar);
        }

    };

};