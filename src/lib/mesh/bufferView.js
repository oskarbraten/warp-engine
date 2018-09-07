/**
 * BufferView
 * A bufferView represents a subset of data in a buffer, defined by an integer offset into the buffer specified in the byteOffset property and a byteLength property to specify length of the buffer view.
 */

// constants:
// setting the target allows the runtime to upload the bufferView to the GPU without having to infer it from the accessors.
// const target = {
//     ELEMENT_ARRAY_BUFFER: 34963,
//     ARRAY_BUFFER: 34962
// };

export default (buffer, byteLength, byteOffset = 0, target = target.ARRAY_BUFFER, byteStride = 0) => {

    return {
        buffer, // Javascript ArrayBuffer (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)

        byteLength,
        byteOffset,
        byteStride, // int: [4, 252], default: 0 (tightly packed)

        target
    };
    
};