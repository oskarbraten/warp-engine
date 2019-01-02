import Warp from '../src/index';
import CameraController from './controls/CameraController';

Warp.importer('./assets/test_light_1.gltf').then(({ scene }) => {

    console.log(scene);

    const gl = document.createElement('canvas').getContext('webgl2');
    const renderer = Warp.renderer(gl);

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.acquireRenderables().forEach(([primitive]) => {
        renderer.load(primitive);
    });

    let camera = Warp.camera.createPerspective((window.innerWidth / window.innerHeight), 70, 5000, 0.1);

    window.addEventListener('resize', () => {
        camera.perspective.aspectRatio = window.innerWidth / window.innerHeight;
        Warp.camera.updateProjectionMatrix(camera);

        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    let cameraNode = Warp.node({ name: 'Camera', camera });

    cameraNode.applyTranslation(12, 8, 8);
    cameraNode.applyRotationY(Math.PI/4 + 0.1);
    cameraNode.applyRotationX(-0.5);

    scene.nodes.push(cameraNode);

    let cameraController = new CameraController(cameraNode);

    let canvas = renderer.domElement;

    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });

    let yaw = 0;
    let pitch = 0;

    function updateCamRotation(event) {
        yaw += event.movementX * 0.001;
        pitch += event.movementY * 0.001;
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


    let then = 0;
    function loop(now) {

        const delta = now - then;
        then = now;

        const moveSpeed = move.speed * delta;

        let longitudinal = 0;
        let lateral = 0;

        if (move.forward) {
            longitudinal += moveSpeed;
        }

        if (move.backward) {
            longitudinal -= moveSpeed;
        }

        if (move.left) {
            lateral += moveSpeed;
        }

        if (move.right) {
            lateral -= moveSpeed;
        }

        cameraController.update(pitch, yaw, longitudinal, lateral);

        // reset movement buffers.
        yaw = 0;
        pitch = 0;

        //lightNode.applyRotationX(0.01);

        scene.updateTransforms();

        renderer.render(scene.acquireRenderables(), cameraNode, scene.acquireLights());

        window.requestAnimationFrame(loop);

    }

    window.requestAnimationFrame(loop);

}).catch((error) => {
    console.log(error);
});