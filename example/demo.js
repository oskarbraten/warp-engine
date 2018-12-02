import Warp from '../src/index';
import CameraController from './controls/CameraController';

import gltf_document from './misc/test-instances.gltf';

const realm = Warp.realm(window.innerWidth, window.innerHeight);

document.body.appendChild(realm.gl.canvas);

Warp.importGLTF(gltf_document).then((document) => {

    console.log(document);
    realm.loadFromGLTF(document, true);

    realm.updateTransforms();

    console.log(realm);
    console.log(realm.acquireRenderQueue());

    let then = 0;
    function loop(now) {

        const delta = now - then;
        then = now;

        realm.render(realm.acquireRenderQueue(), realm.nodes[0]);

        window.requestAnimationFrame(loop);
    }

    window.requestAnimationFrame(loop);


    // window.addEventListener('resize', () => {
    //     camera.perspective.aspectRatio = window.innerWidth / window.innerHeight;
    //     camera.updateProjectionMatrix();

    // }, false);

    // let cameraNode = Warp.node({ name: 'Camera', camera });

    // scene.nodes.push(cameraNode);

    // let cameraController = new CameraController(cameraNode);

    // let canvas = renderer.domElement;

    // canvas.addEventListener('click', () => {
    //     canvas.requestPointerLock();
    // });

    // let yaw = 0;
    // let pitch = 0;

    // function updateCamRotation(event) {
    //     yaw += event.movementX * 0.001;
    //     pitch += event.movementY * 0.001;
    // }

    // document.addEventListener('pointerlockchange', () => {
    //     if (document.pointerLockElement === canvas) {
    //         canvas.addEventListener('mousemove', updateCamRotation, false);
    //     } else {
    //         canvas.removeEventListener('mousemove', updateCamRotation, false);
    //     }
    // });

    // let move = {
    //     forward: false,
    //     backward: false,
    //     left: false,
    //     right: false,
    //     speed: 0.01
    // };


    // window.addEventListener('keydown', (e) => {
    //     e.preventDefault();
    //     if (e.code === 'KeyW') {
    //         move.forward = true;
    //     } else if (e.code === 'KeyS') {
    //         move.backward = true;
    //     } else if (e.code === 'KeyA') {
    //         move.left = true;
    //     } else if (e.code === 'KeyD') {
    //         move.right = true;
    //     }
    // });

    // window.addEventListener('keyup', (e) => {
    //     e.preventDefault();
    //     if (e.code === 'KeyW') {
    //         move.forward = false;
    //     } else if (e.code === 'KeyS') {
    //         move.backward = false;
    //     } else if (e.code === 'KeyA') {
    //         move.left = false;
    //     } else if (e.code === 'KeyD') {
    //         move.right = false;
    //     }
    // });


    // let then = 0;
    // function loop(now) {

    //     const delta = now - then;
    //     then = now;

    //     const moveSpeed = move.speed * delta;

    //     let longitudinal = 0;
    //     let lateral = 0;

    //     if (move.forward) {
    //         longitudinal += moveSpeed;
    //     }

    //     if (move.backward) {
    //         longitudinal -= moveSpeed;
    //     }

    //     if (move.left) {
    //         lateral += moveSpeed;
    //     }

    //     if (move.right) {
    //         lateral -= moveSpeed;
    //     }

    //     cameraController.update(pitch, yaw, longitudinal, lateral);

    //     // reset movement buffers.
    //     yaw = 0;
    //     pitch = 0;

    //     scene.nodes.forEach((node) => node.tick());

    //     renderer.render(data.scene, cameraNode);


    //     window.requestAnimationFrame(loop);
    // }

    // window.requestAnimationFrame(loop);

}).catch((err) => {
    console.log(err);
});
