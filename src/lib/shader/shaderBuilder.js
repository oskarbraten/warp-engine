function compile(gl, source, type) {

    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw Error(gl.getShaderInfoLog(shader));
    }

    return shader;
    
}

export default (gl, vertexShaderSource, fragmentShaderSource) => {

    let vertexShader = compile(gl, vertexShaderSource, gl.VERTEX_SHADER);
    let fragmentShader = compile(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    let program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw Error('Error when building shaders.');
    }

    return program;

};