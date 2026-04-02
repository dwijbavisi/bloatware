# WebGL: Rendering a Simple 2D Square

This experiment demonstrates the absolute basics of WebGL: setting up a canvas,
defining vertex and fragment shaders, and rendering a static 2D square.
There are no gradients, no animation, and no 3D effects-just a plain colored
square.

<canvas id="glcanvas" width="400" height="400" style="border:1px solid #ccc;"></canvas>

<!-- Vertex Shader -->
<script id="vertex-shader" type="x-shader/x-vertex">
attribute vec2 a_position;
void main(void) {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
</script>

<!-- Fragment Shader -->
<script id="fragment-shader" type="x-shader/x-fragment">
void main(void) {
    gl_FragColor = vec4(0.2, 0.6, 0.9, 1.0); // Solid blue-ish color
}
</script>

<script>
function getShader(gl, id) {
    const script = document.getElementById(id);
    const shaderString = script.text.trim();
    let shader;
    if (script.type === "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else if (script.type === "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, shaderString);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compile error: " + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

window.onload = function() {
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
        alert("WebGL not supported");
        return;
    }

    // Compile shaders
    const vertexShader = getShader(gl, "vertex-shader");
    const fragmentShader = getShader(gl, "fragment-shader");

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialize shaders");
        return;
    }
    gl.useProgram(program);

    // Square vertices (two triangles)
    const vertices = new Float32Array([
        -0.5, -0.5,
         0.5, -0.5,
         0.5,  0.5,
        -0.5, -0.5,
         0.5,  0.5,
        -0.5,  0.5
    ]);

    // Create buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Bind attribute
    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Draw
    gl.clearColor(1, 1, 1, 1); // White background
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};
</script>


---

- **Author**: Dwij Bavisi <<dwij.bavisi@crabwire.net>>
- **Published**: April 02, 2026, Project bloatware
- **Conceived**: April 02, 2026, Thursday was boring so wanted to have fun...
