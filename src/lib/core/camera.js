import { mat4 } from 'gl-matrix';
import { PROJECTION } from './constants';

export default {
    createOrthographic(xmag = 1.0, ymag = 1.0, zfar = 100, znear = 0) {
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

        };
    },
    createPerspective(aspectRatio, yfov = 1.0472, zfar = null, znear = 1.0) {
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

        };
    },

    updateProjectionMatrix(camera) {
        if (camera.type === PROJECTION.ORTHOGRAPHIC) {
            const { xmag, ymag, zfar, znear } = camera.orthographic;
            camera.projectionMatrix = mat4.ortho(camera.projectionMatrix, -xmag, xmag, -ymag, ymag, znear, zfar);
        } else {
            const { aspectRatio, yfov, zfar, znear } = camera.perspective;
            camera.projectionMatrix = mat4.perspective(mat4.create(), yfov, aspectRatio, znear, zfar);
        }
    }
};