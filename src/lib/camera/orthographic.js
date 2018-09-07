/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */

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
        name
    };

};