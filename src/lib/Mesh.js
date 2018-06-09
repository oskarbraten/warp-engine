/**
 * Mesh
 * A drawable Node with material and geometry.
 */

import Node from './Node';

function uuid() { // v4
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export default class Mesh extends Node {
    constructor(geometry, material) {
        super();
        this.isMesh = true;
        this.drawable = null; // used for caching drawable.

        // TODO: alternative id generator?
        this.uuid = uuid();

        this.geometry = geometry;
        this.material = material;
    }
}