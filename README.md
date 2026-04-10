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

## Features

- **Dynamic Animations**: Walk, Jump, and Idle animations with smooth transitions
- **Interactive Raycasting**: Click the robot's head to jump or torso to toggle walking
- **FPS Monitoring**: Real-time FPS tracking with adaptive quality adjustment
- **Night Mode**: Toggle between day and night modes with dynamic lighting and bloom effects
- **Performance Optimized**: Adaptive quality levels (Low, Medium, High) for consistent performance
- **Mobile Responsive**: Touch support and mobile-optimized rendering

## Tech Stack

- Three.js (r182)
- WebGL with post-processing (Bloom effect)
- ES6 Modules for clean code organization
- GLTF/GLB Model Format

## Project Structure

```
Interactive Robot Controller/
├── roboControls.js          # Main application logic
├── fpsMonitor.js            # FPS tracking & quality management
├── interactiverobo.html     # HTML entry point
├── README.md                # Project documentation
└── assets/                  # 3D models and resources
    └── RobotExpressive/
        └── RobotExpressive.glb
```

## Usage

1. Open `interactiverobo.html` in a modern web browser
2. Click the robot to interact:
   - **Head**: Triggers jump animation
   - **Torso**: Toggles between walking and idle
3. **Night Mode**: Click the button to toggle night mode with dynamic lighting
4. Monitor FPS stats in the top-right corner

## Controls

- **Mouse Click**: Interact with robot parts
- **Mouse Move** (Night Mode): Move the light source with cursor
- **Touch**: Mobile-friendly touch interactions
- **Resize**: Automatically adapts to window resize

## Performance

The FPS monitor automatically adjusts render quality based on performance:

- **60+ FPS**: High quality (2x pixel ratio, 6 bloom iterations)
- **50+ FPS**: Medium quality (1.5x pixel ratio, 4 bloom iterations)
- **<50 FPS**: Low quality (1x pixel ratio, 2 bloom iterations)

## Development

To modify the project:

1. **Animations**: Edit animation names in `roboControls.js`
2. **Lighting**: Adjust light intensity and colors
3. **FPS Thresholds**: Modify `UI_UPDATE_INTERVAL` and `QUALITY_CHECK_INTERVAL` in `fpsMonitor.js`
4. **Model**: Replace the model path in asset loading section

## Browser Support

- Chrome, Edge, Firefox, Safari (modern versions)
- Requires WebGL 2.0 support
- Recommended: Desktop or high-end mobile devices