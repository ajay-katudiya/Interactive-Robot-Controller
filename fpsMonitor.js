// FPS Monitoring Module

let fps = 0, avgFrameTime = 0;
const MAX_HISTORY = 30;
const UI_UPDATE_INTERVAL = 200; // ms
const QUALITY_CHECK_INTERVAL = 15; // frames

let qualityLevel = 2; // 0 = Low, 1 = Medium, 2 = High
let bloomPass = null;
let nightMode = false;
let renderer = null;

// Circular buffer for frame times (more efficient than array shift)
const frameTimeBuffer = new Float32Array(MAX_HISTORY);
let frameTimeIndex = 0;
let frameTimeSum = 0;
let lastTime = performance.now();
let lastUIUpdate = 0;
let frameCountSinceQualityCheck = 0;

// Cache DOM elements to avoid repeated queries
const uiElements = { fps: null, frameTime: null, status: null, quality: null };

const qualityLabels = ['Low', 'Medium', 'High'];
const statusLabels = {
    good: { text: 'Optimal', class: 'fps-status-good' },
    ok: { text: 'Good', class: 'fps-status-ok' },
    poor: { text: 'Low', class: 'fps-status-poor' }
};

const QUALITY_THRESHOLDS = { low: 45, high: 55, good: 50, ok: 30 };

/**
 * Initialize FPS monitor with renderer and bloom pass
 * @param {THREE.WebGLRenderer} rendererRef - Three.js renderer instance
 * @param {UnrealBloomPass} bloomPassRef - Bloom post-processing pass
 */
export function initFPSMonitor(rendererRef, bloomPassRef) {
    renderer = rendererRef;
    bloomPass = bloomPassRef;
    cacheUIElements();
}

/**
 * Set night mode state for quality adjustments
 * @param {boolean} isNightMode - Night mode enabled
 */
export function setNightMode(isNightMode) {
    nightMode = isNightMode;
}

/**
 * Cache UI elements from DOM
 */
function cacheUIElements() {
    uiElements.fps = document.getElementById('fps-value');
    uiElements.frameTime = document.getElementById('fps-frame-time');
    uiElements.status = document.getElementById('fps-status');
    uiElements.quality = document.getElementById('fps-quality');
}

/**
 * Update FPS statistics and quality settings
 */
export function updateFPSStats() {
    const currentTime = performance.now();
    const frameTime = currentTime - lastTime;
    lastTime = currentTime;

    // Circular buffer: replace oldest value and maintain running sum
    frameTimeSum = frameTimeSum - frameTimeBuffer[frameTimeIndex] + frameTime;
    frameTimeBuffer[frameTimeIndex] = frameTime;
    frameTimeIndex = (frameTimeIndex + 1) % MAX_HISTORY;

    // Calculate average and FPS
    const avgTime = frameTimeSum / MAX_HISTORY;
    fps = Math.round(1000 / avgTime);
    avgFrameTime = avgTime.toFixed(2);

    // Quality adjustment - check less frequently to reduce overhead
    if (++frameCountSinceQualityCheck >= QUALITY_CHECK_INTERVAL) {
        frameCountSinceQualityCheck = 0;

        let newQuality = qualityLevel;
        if (fps < 45 && qualityLevel > 0) {
            newQuality = qualityLevel - 1; // Reduce quality
        } else if (fps > 55 && qualityLevel < 2) {
            newQuality = qualityLevel + 1; // Increase quality
        }

        if (newQuality !== qualityLevel) {
            qualityLevel = newQuality;
            applyQualitySettings();
        }
    }

    // Throttle UI updates to reduce DOM manipulation
    if (currentTime - lastUIUpdate >= UI_UPDATE_INTERVAL) {
        lastUIUpdate = currentTime;
        updateUIStats();
    }
}

/**
 * Apply quality settings based on current quality level
 */
function applyQualitySettings() {
    if (!renderer || !bloomPass) return;

    switch (qualityLevel) {
        case 0: // Low Quality
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
            bloomPass.iterations = 2;
            bloomPass.strength = nightMode ? 1 : 0;
            break;
        case 1: // Medium Quality
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            bloomPass.iterations = 4;
            bloomPass.strength = nightMode ? 1.2 : 0;
            break;
        case 2: // High Quality (default)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            bloomPass.iterations = 6;
            bloomPass.strength = nightMode ? 1.5 : 0;
            break;
    }
}

/**
 * Get status label based on FPS value
 * @param {number} fpsValue - Current FPS
 * @returns {Object} Status object with text and CSS class
 */
function getStatusLabel(fpsValue) {
    if (fpsValue >= 50) return statusLabels.good;
    if (fpsValue >= 30) return statusLabels.ok;
    return statusLabels.poor;
}

/**
 * Update UI statistics display
 */
function updateUIStats() {
    // Skip if UI elements not yet cached
    if (!uiElements.fps) return;

    const status = getStatusLabel(fps);

    uiElements.fps.textContent = `FPS: ${fps}`;
    uiElements.fps.className = status.class;
    uiElements.frameTime.textContent = `Frame: ${avgFrameTime}ms`;
    uiElements.status.innerHTML = `Status: <span class="${status.class}">${status.text}</span>`;
    uiElements.quality.textContent = `Quality: ${qualityLabels[qualityLevel]}`;
}

/**
 * Get current quality level
 * @returns {number} Quality level (0=Low, 1=Medium, 2=High)
 */
export function getQualityLevel() {
    return qualityLevel;
}

/**
 * Get current FPS value
 * @returns {number} Current FPS
 */
export function getFPS() {
    return fps;
}
