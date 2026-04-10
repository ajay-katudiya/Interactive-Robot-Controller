import {
    Timer,
    Raycaster,
    Vector2,
    Vector3,
    LoopOnce,
    Scene,
    Color,
    PerspectiveCamera,
    HemisphereLight,
    DirectionalLight,
    WebGLRenderer,
    AmbientLight,
    PointLight,
    LoadingManager,
    SRGBColorSpace,
    AnimationMixer
} from './build/three.module.min.js';
import { GLTFLoader } from './examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from './examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './examples/jsm/postprocessing/UnrealBloomPass.js';
import { updateFPSStats, initFPSMonitor, setNightMode } from './fpsMonitor.js';

let scene, camera, renderer, mixer, timer, raycaster, mouse, composer;
let robot, actions = {}, currentAction;
let nightMode = false, pointLight, ambientLight;
let bloomPass;

const manager = new LoadingManager();
const loader = new GLTFLoader(manager);
const pixelRatio = Math.min(window.devicePixelRatio, 2);

const container = document.getElementById('container');
const loaderText = document.getElementById('loader');
const nightToggle = document.getElementById('night-toggle');
const { width, height } = container.getBoundingClientRect();
init();

/**
 * Initialize FPS monitor with renderer and bloom pass references
 * @param {WebGLRenderer} rendererRef - js renderer instance
 * @param {UnrealBloomPass} bloomPassRef - Bloom post-processing pass
 */
function init() {
    timer = new Timer();
    timer.connect(document);
    raycaster = new Raycaster();
    mouse = new Vector2();

    scene = new Scene();
    scene.background = new Color(0xe0e0e0);

    console.log(width, height);

    camera = new PerspectiveCamera(45, width / height, 0.25, 100);
    camera.position.set(3, 3, 10);
    camera.lookAt(0, 2, 0);

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.position.set(0, 20, 10);
    scene.add(dirLight);

    renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.setAnimationLoop(animate);

    // Post-Processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    bloomPass = new UnrealBloomPass(new Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 0; // Start at 0, increase in Night Mode

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Lighting
    ambientLight = new AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    pointLight = new PointLight(0x00ff88, 0, 15); // Cyberpunk green light
    pointLight.position.lerp(new Vector3(0, 0, 5), 0.1);
    scene.add(pointLight);

    // const gridHelper = new GridHelper(20, 40);
    // scene.add(gridHelper);

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
        loaderText.innerText = `Loading... ${Math.round((itemsLoaded / itemsTotal) * 100)}%`; // More descriptive
    };
    manager.onLoad = () => {
        document.getElementById('loading-screen').style.display = 'none';
        // Initialize FPS monitor with renderer and bloom pass
        initFPSMonitor(renderer, bloomPass);
    };

    // Asset Loading
    loader.load('./assets/RobotExpressive/RobotExpressive.glb', (gltf) => {
        robot = gltf.scene;
        scene.add(robot);
        mixer = new AnimationMixer(robot);
        gltf.animations.forEach(clip => actions[clip.name] = mixer.clipAction(clip));
        currentAction = actions['Idle'];
        currentAction.play();
    });

    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('touchstart', onTouchClick);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    nightToggle.addEventListener('click', toggleNightMode);
    window.addEventListener('resize', onWindowResize);


    // Night Mode Toggle Logic
    function toggleNightMode() {
        nightMode = !nightMode;
        setNightMode(nightMode); // Update FPS monitor about night mode
        scene.background = new Color(nightMode ? 0x020205 : 0xe0e0e0);
        ambientLight.intensity = nightMode ? 0.05 : 0.8;
        pointLight.intensity = nightMode ? 5 : 0;
        bloomPass.strength = nightMode ? 1.5 : 0;
        dirLight.intensity = nightMode ? 0.2 : 3;
        hemiLight.intensity = nightMode ? 0.2 : 3;
    };
}

/**
 * Handle window resize events to maintain aspect ratio and renderer size
 */
function onWindowResize() {
    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
}

function getPointerCoords(event) {
    let clientX = event.clientX;
    let clientY = event.clientY;
    
    if (event.touches?.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    }
    
    return { clientX, clientY };
}

function getNormalizedCoords(clientX, clientY) {
    return {
        x: (clientX / width) * 2 - 1,
        y: -(clientY / height) * 2 + 1
    };
}
/**
 * Fades to a different animation action
 * @param {String} name - The name of the action to fade to
 * @param {Number} duration - The duration of the fade animation
 * @param {Boolean} loop - Whether the action should loop
 * @returns {void}
 */
function fadeToAction(name, duration = 0.5, loop = true) {
    const nextAction = actions[name];
    if (nextAction === currentAction && loop) return;

    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration);

    if (!loop) {
        nextAction.setLoop(LoopOnce);
        nextAction.clampWhenFinished = true;
    }

    currentAction.fadeOut(duration);
    currentAction = nextAction;
    currentAction.play();

    // If Jump, return to Idle after finish
    if (!loop) {
        mixer.addEventListener('finished', (e) => {
            if (e.action._clip.name === 'Jump') fadeToAction('Idle');
        });
    }
}

/**
 * Handles mouse click events for interacting with the robot
 * @param {MouseEvent} event - The mouse click event
 */
function onMouseClick(event) {
    const { clientX, clientY } = getPointerCoords(event);
    const coords = getNormalizedCoords(clientX, clientY);
    
    mouse.set(coords.x, coords.y);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(robot.children, true);

    if (intersects.length > 0) {
        const objectName = intersects[0].object.name;

        // RobotExpressive uses specific mesh names for Head and Torso
        if (objectName.includes('Head')) {
            fadeToAction('Jump', 0, false);
        } else if (objectName.includes('Torso')) {
            const next = currentAction === actions['Walking'] ? 'Idle' : 'Walking';
            fadeToAction(next);
        }
    }
}

/**
 * Handles mouse move events for updating the point light position
 * @param {MouseEvent} event - The mouse move event
 * @returns {void}
 */
function onMouseMove(event) {
    if (!nightMode) return;
    updatePointLight(event.clientX, event.clientY);
}

function onTouchMove(event) {
    if (!nightMode || !event.touches?.length) return;
    const { clientX, clientY } = getPointerCoords(event);
    updatePointLight(clientX, clientY);
}

function updatePointLight(clientX, clientY) {
    const coords = getNormalizedCoords(clientX, clientY);
    const vec = new Vector3();
    const pos = new Vector3();
    
    vec.set(coords.x, coords.y, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    const distance = -camera.position.z / vec.z;
    pos.copy(camera.position).add(vec.multiplyScalar(distance));
    pointLight.position.lerp(pos, 0.01);
}

function onTouchClick(event) {
    if (!event.changedTouches?.length) return;
    const touch = event.changedTouches[0];
    const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
    onMouseClick(syntheticEvent);
}

/**
 * Main animation loop to render the scene and update animations
 * Also updates FPS stats on each frame
 */
function animate() {
    // requestAnimationFrame(animate);
    updateFPSStats(); // Track FPS performance
    timer.update();
    const dt = timer.getDelta();
    mixer?.update(dt * 0.75); // Slow down animation for better visibility
    nightMode ? composer.render() : renderer.render(scene, camera);
}