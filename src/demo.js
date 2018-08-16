import { mat4 } from 'gl-matrix';

import Warp from './index';

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
camera.translate(0, 0, 16);

import FPSCameraController from './lib/controls/FPSCameraController';

let cameraController = new FPSCameraController();

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
    yaw += event.movementX * 0.0001;
    pitch += event.movementY * 0.0001;
}

document.addEventListener('pointerlockchange', () => {
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

let t = new Warp.Mesh(boxGeometry, basicMaterial);

let t2 = new Warp.Mesh(boxGeometry, basicMaterial);
t2.translate(5, 0, 0);

t.add(t2);
scene.add(t);


let then = 0;
function loop(now) {

    const delta = now - then;
    then = now;


    cameraController.yaw(-yaw);
    cameraController.pitch(-pitch);

    yaw = 0;
    pitch = 0;

    if (move.forward) {
        cameraController.move(0, 0, move.speed);
    }
    if (move.backward) {
        cameraController.move(0, 0, -move.speed);
    }
    if (move.left) {
        cameraController.move(-move.speed, 0, 0);
    }
    if (move.right) {
        cameraController.move(move.speed, 0, 0);
    }

    cameraController.update(delta);

    mat4.copy(camera.viewMatrix, cameraController.viewMatrix);

    t.rotateY(0.001 * delta);
    t2.rotateY(-0.004 * delta);

    // Update the world matrices of the entire scene graph (Since we are starting at the root node).

    scene.tick();
    renderer.render(scene, camera);

    // Ask the the browser to draw when it's convenient
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);