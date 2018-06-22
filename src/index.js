/**
 * Warp
 * A super simple WebGL2 javascript library.
 * Written by Oskar Bråten, 13/10/2017.
 * ported to webpack and gl-matrix, 07/06/2018
 */

/**
 * TODO:
 * 	- Generalize material drawing pipeline.				[ ]
 * 	- Add support for custom materials with shaders.	[ ]
 * 	- Make camera a valid scene node.					[ ]
 * 	- Implement proper primitive geometry classes.		[x]
 * 	- Add support for indexing.							[x]
 * 	- Add support for multitexturing.					[ ]
 * 	- Add support for light sources. 					[x]
 * 	- Rewrite lighting with UBO.						[ ]
 * 	- Improve performance by presorting scene 			[ ]
 * 	- Improve performance by sorting SceneGraph			[ ]
 */

export { default as Node } from './lib/Node';
export { default as Mesh } from './lib/Mesh';
export { default as Scene } from './lib/Scene';
export { default as BoxGeometry } from './lib/geometry/BoxGeometry';
export { default as BasicMaterial } from './lib/shading/BasicMaterial';
export { default as Renderer } from './lib/Renderer';
export { default as PerspectiveCamera } from './lib/camera/PerspectiveCamera';

import Node from './lib/Node';
import Mesh from './lib/Mesh';
import Scene from './lib/Scene';
import BoxGeometry from './lib/geometry/BoxGeometry';
import BasicMaterial from './lib/shading/BasicMaterial';
import Renderer from './lib/Renderer';
import PerspectiveCamera from './lib/camera/PerspectiveCamera';

const Warp = {
    Node,
    Mesh,
    Scene,
    BoxGeometry,
    BasicMaterial,
    Renderer,
    PerspectiveCamera
};

import BarkImage from './misc/bark.jpg';

//Create renderer and canvas element, append canvas to DOM.
let renderer = new Warp.Renderer(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// SCENEGRAPH:
let scene = new Warp.Scene();

let boxGeometry = new Warp.BoxGeometry();

let basicMaterial = new Warp.BasicMaterial({
    map: renderer.loadTexture(BarkImage),
});

let size = 20;
let heightSpread = 10;

for (let i = 0; i < size; i += 2) {
    for (let j = 0; j < size; j += 2) {
        let woodBlock = new Warp.Mesh(boxGeometry, basicMaterial);
        woodBlock.translate(i - size / 2, -3 + (Math.random() * heightSpread - (heightSpread / 2)), j - size / 2);
        scene.add(woodBlock);
    }
}


// CAMERA SETUP --------------

let camera = new Warp.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position[2] = -6;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);


// setup controls:
let canvas = renderer.domElement;

canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

let yaw = 0;
let pitch = 0;

function updateCamRotation(event) {
    yaw += event.movementX * 0.01;
    pitch += event.movementY * 0.01;
}

document.addEventListener('pointerlockchange', (event) => {
    if (document.pointerLockElement === canvas) {
        canvas.addEventListener('mousemove', updateCamRotation, false);
    } else {
        canvas.removeEventListener('mousemove', updateCamRotation, false);
    }
});

let move = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    speed: 0.01
};

window.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.code === 'KeyW') {
        move.forward = true;
    } else if (e.code === 'KeyS') {
        move.backward = true;
    } else if (e.code === 'KeyA') {
        move.left = true;
    } else if (e.code === 'KeyD') {
        move.right = true;
    }
});

window.addEventListener('keyup', (e) => {
    e.preventDefault();
    if (e.code === 'KeyW') {
        move.forward = false;
    } else if (e.code === 'KeyS') {
        move.backward = false;
    } else if (e.code === 'KeyA') {
        move.left = false;
    } else if (e.code === 'KeyD') {
        move.right = false;
    }
});

// CAMERA SETUP END ----------
let prevTimestamp = 0;
function loop(timestamp) {

    let deltaTimestamp = timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    let seconds = timestamp / 1000;
    let diffSeconds = deltaTimestamp / 1000;

    // camera.yaw(yaw);
    // camera.pitch(pitch);

    // yaw = 0;
    // pitch = 0;

    // if (move.forward) {
    //     camera.move(0, 0, move.speed);
    // }
    // if (move.backward) {
    //     camera.move(0, 0, -move.speed);
    // }
    // if (move.left) {
    //     camera.move(-move.speed, 0, 0);
    // }
    // if (move.right) {
    //     camera.move(move.speed, 0, 0);
    // }

    // camera.update(deltaTimestamp);

    // Update the world matrices of the entire scene graph (Since we are starting at the root node).
    scene.tick();
    renderer.render(scene, camera);

    // Ask the the browser to draw when it's convenient
    window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);