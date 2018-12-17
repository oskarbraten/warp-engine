
export const GLTF_VERSION = '2.0';

export const MAX_LIGHTS = 500;

export const ALPHA_MODE = {
    OPAQUE: 0,
    MASK: 1,
    BLEND: 2
};

export const COMPONENT = Object.freeze({
    SIZE: Object.freeze({
        '5120': 1,
        '5121': 1,
        '5122': 2,
        '5123': 2,
        '5125': 4,
        '5126': 4
    }),
    TYPE: Object.freeze({
        BYTE: 5120,
        UNSIGNED_BYTE: 5121,
        SHORT: 5122,
        UNSIGNED_SHORT: 5123,
        UNSIGNED_INT: 5125,
        FLOAT: 5126
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
    TANGENT: 2,
    TEXCOORD_0: 3,
    TEXCOORD_1: 4,
    COLOR_0: 5,
    JOINTS_0: 6,
    WEIGHTS_0: 7,
});

export const VALID_ACCESSOR_TYPES = Object.freeze({
    INDEX: { type: ['SCALAR'], componentType: [COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT, COMPONENT.TYPE.UNSIGNED_INT] },
    POSITION: { type: ['VEC3'], componentType: [COMPONENT.TYPE.FLOAT] },
    NORMAL: { type: ['VEC3'], componentType: [COMPONENT.TYPE.FLOAT] },
    TANGENT: { type: ['VEC4'], componentType: [COMPONENT.TYPE.FLOAT] },
    TEXCOORD_0: { type: ['VEC2'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    TEXCOORD_1: { type: ['VEC2'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    COLOR_0: { type: ['VEC3', 'VEC4'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    JOINTS_0: { type: ['VEC4'], componentType: [COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] },
    WEIGHTS_0: { type: ['VEC4'], componentType: [COMPONENT.TYPE.FLOAT, COMPONENT.TYPE.UNSIGNED_BYTE, COMPONENT.TYPE.UNSIGNED_SHORT] }
});

export const TARGET = Object.freeze({
    ELEMENT_ARRAY_BUFFER: 34963,
    ARRAY_BUFFER: 34962
});