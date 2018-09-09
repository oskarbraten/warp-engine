
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
    }),
    ARRAY_TYPE: Object.freeze({
        '5120': Int8Array,
        '5121': Uint8Array,
        '5122': Int16Array,
        '5123': Uint16Array,
        '5125': Uint32Array,
        '5126': Float32Array
    }),
    ID: Object.freeze({
        '5120': 'BYTE',
        '5121': 'UNSIGNED_BYTE',
        '5122': 'SHORT',
        '5123': 'UNSIGNED_SHORT',
        '5125': 'UNSIGNED_INT',
        '5126': 'FLOAT'
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

export const PROJECTION = Object.freeze({
    ORTHOGRAPHIC: 'orthographic',
    PERSPECTIVE: 'perspective'
});

export const ATTRIBUTE_LOCATION = Object.freeze({
    POSITION: 0,
    NORMAL: 1,
    TEXCOORD_0: 2,
    JOINTS_0: 3,
    JOINTS_1: 5,
    WEIGHTS_0: 4,
    WEIGHTS_1: 6,
    TANGENT: 7
});

export const VALID_ACCESSOR_TYPES = Object.freeze({
    POSITION: { type: ['VEC3'], componentType: [COMPONENT.TYPE.FLOAT] },
    NORMAL: { type: ['VEC3'], componentType: [COMPONENT.TYPE.FLOAT] },
    TANGENT: { type: ['VEC4'], componentType: [COMPONENT.TYPE.FLOAT] },
    TEXCOORD_0: { type: ['VEC2'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    TEXCOORD_1: { type: ['VEC2'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    COLOR_0: { type: ['VEC3', 'VEC4'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    JOINTS_0: { type: ['VEC4'], componentType: [COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    WEIGHTS_0: { type: ['VEC4'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] }
});