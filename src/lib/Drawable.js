/**
 * Drawable
 * A drawable links a mesh to it's buffer and shaderprogram.
 */

export default class Drawable {
    constructor(uuid, geometryBuffer, shader) {
        this.uuid = uuid;
        this.geometryBuffer = geometryBuffer;
        this.shader = shader;
    }
}