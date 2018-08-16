import { mat4, vec3 } from 'gl-matrix';


/**
 * Camera. A basic camera object.
 * FPS version. Only pitch and yaw, with clamping.
 */

export default class FPSCameraController {
    constructor(position = vec3.fromValues(0, 0, 0)) {
        this.position = position;

        this._FD = vec3.fromValues(0, 0, 1);
        this._UD = vec3.fromValues(0, 1, 0);

        this.viewMatrix = mat4.create();

        /**
         * Total rotation in euler angles.
         * @type {Object}
         */

        this._rotation = {
            u: 0, // pitch, x
            v: 0, // yaw, y
            n: 0  // roll, z
        };

        /**
         * Amount to rotate this step.
         * @type {Object}
         */
        this._rotate = {
            u: 0, // pitch, x
            v: 0, // yaw, y
            n: 0  // roll, z
        };

        /**
         * Amount to move this step.
         * @type {Object}
         */
        this._move = {
            u: 0, // x
            v: 0, // y
            n: 0  // z
        };
    }

    /**
     * Rotate around the v-axis.
     * @param  {float} angle Angle in degrees added to the current rotation.
     * @return {void}
     */
    yaw(angle) {
        this._rotate.v += angle;
    }

    /**
     * Rotate around the u-axis
     * @param  {float} angle Angle in degress added to the current rotation.
     * @return {void}
     */
    pitch(angle) {
        this._rotate.u += angle;
    }

    /**
     * Move along u, v & n.
     * @param  {float} dv Distance to move up/down along the v-axis (y).
     * @param  {float} du Distance to move right/left along the u-axis (x).
     * @param  {float} dn Distance to move forwards/backwards along the n-axis (z).
     * @return {[void]}
     */
    move(du = 0, dv = 0, dn = 0) {
        this._move.u += du;
        this._move.v += dv;
        this._move.n += dn;
    }

    update(delta) {
        // add rotation.
        this._rotation.v = (this._rotation.v + (this._rotate.v * delta)) % (Math.PI*2);

        if (this._rotation.u + (this._rotate.u * delta) > -(Math.PI / 2) && this._rotation.u + (this._rotate.u * delta) < (Math.PI / 2)) {
            this._rotation.u += this._rotate.u * delta;
        }

        this._rotation.n += this._rotate.n * delta;

        // reset rotational inputs.
        this._rotate.v = 0;
        this._rotate.u = 0;
        this._rotate.n = 0;

        let forwardDirection = vec3.fromValues(0, 0, 1);
        let upDirection = vec3.fromValues(0, 1, 0);

        // YAW:
        let yawRotation = mat4.fromRotation(mat4.create(), this._rotation.v, this._UD);
        vec3.normalize(forwardDirection, vec3.transformMat4(forwardDirection, this._FD, yawRotation));

        // PITCH:
        let pitchRotation = mat4.fromRotation(mat4.create(), this._rotation.u, vec3.cross(vec3.create(), forwardDirection, this._UD));
        vec3.normalize(forwardDirection, vec3.transformMat4(forwardDirection, forwardDirection, pitchRotation));
        vec3.normalize(upDirection, vec3.transformMat4(upDirection, this._UD, pitchRotation));

        this._move.v *= delta;
        this._move.u *= delta;
        this._move.n *= delta;

        // move camera.
        let forwardStep = vec3.scale(vec3.create(), forwardDirection, this._move.n);
        vec3.add(this.position, this.position, forwardStep);

        let upStep = vec3.scale(vec3.create(), upDirection, this._move.v);
        vec3.add(this.position, this.position, upStep);

        let sideStep = vec3.scale(vec3.create(), vec3.normalize(vec3.create(), vec3.cross(vec3.create(), forwardDirection, upDirection)), this._move.u);
        vec3.add(this.position, this.position, sideStep);

        // reset move distances.
        this._move.n = 0;
        this._move.v = 0;
        this._move.u = 0;

        mat4.lookAt(this.viewMatrix, this.position, vec3.add(vec3.create(), this.position, forwardDirection), upDirection);
    }
}