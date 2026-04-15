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
let nightMode = false, pointLight;

const manager = new LoadingManager();
const loader = new GLTFLoader(manager);
const pixelRatio = Math.min(window.devicePixelRatio, 2);

const container = document.getElementById('container');
const loaderText = document.getElementById('loader');
const nightToggle = document.getElementById('night-toggle');
init();

/**
 * Initializes the Three.js scene, camera, lights, renderer, post-processing, and loads the robot model with animations.
 * Sets up event listeners for user interactions and window resizing.
 * Also configures the loading manager to display loading progress and initialize the FPS monitor once assets are loaded.
 * The function is called once at the start to set everything up before the animation loop begins.
 */
function init() {
    const { width, height } = getCanvasWidthHeight();
    timer = new Timer();
    timer.connect(document);
    raycaster = new Raycaster();
    mouse = new Vector2();

    scene = new Scene();
    scene.background = new Color(0xe0e0e0);
    camera = new PerspectiveCamera(45, width / height, 0.25, 100);
    camera.position.set(3, 3, 10);
    camera.lookAt(0, 2, 0);

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    pointLight = new PointLight(0x00ff88, 0, 15); // Cyberpunk green light
    scene.add(pointLight);

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
    // renderer.setAnimationLoop(animate);
    container.appendChild(renderer.domElement);

    // Post-Processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 0; // Start at 0, increase in Night Mode

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    let lastTime = 0;
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
        lastTime = performance.now();
        loaderText.innerText = `Loading... ${Math.round((itemsLoaded / itemsTotal) * 100)}%`; // More descriptive
    };
    manager.onLoad = () => {
        lastTime = performance.now() - lastTime;
        // Initialize FPS monitor with renderer and bloom pass
        initFPSMonitor(renderer, bloomPass);

        // disable loader domElement.
        setTimeout(() => { document.getElementById('loading-screen').style.display = 'none'; }, lastTime < 500 ? 500 - lastTime : 0); // Ensure at least 500ms display for loading screen
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
    renderer.domElement.addEventListener('touch', onTouchClick);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    nightToggle.addEventListener('click', toggleNightMode);
    window.addEventListener('resize', onWindowResize);

    // Night Mode Toggle Logic
    function toggleNightMode(event) {
        event.stopPropagation();
        nightMode = !nightMode;
        setNightMode(nightMode); // Update FPS monitor about night mode
        scene.background = new Color(nightMode ? 0x020205 : 0xe0e0e0);
        ambientLight.intensity = nightMode ? 0.05 : 0.8;
        pointLight.intensity = nightMode ? 5 : 0;
        bloomPass.strength = nightMode ? 1.5 : 0;
        dirLight.intensity = nightMode ? 0.2 : 3;
        hemiLight.intensity = nightMode ? 0.2 : 3;
    };
    animate();
}

function getCanvasWidthHeight() {
    return { width: container.clientWidth, height: container.clientHeight };
}
/**
 * Main animation loop to render the scene and update animations
 * Also updates FPS stats on each frame
 */
function animate() {
    requestAnimationFrame(animate);
    updateFPSStats(); // Track FPS performance
    timer.update();
    mixer?.update(timer.getDelta()); // Slow down animation for better visibility
    // if (!nightMode) renderer.render(scene, camera);
    nightMode ? composer.render() : renderer.render(scene, camera);
}

/**
 * Handle window resize events to maintain aspect ratio and renderer size
 */
function onWindowResize() {
    const { width, height } = getCanvasWidthHeight();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
}

/**
 * Update mouse coordinates based on event type (mouse or touch)
 * @param {MouseEvent | TouchEvent} event - The mouse or touch event to extract coordinates from
 * @returns {void} - No return value, updates the global mouse vector
 * Updates the mouse vector based on the event's clientX and clientY, normalizing them to the range [-1, 1]
 * for use with raycasting and point light positioning.
 */
function updateMouse(event) {
    const { width, height } = container.getBoundingClientRect();
    let clientX = event.clientX;
    let clientY = event.clientY;

    if (event.touches?.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    }

    mouse.set((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1);
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
    updateMouse(event);
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
    updatePointLight(event);
}

/**
 * Handles Touch move Event for updating the point ligh position.
 * @param {TouchEvent} event - the touch move event.
 * @returns {void}
 */
function onTouchMove(event) {
    if (!nightMode || !event.touches?.length) return;
    updateMouse(event);
    updatePointLight(event);
}

/**
 * Handle touch event for intesect object head and torso.
 * @param {TouchEvent} event - the touch event to check for intersection with robot parts.
 * @returns {void}
 */
function onTouchClick(event) {
    if (!event.changedTouches?.length) return;
    const touch = event.changedTouches[0];
    onMouseClick(touch);
}

/**
 * Update the point light position based on mouse or touch coordinates.
 * @param {MouseEvent | TouchEvent} event - the event to update the point light position based on mouse or touch coordinates.
 * @returns {void}
 * Updates the point light position based on the mouse or touch coordinates by unprojecting the normalized device coordinates to world space and interpolating the point light position towards it for a smooth effect.
 */
function updatePointLight(event) {
    updateMouse(event);
    const vec = new Vector3();
    const pos = new Vector3();

    vec.set(mouse.x, mouse.y, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    const distance = -camera.position.z / vec.z;
    pos.copy(camera.position).add(vec.multiplyScalar(distance));
    if (pos.length !== 0)
        pointLight.position.lerp(pos, 0.09);
}