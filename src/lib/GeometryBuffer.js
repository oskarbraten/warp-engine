
/**
 * GeometryBuffer
 * An object for conveniently storing geometry.
 */

export default class GeometryBuffer {

    static concatenateBuffers(buffers) {

        // helper function.
        function sum(a) {
            return a.reduce((a, b) => a + b, 0);
        }

        let lengths = buffers.map((a) => a.length);
        let aout = new Float32Array(sum(lengths));

        for (let i = 0; i < buffers.length; ++i) {
            var start = sum(lengths.slice(0, i));
            aout.set(buffers[i], start); // copy buffers[i] to aout at start position
        }

        return aout;

    }

    constructor(gl, geometry) {

        this.type = geometry.type;
        this.numberOfVertices = geometry.vertices.length;

        // ELEMENT ARRAY BUFFER
        if (geometry.indices !== undefined) {
            this.elementArrayBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementArrayBuffer);

            let indices;

            // TODO: just use geometry index array type directly
            // Set size of each index dynamically based on number of vertices.
            if (this.numberOfVertices < Math.pow(2, 8)) {
                this.indexType = gl.UNSIGNED_BYTE;
                indices = new Uint8Array(geometry.indices);
            } else if (this.numberOfVertices < Math.pow(2, 16)) {
                this.indexType = gl.UNSIGNED_SHORT;
                indices = new Uint16Array(geometry.indices);
            } else {
                this.indexType = gl.UNSIGNED_INT;
                indices = new Uint32Array(geometry.indices);
            }

            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            this.indexed = true;
            this.numberOfElements = geometry.indices.length;
        }

        // ARRAY BUFFER
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        let arrays = [];

        if (geometry.vertices !== undefined) {
            arrays.push(geometry.vertices);
            this.bufferNormalsOffset = geometry.vertices.length * (4 * 4); // 4 components of 4 bytes (32-bit).
        } else {
            throw Error('WarpGL: Unable to create geometry buffer! Provided geometry must contain vertices.');
        }

        this.bufferUvsOffset = this.bufferNormalsOffset;
        if (geometry.normals !== undefined) {
            arrays.push(geometry.normals);
            this.hasNormals = true;
            this.bufferUvsOffset += geometry.normals.length * (3 * 4); // 3 components of 4 bytes (32-bit).
        }

        this.bufferTangentsOffset = this.bufferUvsOffset;
        if (geometry.uvs !== undefined) {
            arrays.push(geometry.uvs);
            this.hasUvs = true;
            this.bufferTangentsOffset += geometry.uvs.length * (2 * 4); // 2 components of 4 bytes (32-bit).
        }

        if (geometry.tangents !== undefined) {
            arrays.push(geometry.tangents);
            this.hasTangents = true;
        }

        let data = GeometryBuffer.concatenateBuffers(arrays);

        // transfer to buffer.
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        
    }

}