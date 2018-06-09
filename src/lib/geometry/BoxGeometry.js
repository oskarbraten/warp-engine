/**
 * Generates a simple cube.
 */

import { vec4, vec3, vec2 } from 'gl-matrix';

export default class BoxGeometry {
    constructor({ flipNormals = false } = {}) {

        this.type = 'BoxGeometry' + '_f=' + (flipNormals ? 't' : 'f');

        this.vertices = new Float32Array(24 * 4);
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

            for (let j = 0; j < 4; j++) {
                this.vertices[(f * 4 * 4) + (0 * 4) + j] = a[j];
                this.vertices[(f * 4 * 4) + (1 * 4) + j] = b[j];
                this.vertices[(f * 4 * 4) + (2 * 4) + j] = c[j];
                this.vertices[(f * 4 * 4) + (3 * 4) + j] = d[j];
            }

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
            let ab = vec4.subtract(vec4.create(), a, b);
            let bc = vec4.subtract(vec4.create(), b, c);
            let normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), ab, bc));
            normals.push(normal, normal, normal, normal); // same normal for every vertex in this face.
        }

        this.normals = new Float32Array(normals.reduce((acc, vert) => acc.concat(...vert), []));
        this.uvs = new Float32Array(uvs.reduce((acc, vert) => acc.concat(...vert), []));
        this.indices = new Uint8Array(indices);
        // this.tangents = new Array(this.vertices.length);

        // for (let i = 0; i < this.indices.length; i += 3) {
        //     let i0 = this.indices[i + 0];
        //     let i1 = this.indices[i + 1];
        //     let i2 = this.indices[i + 2];

        //     let a = this.vertices[i0];
        //     let b = this.vertices[i1];
        //     let c = this.vertices[i2];

        //     let h = this.uvs[i0];
        //     let k = this.uvs[i1];
        //     let l = this.uvs[i2];

        //     if (!this.tangents[i0]) {
        //         let n = this.normals[i0];
        //         this.tangents[i0] = this.constructor.calcTangent(a, b, c, h, k, l, n);
        //     }

        //     if (!this.tangents[i1]) {
        //         let n = this.normals[i1];
        //         this.tangents[i1] = this.constructor.calcTangent(b, c, a, k, l, h, n);
        //     }

        //     if (!this.tangents[i2]) {
        //         let n = this.normals[i2];
        //         this.tangents[i2] = this.constructor.calcTangent(c, a, b, l, h, k, n);
        //     }
        // }
    }

    // static calcTangent(p0, p1, p2, h, k, l, n) {
    //     // generate tangent.
    //     let D = subtract(p1, p0);
    //     let E = subtract(p2, p0);

    //     let F = subtract(k, h);
    //     let G = subtract(l, h);

    //     let M = 1 / (F[0] * G[1] - F[1] * G[0]);

    //     let GF = mat3(G[1], -F[1], 0, -G[0], F[0], 0, 0, 0, 0);
    //     let DE = mat3(D[0], D[1], D[2], E[0], E[1], E[2], 0, 0, 0);

    //     let TU = mult(GF, DE);

    //     let T = mult(M, vec3(...TU[0]));
    //     let U = mult(M, vec3(...TU[1]));

    //     //let tangent = normalize(subtract(T, mult(dot(n, T), n)));

    //     return T;
    // }
}