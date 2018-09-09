/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */

import { mat4 } from 'gl-matrix';

export default ({ xmag = 1.0, ymag = 1.0, zfar = 100, znear = 0 }, name = null) => {

    return {
        
        type: 'orthographic',
        orthographic: {
            xmag,
            ymag,
            zfar,
            znear
        },
        perspective: null,
        name,

        projectionMatrix: mat4.ortho(mat4.create(), -xmag, xmag, -ymag, ymag, znear, zfar),
        
        updateProjectionMatrix() {
            const { xmag, ymag, zfar, znear } = this.orthographic;
            this.projectionMatrix = mat4.ortho(this.projectionMatrix, -xmag, xmag, -ymag, ymag, znear, zfar);
        }

    };

};