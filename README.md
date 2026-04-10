# Part 1
1. Memory Management:** If you remove a Mesh from a scene in a **Single Page Application (SPA)** but do not call .```dispose()``` on its geometry or material, what happens to the GPU memory?
- **answer** :- the associated data remains indefinitely in GPU memor

2. **Coordinate Systems:** Briefly explain the mathematical steps required to map a 2D mouse click on the screen to a 3D intersection point on a model.
- **answer** :- 3D intersection point in Three.js involves **normalizing coordinates, raycasting, and intersection testing.**

  1. **Normalize Mouse Coordinates (NDC)**:-  mouse coordinates ```( clientX,clientY )``` to Normalized Device Coordinates (NDC) ranging from **-1 to +1 for bothe X & Y** my mapping them as domElement of renderer's canvas.
  ```js
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  ```
  2. **Raycaster**:- set raycast and it to shoot a ray from the camera position through the **normalized 2d mouse position on the 3D scene**.
  ```js
  raycaster.setFromCamera(mouse, camera);
  ```
  3. **Intersect Objects**:- with ```intersectObjects``` method of the scene objects, uses mathematical intersection and return the objects, points etc... in array.
  ```js
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) console.log(intersects[0].point); // 3D Point
  ```

3. **Optimization:** You are tasked with **rendering 2,000 identical 3D crates**. What is the most performant way to handle this in Three.js, and why?
- **answer** :- in three js **InstancedMesh** most performant way to handle. significantly reducing **CPU-to-GPU draw calls**. Rather than 2,000 separate calls, it sends geometry and material **data once and renders all instances in one go**.

4. **Future-Proofing:** In 2026, when would you choose to use TSL (Three Shading Language) over standard GLSL for a custom shader effect?
- **answer** :- when building **cross-compatible effects** that must run seamlessly on both **WebGPU (WGSL) and WebGL (GLSL)** without maintaining separate codebases. is is also effects requiring **high-level integration with the Three.js Node Material system**.

# Part 2

## 🤖 Interactive Robot Controller (Three.js)

A high-performance 3D robot controller built with Three.js featuring dynamic animations, interactive raycasting, adaptive FPS monitoring, and night mode with bloom effects.

## 🚀 Features

- **Dynamic Animations**: Walk, Jump, and Idle animations with smooth transitions
- **Interactive Raycasting**: Click the robot's head to jump or torso to toggle walking
- **Real-Time FPS Monitoring**: Live FPS tracking with frame time display
- **Adaptive Quality System**: Automatic quality adjustment (Low/Medium/High) based on performance
- **Night Mode**: Toggle between day and night modes with dynamic lighting
- **Bloom Effects**: Post-processing bloom effect for enhanced visuals
- **Mobile Responsive**: Touch support and device pixel ratio optimization
- **Modular Architecture**: Separated concerns with dedicated FPS monitoring module

## 🛠 Tech Stack

- **Engine**: Three.js (r182+)
- **Rendering**: WebGL 2.0 with EffectComposer
- **Post-Processing**: UnrealBloomPass
- **Module System**: ES6 Modules
- **Model Format**: GLTF/GLB (RobotExpressive)

## 📁 Project Structure

```
Interactive Robot Controller/
├── roboControls.js              # Main application & scene setup
├── fpsMonitor.js                # FPS tracking & quality management
├── interactiverobo.html         # HTML entry point
├── README.md                    # Project documentation
├── assets/                      # 3D models and resources
│   └── RobotExpressive.glb
└── build/                       # Three.js build files
```

## 🎮 Usage & Controls

### Interaction
1. Open `interactiverobo.html` in a modern web browser
2. **Robot Head**: Click to trigger jump animation
3. **Robot Torso**: Click to toggle between walking and idle states
4. **Night Mode Button**: Toggle between day/night lighting modes
5. **Mouse Movement** (Night Mode): Move the dynamic light with your cursor

### Input Methods
- **Desktop**: Mouse clicks and movements
- **Mobile**: Touch taps and gestures
- **Window Resize**: Automatically adapts viewport

## 📊 Performance Monitoring

Real-time FPS stats displayed in top-right corner:

```
FPS: 60          (Current frames per second)
Frame: 16.67ms   (Milliseconds per frame)
Status: Optimal  (Performance indicator)
Quality: High    (Current quality level)
```

### Adaptive Quality System

Automatically adjusts rendering quality to maintain smooth performance:

| Quality Level | FPS Target | Pixel Ratio | Bloom Iterations |
|---|---|---|---|
| **High** | 60+ | 2x | 6 |
| **Medium** | 50+ | 1.5x | 4 |
| **Low** | 45+ | 1x | 2 |

Quality automatically scales down if FPS drops below 45 and up if it exceeds 55 to maintain optimal performance.

## 🔧 Modular Components

### roboControls.js
- Scene initialization and setup
- Camera and renderer configuration
- Animation management and blending
- Event handling (click, touch, resize)
- Raycasting for object interaction
- Night mode toggle logic

### fpsMonitor.js
- FPS calculation using circular buffer (O(1) complexity)
- Frame time averaging over 30-frame window
- Automatic quality adjustment based on performance
- DOM element caching for optimal updates
- Throttled UI updates (200ms intervals)

## 📱 Compatibility

- **Browsers**: Chrome, Edge, Firefox, Safari (latest versions)
- **API**: Requires WebGL 2.0 support
- **Platform**: Desktop, Tablet, Mobile
- **Performance**: Optimized for 30-120 FPS range

## 🎨 Customization

### Modify Animations
Edit animation transitions in `roboControls.js`:
```javascript
loader.load('./assets/RobotExpressive.glb', (gltf) => {
    // Add custom animation logic here
});
```

### Adjust Lighting
Modify light intensity and colors:
```javascript
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
const pointLight = new THREE.PointLight(0x00ff88, 0, 15);
```

### Quality Thresholds
Edit FPS thresholds in `fpsMonitor.js`:
```javascript
const UI_UPDATE_INTERVAL = 200;      // UI update frequency (ms)
const QUALITY_CHECK_INTERVAL = 15;   // Quality check frequency (frames)
```