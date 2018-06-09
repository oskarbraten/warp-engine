/**
 * Generates a simple cube.
 */

import { vec4, vec3, vec2 } from 'gl-matrix';

export default class BoxGeometry {

    constructor({ flipNormals = false } = {}) {

        this.type = 'BoxGeometry' + '_f=' + (flipNormals ? 't' : 'f');

        let vertices = [];
        let uvs = [];
        let normals = [];
        let indices = [];

        let baseVertices = [
            vec4.fromValues(-0.5, -0.5, 0.5, 1.0),
            vec4.fromValues(-0.5, 0.5, 0.5, 1.0),
            vec4.fromValues(0.5, 0.5, 0.5, 1.0),
            vec4.fromValues(0.5, -0.5, 0.5, 1.0),
            vec4.fromValues(-0.5, -0.5, -0.5, 1.0),
            vec4.fromValues(-0.5, 0.5, -0.5, 1.0),
            vec4.fromValues(0.5, 0.5, -0.5, 1.0),
            vec4.fromValues(0.5, -0.5, -0.5, 1.0)
        ];

        let faces = [
            [1, 0, 3, 2],
            [2, 3, 7, 6],
            [3, 0, 4, 7],
            [6, 5, 1, 2],
            [4, 5, 6, 7],
            [5, 4, 0, 1]
        ];

        for (let f = 0; f < faces.length; ++f) {

            // generate vertices.
            let a = baseVertices[faces[f][0]];
            let b = baseVertices[faces[f][1]];
            let c = baseVertices[faces[f][2]];
            let d = baseVertices[faces[f][3]];
            vertices.push(a, b, c, d);

            // generate indices.
            let offset = f * 4;
            if (flipNormals) {
                indices.push(offset, offset + 2, offset + 1); // face 1 reversed
                indices.push(offset, offset + 3, offset + 2); // face 2 reversed
            } else {
                indices.push(offset, offset + 1, offset + 2); // face 1
                indices.push(offset, offset + 2, offset + 3); // face 2
            }

            // generate uvs.
            let h = vec2.fromValues(0, 0);
            let k = vec2.fromValues(1, 0);
            let l = vec2.fromValues(1, 1);
            let m = vec2.fromValues(0, 1);
            uvs.push(h, k, l, m);

            // generate normals.
            let ab = vec3.fromValues(...vec4.subtract(vec4.create(), a, b));
            let bc = vec3.fromValues(...vec4.subtract(vec4.create(), b, c));
            let normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), ab, bc));
            normals.push(normal, normal, normal, normal); // same normal for every vertex in this face.
        }

        this.vertices = vertices.reduce((acc, vert) => acc.concat(...vert), []);
        this.normals = normals.reduce((acc, vert) => acc.concat(...vert), []);
        this.uvs = uvs.reduce((acc, vert) => acc.concat(...vert), []);
        this.indices = indices;

    }

    // constructor({ flipNormals = false } = {}) {

    //     this.type = 'BoxGeometry' + '_f=' + (flipNormals ? 't' : 'f');

    //     this.vertices = new Float32Array(24 * 4);
    //     let uvs = [];
    //     let normals = [];
    //     let indices = [];

    //     let baseVertices = [
    //         vec4.fromValues(-0.5, -0.5, 0.5, 1.0),
    //         vec4.fromValues(-0.5, 0.5, 0.5, 1.0),
    //         vec4.fromValues(0.5, 0.5, 0.5, 1.0),
    //         vec4.fromValues(0.5, -0.5, 0.5, 1.0),
    //         vec4.fromValues(-0.5, -0.5, -0.5, 1.0),
    //         vec4.fromValues(-0.5, 0.5, -0.5, 1.0),
    //         vec4.fromValues(0.5, 0.5, -0.5, 1.0),
    //         vec4.fromValues(0.5, -0.5, -0.5, 1.0)
    //     ];

    //     let faces = [
    //         [1, 0, 3, 2],
    //         [2, 3, 7, 6],
    //         [3, 0, 4, 7],
    //         [6, 5, 1, 2],
    //         [4, 5, 6, 7],
    //         [5, 4, 0, 1]
    //     ];

    //     for (let f = 0; f < faces.length; ++f) {

    //         // generate vertices.
    //         let a = baseVertices[faces[f][0]];
    //         let b = baseVertices[faces[f][1]];
    //         let c = baseVertices[faces[f][2]];
    //         let d = baseVertices[faces[f][3]];

    //         for (let j = 0; j < 4; j++) {
    //             this.vertices[(f * 4 * 4) + (0 * 4) + j] = a[j];
    //             this.vertices[(f * 4 * 4) + (1 * 4) + j] = b[j];
    //             this.vertices[(f * 4 * 4) + (2 * 4) + j] = c[j];
    //             this.vertices[(f * 4 * 4) + (3 * 4) + j] = d[j];
    //         }

    //         // generate indices.
    //         let offset = f * 4;
    //         if (flipNormals) {
    //             indices.push(offset, offset + 2, offset + 1); // face 1 reversed
    //             indices.push(offset, offset + 3, offset + 2); // face 2 reversed
    //         } else {
    //             indices.push(offset, offset + 1, offset + 2); // face 1
    //             indices.push(offset, offset + 2, offset + 3); // face 2
    //         }

    //         // generate uvs.
    //         let h = vec2.fromValues(0, 0);
    //         let k = vec2.fromValues(1, 0);
    //         let l = vec2.fromValues(1, 1);
    //         let m = vec2.fromValues(0, 1);
    //         uvs.push(h, k, l, m);

    //         // generate normals.
    //         let ab = vec4.subtract(vec4.create(), a, b);
    //         let bc = vec4.subtract(vec4.create(), b, c);
    //         let normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), ab, bc));
    //         normals.push(normal, normal, normal, normal); // same normal for every vertex in this face.
    //     }

    //     this.normals = new Float32Array(normals.reduce((acc, vert) => acc.concat(...vert), []));
    //     this.uvs = new Float32Array(uvs.reduce((acc, vert) => acc.concat(...vert), []));
    //     this.indices = new Uint8Array(indices);

    // }
}