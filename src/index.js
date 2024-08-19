import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GUI } from 'dat.gui';

let scene, camera, renderer, cubes, composer;
let moveSpeed = 0.5;
let boostFactor = 2;
let cubeSize = 2;
let cubeCount = 10000;
let bloomStrength = 1.5;
let bloomRadius = 0.4;
let bloomThreshold = 0.2;
let isBoostActive = false;
let isMouseDown = false;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let keys = {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    ShiftLeft: false,
    ShiftRight: false
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createCubeCloud();
    setupBloom();
    setupGUI();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseup', onMouseUp, false);

    animate();
}

function createCubeCloud() {
    if (cubes) scene.remove(cubes);

    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const material = new THREE.MeshBasicMaterial();

    cubes = new THREE.InstancedMesh(geometry, material, cubeCount);

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < cubeCount; i++) {
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;

        matrix.setPosition(x, y, z);

        const r = Math.random();
        const g = Math.random() * 0.5;
        const b = Math.random();
        color.setRGB(r, g, b);

        cubes.setMatrixAt(i, matrix);
        cubes.setColorAt(i, color);
    }

    scene.add(cubes);
}

function setupBloom() {
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        bloomStrength,
        bloomRadius,
        bloomThreshold
    );

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
}

function setupGUI() {
    const gui = new GUI();
    const params = {
        moveSpeed: moveSpeed,
        boostFactor: boostFactor,
        cubeSize: cubeSize,
        cubeCount: cubeCount,
        bloomStrength: bloomStrength,
        bloomRadius: bloomRadius,
        bloomThreshold: bloomThreshold
    };

    gui.add(params, 'moveSpeed', 0.1, 2).onChange(value => moveSpeed = value);
    gui.add(params, 'boostFactor', 1, 5).onChange(value => boostFactor = value);
    gui.add(params, 'cubeSize', 0.1, 5).onChange(value => {
        cubeSize = value;
        createCubeCloud();
    });
    gui.add(params, 'cubeCount', 1000, 20000).step(1000).onChange(value => {
        cubeCount = value;
        createCubeCloud();
    });
    gui.add(params, 'bloomStrength', 0, 3).onChange(value => {
        bloomStrength = value;
        composer.passes[1].strength = value;
    });
    gui.add(params, 'bloomRadius', 0, 1).onChange(value => {
        bloomRadius = value;
        composer.passes[1].radius = value;
    });
    gui.add(params, 'bloomThreshold', 0, 1).onChange(value => {
        bloomThreshold = value;
        composer.passes[1].threshold = value;
    });
}

function animate() {
    requestAnimationFrame(animate);

    updateCamera();

    composer.render();
}

function updateCamera() {
    let currentSpeed = isBoostActive ? moveSpeed * boostFactor : moveSpeed;

    if (keys.KeyW) camera.translateZ(-currentSpeed);
    if (keys.KeyS) camera.translateZ(currentSpeed);
    if (keys.KeyA) camera.translateX(-currentSpeed);
    if (keys.KeyD) camera.translateX(currentSpeed);

    camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05;
    camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05;

    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

    if (camera.position.length() > 1000) {
        camera.position.setLength(50);
    }
}

function onMouseDown(event) {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseMove(event) {
    if (isMouseDown) {
        let deltaX = event.clientX - mouseX;
        let deltaY = event.clientY - mouseY;

        targetRotationY -= deltaX * 0.01;
        targetRotationX -= deltaY * 0.01;

        mouseX = event.clientX;
        mouseY = event.clientY;
    }
}

function onMouseUp() {
    isMouseDown = false;
}

function onKeyDown(event) {
    if (event.code in keys) {
        keys[event.code] = true;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        isBoostActive = true;
    }
}

function onKeyUp(event) {
    if (event.code in keys) {
        keys[event.code] = false;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        isBoostActive = false;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

init();
