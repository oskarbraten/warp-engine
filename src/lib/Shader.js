export default class Shader {
    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        const program = this.constructor.build(gl, vertexShaderSource, fragmentShaderSource);
        gl.useProgram(program);

        // Get standard attribute locations.
        this.attributeLocations = {
            vPosition: gl.getAttribLocation(program, 'vPosition'),
            vNormal: gl.getAttribLocation(program, 'vNormal'),
            vTextureCoordinate: gl.getAttribLocation(program, 'vTextureCoordinate'),
            vTangent: gl.getAttribLocation(program, 'vTangent')
        };

        // Get standard uniform locations.
        this.uniformLocations = {
            projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix')
        };

        this.program = program;
    }

    static compile(gl, source, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw Error(gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    static build(gl, vertexShaderSource, fragmentShaderSource) {
        let vertexShader = this.compile(gl, vertexShaderSource, gl.VERTEX_SHADER);
        let fragmentShader = this.compile(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

        let program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw Error('Could not build shaders.');
        }

        return program;
    }
}