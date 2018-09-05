/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */

export default (aspectRatio, yfov = 1.0472, zfar = null, znear = 1.0) => {

    return {
        aspectRatio,
        yfov,
        zfar,
        znear
    };

};