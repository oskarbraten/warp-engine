
export const GLTF_VERSION = '2.0';

// BYTE
// UNSIGNED_BYTE
// SHORT
// UNSIGNED_SHORT
// UNSIGNED_INT
// FLOAT (Convert JSON-parsed floating-point doubles to single precision with Math.fround)

export const COMPONENT = Object.freeze({
    SIZE: Object.freeze({
        BYTE: 1,
        UNSIGNED_BYTE: 1,
        SHORT: 2,
        UNSIGNED_SHORT: 2,
        UNSIGNED_INT: 4,
        FLOAT: 4
    }),
    TYPE: Object.freeze({
        BYTE: 5120,
        UNSIGNED_BYTE: 5121,
        SHORT: 5122,
        UNSIGNED_SHORT: 5123,
        UNSIGNED_INT: 5125,
        FLOAT: 5126
    })
});

export const TYPE = Object.freeze({
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
});


export const POSITION_LOCATION = 0;
export const UV_LOCATION = 1;