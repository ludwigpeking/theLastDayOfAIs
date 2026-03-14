import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// Scene Setup
// ============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 0, 350);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('globe-container').appendChild(renderer.domElement);

// ============================================
// Controls
// ============================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 200;
controls.maxDistance = 800;
controls.autoRotate = false;

// ============================================
// Stars
// ============================================
const starsGeo = new THREE.BufferGeometry();
const starCount = 10000;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    const r = 3000 + Math.random() * 2000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2 }));
scene.add(stars);

// ============================================
// Lights
// ============================================
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(500, 50, 500);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
scene.add(ambientLight);

// ============================================
// Earth with Multi-Layer Shader
// ============================================
const earthRadius = 100;
const earthGeo = new THREE.SphereGeometry(earthRadius, 128, 128);

// Load earth textures (earth-normal.jpg = diffuse, earth-bump.jpg = normal map)
const textureLoader = new THREE.TextureLoader();
const diffuseTexture = textureLoader.load('earth-normal.jpg');
const normalTexture = textureLoader.load('earth-bump.jpg');

// Country ID mask canvas (for CPU picking)
const maskCanvas = document.createElement('canvas');
maskCanvas.width = 4096;
maskCanvas.height = 2048;
const maskCtx = maskCanvas.getContext('2d');
const maskTexture = new THREE.CanvasTexture(maskCanvas);

// Dedicated border canvas baked at diffuse map resolution
const borderCanvas = document.createElement('canvas');
borderCanvas.width = 5400;
borderCanvas.height = 2700;
const borderCtx = borderCanvas.getContext('2d');
const borderTexture = new THREE.CanvasTexture(borderCanvas);

// Country data
const countryMap = new Map();

// Earth material with layered shader
const earthMat = new THREE.ShaderMaterial({
    uniforms: {
        diffuseTexture: { value: diffuseTexture },
        normalTexture: { value: normalTexture },
        countryMask: { value: maskTexture },
        borderMask: { value: borderTexture },
        lightPosition: { value: sunLight.position },
        hoverCountryId: { value: 0.0 },
        clickedCountryId: { value: 0.0 },
        time: { value: 0.0 }
    },
    vertexShader: `
        uniform vec3 lightPosition;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vLightDir;

        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            vLightDir = normalize((viewMatrix * vec4(lightPosition, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D diffuseTexture;
        uniform sampler2D countryMask;
        uniform sampler2D borderMask;
        uniform float hoverCountryId;
        uniform float clickedCountryId;
        uniform float time;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vLightDir;

        float decodeId(vec3 color) {
            return color.r * 255.0 * 65536.0 + color.g * 255.0 * 256.0 + color.b * 255.0;
        }

        vec3 idToColor(float id) {
            float h = mod(id * 137.508, 360.0) / 360.0;
            // HSV to RGB, S=0.6, V=1.0
            vec3 c = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
            return mix(vec3(1.0), c, 0.6);
        }

        void main() {
            // Layer 1: Base diffuse texture
            vec4 baseColor = texture2D(diffuseTexture, vUv);

            // Layer 2: Directional lighting
            float diff = max(dot(vNormal, vLightDir), 0.0);
            vec3 litColor = baseColor.rgb * (0.2 + 0.8 * diff);

            // Layer 3: Country mask (for interaction)
            vec4 mask = texture2D(countryMask, vUv);
            float countryId = decodeId(mask.rgb);

            // Layer 4: Per-country color tint at 15% opacity
            if (countryId > 0.0) {
                vec3 countryColor = idToColor(countryId);
                litColor = mix(litColor, countryColor, 0.15);
            }

            // Layer 5: Country highlight on hover
            if (countryId > 0.0 && hoverCountryId > 0.0 && abs(countryId - hoverCountryId) < 0.5) {
                vec3 highlightColor = vec3(1.0, 0.8, 0.2);
                litColor = mix(litColor, highlightColor, 0.4);
                litColor += highlightColor * 0.2;
            }

            // Layer 6: Clicked country brightening
            if (countryId > 0.0 && clickedCountryId > 0.0 && abs(countryId - clickedCountryId) < 0.5) {
                litColor = mix(litColor, vec3(1.0), 0.4);
            }

            // Layer 7: Baked border texture (after brightening so borders stay crisp)
            float border = texture2D(borderMask, vUv).r;
            vec3 borderColor = vec3(0.8, 0.9, 1.0);
            litColor = mix(litColor, borderColor, border * 0.7);

            gl_FragColor = vec4(litColor, 1.0);
        }
    `
});

const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

// ============================================
// Generate Country Mask
// ============================================
function generateMask(geojson) {
    // Clear to black
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, 4096, 2048);

    // Clear border canvas
    borderCtx.clearRect(0, 0, 5400, 2700);

    const features = geojson.features;

    const toMask = (lon, lat) => ({
        x: ((lon + 180) / 360) * 4096,
        y: ((90 - lat) / 180) * 2048
    });

    const toBorder = (lon, lat) => ({
        x: ((lon + 180) / 360) * 5400,
        y: ((90 - lat) / 180) * 2700
    });

    const tracePath = (ctx, polygon, project) => {
        const outer = polygon[0];
        const first = project(outer[0][0], outer[0][1]);
        ctx.moveTo(first.x, first.y);
        for (let j = 1; j < outer.length; j++) {
            const p = project(outer[j][0], outer[j][1]);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        for (let h = 1; h < polygon.length; h++) {
            const hole = polygon[h];
            const hf = project(hole[0][0], hole[0][1]);
            ctx.moveTo(hf.x, hf.y);
            for (let j = 1; j < hole.length; j++) {
                const p = project(hole[j][0], hole[j][1]);
                ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
        }
    };

    // Draw countries
    for (let i = 0; i < features.length; i++) {
        const f = features[i];
        const geom = f.geometry;
        const name = f.properties.ADMIN || f.properties.name || f.properties.NAME || 'Unknown';
        const id = i + 1;

        const r = (id >> 16) & 0xFF;
        const g = (id >> 8) & 0xFF;
        const b = id & 0xFF;

        countryMap.set(id, { name, id });

        const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

        for (const poly of polys) {
            // ID mask fill + stroke with same color to cover anti-aliased edge fringe
            maskCtx.fillStyle = `rgb(${r},${g},${b})`;
            maskCtx.strokeStyle = `rgb(${r},${g},${b})`;
            maskCtx.lineWidth = 3;
            maskCtx.beginPath();
            tracePath(maskCtx, poly, toMask);
            maskCtx.fill();
            maskCtx.stroke();

            // Baked border stroke (white on black, full res)
            borderCtx.strokeStyle = '#ffffff';
            borderCtx.lineWidth = 0.8;
            borderCtx.beginPath();
            tracePath(borderCtx, poly, toBorder);
            borderCtx.stroke();
        }
    }

    maskTexture.needsUpdate = true;
    borderTexture.needsUpdate = true;
}

function getCountryIdAtUV(u, v) {
    const x = Math.floor(u * 4095);
    const y = Math.floor((1 - v) * 2047);
    const p = maskCtx.getImageData(x, y, 1, 1).data;
    // Check if it's a border (white)
    if (p[0] > 250 && p[1] > 250 && p[2] > 250) {
        // Sample nearby to get actual country
        const p2 = maskCtx.getImageData(x + 2, y, 1, 1).data;
        return (p2[0] << 16) | (p2[1] << 8) | p2[2];
    }
    return (p[0] << 16) | (p[1] << 8) | p[2];
}

// ============================================
// Interaction
// ============================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const countryInfo = document.getElementById('country-info');

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(earth);
    
    if (hits.length > 0) {
        const uv = hits[0].uv;
        const id = getCountryIdAtUV(uv.x, uv.y);
        
        if (id > 0) {
            earthMat.uniforms.hoverCountryId.value = id;
            const c = countryMap.get(id);
            if (c) {
                countryInfo.textContent = c.name;
                countryInfo.classList.add('visible');
            }
        } else {
            earthMat.uniforms.hoverCountryId.value = 0;
            countryInfo.classList.remove('visible');
        }
    } else {
        earthMat.uniforms.hoverCountryId.value = 0;
        countryInfo.classList.remove('visible');
    }
});

window.addEventListener('click', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(earth);

    if (hits.length > 0) {
        const id = getCountryIdAtUV(hits[0].uv.x, hits[0].uv.y);
        earthMat.uniforms.clickedCountryId.value = id > 0 ? id : 0;
    } else {
        earthMat.uniforms.clickedCountryId.value = 0;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// Animation
// ============================================
function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.0005;
    controls.update();
    renderer.render(scene, camera);
}

// Load data
fetch('./geoData/world-countries.json')
    .then(r => r.json())
    .then(data => {
        generateMask(data);
        document.getElementById('loading').style.display = 'none';
    });

animate();
