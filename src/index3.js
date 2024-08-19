import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three-rounded-box';

import * as dat from 'dat.gui';
const gui = new dat.GUI();

const params = {
    keyPressIntensity: 2,
    keyPressDuration: 100,
    keyReleaseDelay: 500,
    overallBrightness: 1,
    bloomStrength: 4.5,
    bloomRadius: 0.6,
    bloomThreshold: 0.002,
    keyboardTiltSensitivity: 0.2,
    keyboardFloatSpeed: 0.001,
    keyboardFloatAmplitude: 0.1
};
gui.add(params, 'keyPressIntensity', 0, 5).name('Key Press Intensity');
gui.add(params, 'keyPressDuration', 50, 500).name('Key Press Duration (ms)');
gui.add(params, 'keyReleaseDelay', 100, 1000).name('Key Release Delay (ms)');
gui.add(params, 'overallBrightness', 0, 2).name('Overall Brightness');
gui.add(params, 'bloomStrength', 0, 30).name('Bloom Strength');
gui.add(params, 'bloomRadius', 0, 1).name('Bloom Radius');
gui.add(params, 'bloomThreshold', 0, 1).name('Bloom Threshold');
gui.add(params, 'keyboardTiltSensitivity', 0, 1).name('Keyboard Tilt Sensitivity');
gui.add(params, 'keyboardFloatSpeed', 0, 0.01).name('Keyboard Float Speed');
gui.add(params, 'keyboardFloatAmplitude', 0, 0.5).name('Keyboard Float Amplitude');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

const keyboard = new THREE.Group();
const keyGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
const keyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

const keyLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/']
];

const keys = {};

keyLayout.forEach((row, i) => {
    row.forEach((key, j) => {
        const keyMesh = new THREE.Mesh(keyGeometry, keyMaterial.clone());
        keyMesh.position.set(j * 0.25 - 1.5, -i * 0.25 + 0.5, 0);
        keyboard.add(keyMesh);

        const pointLight = new THREE.PointLight(0xff00ff, 0, 0.5);
        pointLight.position.set(0, 0, 0.1);
        keyMesh.add(pointLight);

        keys[key] = { mesh: keyMesh, light: pointLight, pressedZ: 0 };
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
            const textGeometry = new TextGeometry(key, {
                font: font,
                size: 0.1,
                height: 0.02
            });
            const textMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(-0.05, -0.05, 0.05);
            keyMesh.add(textMesh);
        });
    });
});

scene.add(keyboard);

// 添加光源
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    params.bloomStrength,
    params.bloomRadius,
    params.bloomThreshold
);
composer.addPass(bloomPass);
function onKeyDown(event) {
    const key = event.key.toUpperCase();
    if (keys[key] && !keys[key].isPressed) {
        const { mesh, light, pressedZ } = keys[key];
        mesh.material.emissive.setHex(0xff00ff);
        mesh.material.emissiveIntensity = 0.5 * params.overallBrightness;
        
        keys[key].isPressed = true;
        keys[key].pressedZ = mesh.position.z - 0.05;
       
    }
}

function onKeyUp(event) {
    const key = event.key.toUpperCase();
    if (keys[key]) {
        const { mesh, light } = keys[key];
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0;
        keys[key].isPressed = false;
    
    }
}
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('keyup', onKeyUp, false);

function onMouseMove(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    keyboard.rotation.y = mouseX * params.keyboardTiltSensitivity;
    keyboard.rotation.x = mouseY * params.keyboardTiltSensitivity;
}

window.addEventListener('mousemove', onMouseMove, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

function animate(time) {
    requestAnimationFrame(animate);
    
    TWEEN.update(time);
    
    keyboard.position.y = Math.sin(time * params.keyboardFloatSpeed) * params.keyboardFloatAmplitude;
    
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    bloomPass.threshold = params.bloomThreshold;
    
    composer.render();
}
animate();