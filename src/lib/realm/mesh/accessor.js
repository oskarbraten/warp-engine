/**
 * Accessor
 * All large data for meshes, skins, and animations is stored in buffers and retrieved via accessors.
 */

// constants:
// const componentType = {
//     BYTE: 5120,
//     UNSIGNED_BYTE: 5121,
//     SHORT: 5122,
//     UNSIGNED_SHORT: 5123,
//     UNSIGNED_INT: 5125,
//     FLOAT: 5126
// };

// const type = {
//     SCALAR: 1,
//     VEC2: 2,
//     VEC3: 3,
//     VEC4: 4,
//     MAT2: 4,
//     MAT3: 9,
//     MAT4: 16
// };

export default (bufferView, componentType, type, count, min, max, byteOffset = 0, normalized = false) => {

    return {
        bufferView,

        type,
        componentType,

        byteOffset,
        count,

        min,
        max,

        normalized
    };

};