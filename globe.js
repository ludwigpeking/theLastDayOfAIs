
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── module-level refs (set during initGlobe) ────────────────────────────────
let scene, camera, renderer, controls;
let earth, earthMat, earthShader, moon;
let maskX, maskT, bordX, bordT;
let spinning = true;
const countryMap = new Map();   // numeric id → rawName
const idToCode   = new Map();   // numeric id → COUNTRIES code

// Called by main.js to reset click highlight (e.g. when closing country panel)
export function setGlobeClick(id) {
    if (earthShader) earthShader.uniforms.uClick.value = id;
}

// ── main initialisation ─────────────────────────────────────────────────────
// callbacks:
//   onReady()                   — GeoJSON loaded, show intro
//   onClick(code, rawName)      — country clicked; null code = click on ocean
//   isInteractive()             — true when game has started (G.role set)
//   isTechOpen()                — true when tech overlay is visible
//   getCountryLabel(code)       — returns "🇺🇸 United States" or similar
//   resolveCountry(rawName)     — maps GeoJSON name → COUNTRIES code or null

export function initGlobe({ onReady, onClick, isInteractive, isTechOpen, getCountryLabel, resolveCountry }) {

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);
    camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 10, 5000000);
    camera.position.set(0, 0, 350);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    document.getElementById('globe-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;  controls.dampingFactor = 0.05;
    controls.minDistance   = 140;   controls.maxDistance   = 900;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const spos = new Float32Array(8000 * 3);
    for (let i = 0; i < 8000; i++) {
        const r = 3000 + Math.random() * 2000, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
        spos[i*3] = r*Math.sin(p)*Math.cos(t);  spos[i*3+1] = r*Math.sin(p)*Math.sin(t);  spos[i*3+2] = r*Math.cos(p);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 })));

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
    sunLight.position.set(500, 50, 500);
    scene.add(sunLight);
    scene.add(sunLight.target);
    scene.add(new THREE.AmbientLight(0x8ba5d3, 0.4));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    moon = new THREE.Mesh(
        new THREE.SphereGeometry(27.3, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1 })
    );
    moon.position.set(6030, 0, 0);
    scene.add(moon);

    // Textures
    const tl = new THREE.TextureLoader();
    const diffTex   = tl.load('mapping/diffuseMap.png');
    const heightTex = tl.load('mapping/height_Map.png');
    const lightTex  = tl.load('mapping/LightMap.png');
    diffTex.colorSpace  = THREE.SRGBColorSpace;
    lightTex.colorSpace = THREE.SRGBColorSpace;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    [diffTex, heightTex, lightTex].forEach(t => { t.anisotropy = maxAniso; });

    // Country mask canvas (kept as canvas — needed for getImageData CPU picking)
    const maskC = document.createElement('canvas');
    maskC.width = 4096;  maskC.height = 2048;
    maskX = maskC.getContext('2d', { willReadFrequently: true });
    maskT = new THREE.CanvasTexture(maskC);
    maskT.minFilter = maskT.magFilter = THREE.NearestFilter;

    // Border: try pre-baked file first (loaded directly to GPU — no canvas needed).
    // Falls back to a CanvasTexture drawn from GeoJSON if file is absent.
    let resolveBordReady;
    const bordReady = new Promise(res => { resolveBordReady = res; });
    bordT = tl.load('mapping/border.png',
        () => { console.log('[globe] border.png loaded from file'); resolveBordReady(false); },
        undefined,
        () => { console.warn('[globe] border.png missing — will draw from GeoJSON'); resolveBordReady(true); }
    );
    // Canvas kept only for the GeoJSON fallback path
    const bordC = document.createElement('canvas');
    bordC.width = 4096;  bordC.height = 2048;
    bordX = bordC.getContext('2d');

    // Earth material — MeshPhongMaterial patched for night-side city lights
    earthMat = new THREE.MeshPhongMaterial({
        map:              diffTex,
        bumpMap:          heightTex,
        bumpScale:        10.0,
        shininess:        10,
        specular:         new THREE.Color(0x222222),
        emissive:         new THREE.Color(0xffffff),
        emissiveMap:      lightTex,
        emissiveIntensity: 1.0,
    });

    earthMat.onBeforeCompile = (shader) => {
        shader.uniforms.uSunDirView = { value: new THREE.Vector3(0, 0, 1) };
        shader.uniforms.uMask   = { value: maskT };
        shader.uniforms.uBorder = { value: bordT };
        shader.uniforms.uHover  = { value: 0.0 };
        shader.uniforms.uClick  = { value: 0.0 };

        // Inject a guaranteed UV varying into the vertex shader
        shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            `varying vec2 vMyUv;
void main() {`
        );
        shader.vertexShader = shader.vertexShader.replace(
            '#include <uv_vertex>',
            `#include <uv_vertex>
vMyUv = uv;`
        );

        // Inject uniforms, helper, and matching varying into fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
            'void main() {',
            `varying vec2 vMyUv;
uniform vec3 uSunDirView;
uniform sampler2D uMask, uBorder;
uniform float uHover, uClick;
float decId(vec3 c){ return c.r*255.*65536.+c.g*255.*256.+c.b*255.; }
void main() {`
        );

        // Mask emissive to night side only, add warm tint
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
float lightAmplitude = clamp(0.1 - dot(normalize(normal), normalize(uSunDirView)), 0.0, 1.0);
totalEmissiveRadiance *= lightAmplitude * vec3(1.0, 0.74, 0.46);`
        );

        // Screen-blend city lights over the lit surface
        shader.fragmentShader = shader.fragmentShader.replace(
            'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',
            `vec3 baseLitColor = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;
vec3 screenBlend = 1.0 - (1.0 - baseLitColor) * (1.0 - totalEmissiveRadiance);
vec3 outgoingLight = mix(baseLitColor + totalEmissiveRadiance, screenBlend, 0.7);`
        );

        // Country overlay before output — try both include names used across Three.js versions
        const overlayGlsl = `vec4 _m = texture2D(uMask, vMyUv); float _id = decId(_m.rgb);
if(_id>0.&&uHover>0.&&abs(_id-uHover)<.5) outgoingLight = mix(outgoingLight, vec3(1.,1.,1.), 0.15);
if(_id>0.&&uClick>0.&&abs(_id-uClick)<.5)  outgoingLight = mix(outgoingLight, vec3(.933,.933,1.), 0.20);
outgoingLight = mix(outgoingLight, vec3(.8,.9,1.), texture2D(uBorder, vMyUv).r * .6);`;

        if (shader.fragmentShader.includes('#include <opaque_fragment>')) {
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <opaque_fragment>',
                `#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
${overlayGlsl}
gl_FragColor = vec4(outgoingLight, diffuseColor.a);`
            );
        } else {
            // Fallback for older Three.js using output_fragment
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <output_fragment>',
                `${overlayGlsl}
#include <output_fragment>`
            );
        }

        earthShader = shader;
    };

    const earthGeo = new THREE.SphereGeometry(100, 128, 128);
    earthGeo.setAttribute('uv2', earthGeo.attributes.uv);
    earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Atmosphere glow
    scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(106, 48, 48),
        new THREE.ShaderMaterial({
            uniforms: { uLight: { value: sunLight.position } },
            vertexShader: `
                uniform vec3 uLight;
                varying float vFresnel;
                varying float vSun;
                void main(){
                    vec3 wn = normalize(mat3(modelMatrix) * normal);
                    vec3 vd = normalize(cameraPosition - (modelMatrix * vec4(position, 1.)).xyz);
                    vFresnel = pow(max(0.0, 1.0 - abs(dot(wn, vd))), 1.8);
                    vSun = smoothstep(-0.2, 0.4, dot(wn, normalize(uLight)));
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
                }`,
            fragmentShader: `
                varying float vFresnel;
                varying float vSun;
                void main(){
                    vec3 inner = vec3(0.55, 0.78, 1.0);
                    vec3 outer = vec3(0.75, 0.88, 1.0);
                    vec3 color  = mix(inner, outer, vFresnel);
                    float alpha = vFresnel * 0.22 * vSun;
                    gl_FragColor = vec4(color, alpha);
                }`,
            side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
        })
    ));

    // ── Build country mask + border texture from GeoJSON ─────────────────────
    function buildMask(geo, drawBorder = true) {
        maskX.clearRect(0, 0, 4096, 2048);
        if (drawBorder) bordX.clearRect(0, 0, 4096, 2048);
        const toM = (lon, lat) => ({ x: ((lon+180)/360)*4096, y: ((90-lat)/180)*2048 });
        const toB = toM;  // same resolution as mask
        const trace = (ctx, poly, proj) => {
            const o = poly[0], f = proj(o[0][0], o[0][1]);
            ctx.moveTo(f.x, f.y);
            for (let j = 1; j < o.length; j++) { const p = proj(o[j][0], o[j][1]); ctx.lineTo(p.x, p.y); }
            ctx.closePath();
            for (let h = 1; h < poly.length; h++) {
                const hole = poly[h], hf = proj(hole[0][0], hole[0][1]);
                ctx.moveTo(hf.x, hf.y);
                for (let j = 1; j < hole.length; j++) { const p = proj(hole[j][0], hole[j][1]); ctx.lineTo(p.x, p.y); }
                ctx.closePath();
            }
        };
        geo.features.forEach((f, i) => {
            const raw = f.properties.ADMIN || f.properties.name || f.properties.NAME || '';
            const id = i + 1;
            const r = (id >> 16) & 0xFF, g = (id >> 8) & 0xFF, b = id & 0xFF;
            countryMap.set(id, raw);
            const code = resolveCountry(raw);
            if (code) idToCode.set(id, code);
            const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
            for (const poly of polys) {
                maskX.fillStyle = `rgb(${r},${g},${b})`; maskX.beginPath(); trace(maskX, poly, toM); maskX.fill();
                if (drawBorder) { bordX.strokeStyle = '#fff'; bordX.lineWidth = 0.35; bordX.beginPath(); trace(bordX, poly, toB); bordX.stroke(); }
            }
        });
        maskT.needsUpdate = true;
        if (drawBorder) bordT.needsUpdate = true;
    }

    function pickId(u, v) {
        const x = Math.floor(u * 4095), y = Math.floor((1 - v) * 2047);
        const p = maskX.getImageData(x, y, 1, 1).data;
        if (p[3] < 200) return 0;
        return (p[0] << 16) | (p[1] << 8) | p[2];
    }

    // ── Input ────────────────────────────────────────────────────────────────
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    const dbgEl = document.getElementById('dbg');
    const hoverLabel = document.getElementById('hover-label');

    window.addEventListener('mousemove', e => {
        if (isTechOpen()) return;
        mouse.x = (e.clientX / innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        ray.setFromCamera(mouse, camera);
        const hits = ray.intersectObject(earth);
        if (hits.length) {
            const uv = hits[0].uv;
            dbgEl.textContent = `${(uv.x*360-180).toFixed(1)}° ${(90-uv.y*180).toFixed(1)}°`;
            const id = pickId(uv.x, uv.y);
            if (earthShader) earthShader.uniforms.uHover.value = id;
            if (id && isInteractive()) {
                const code = idToCode.get(id);
                hoverLabel.textContent = getCountryLabel(code, countryMap.get(id));
                hoverLabel.classList.remove('off');
            } else { hoverLabel.classList.add('off'); }
        } else {
            dbgEl.textContent = '';
            if (earthShader) earthShader.uniforms.uHover.value = 0;
            hoverLabel.classList.add('off');
        }
    });

    window.addEventListener('click', e => {
        if (!isInteractive()) return;
        if (isTechOpen()) return;
        if (e.target.closest('#hud-top,#hud-bot,#panel-country,#tech-overlay,#tech-det,#popup,#btn-tech,#btn-spin')) return;
        mouse.x = (e.clientX / innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        ray.setFromCamera(mouse, camera);
        const hits = ray.intersectObject(earth);
        if (hits.length) {
            const id = pickId(hits[0].uv.x, hits[0].uv.y);
            if (earthShader) earthShader.uniforms.uClick.value = id || 0;
            onClick(id ? idToCode.get(id) : null, id ? countryMap.get(id) : '');
        } else {
            onClick(null, '');
        }
    });

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    // ── Animate ──────────────────────────────────────────────────────────────
    const _sunWorld = new THREE.Vector3();
    const _sunView  = new THREE.Vector3();
    (function animate() {
        requestAnimationFrame(animate);
        if (spinning) earth.rotation.y += 0.00003;
        const t = Date.now() * 0.00002;
        moon.position.set(6030 * Math.cos(t), 0, 6030 * Math.sin(t));
        // Keep uSunDirView in sync with camera orientation
        _sunWorld.copy(sunLight.position).normalize();
        _sunView.copy(_sunWorld).transformDirection(camera.matrixWorldInverse);
        if (earthShader) earthShader.uniforms.uSunDirView.value.copy(_sunView);
        controls.update();
        renderer.render(scene, camera);
    })();

    // ── Load pre-baked textures if available, else draw from GeoJSON ─────────
    function loadImageToCanvas(src, ctx, tex) {
        return new Promise(res => {
            const img = new Image();
            img.onload  = () => { ctx.drawImage(img, 0, 0); tex.needsUpdate = true; res(true); };
            img.onerror = () => res(false);
            img.src = src;
        });
    }

    async function initTextures() {
        // Fetch GeoJSON, load mask canvas, and wait for border result — all in parallel
        const [geo, maskOk, bordFallback] = await Promise.all([
            fetch('./geoData/world-countries.json').then(r => r.json()),
            loadImageToCanvas('mapping/mask.png', maskX, maskT),
            bordReady,
        ]);

        if (maskOk && !bordFallback) {
            // Both pre-baked files loaded — skip all drawing, just build metadata
            console.log('[globe] Pre-baked textures active — skipping GeoJSON drawing');
            geo.features.forEach((f, i) => {
                const raw = f.properties.ADMIN || f.properties.name || f.properties.NAME || '';
                const id = i + 1;
                countryMap.set(id, raw);
                const code = resolveCountry(raw);
                if (code) idToCode.set(id, code);
            });
        } else {
            // Fallback: draw from GeoJSON polygons
            console.warn('[globe] Falling back to GeoJSON drawing (maskOk=' + maskOk + ' bordFallback=' + bordFallback + ')');
            if (bordFallback) {
                // Switch uBorder uniform to the fallback canvas texture
                const canvasBordT = new THREE.CanvasTexture(bordC);
                bordT = canvasBordT;
                if (earthShader) earthShader.uniforms.uBorder.value = canvasBordT;
            }
            buildMask(geo, bordFallback);
        }
    }

    initTextures()
        .catch(() => {
            fetch('./geoData/world-countries.json')
                .then(r => r.json()).then(data => buildMask(data)).catch(() => {});
        })
        .finally(() => {
            document.getElementById('loading').style.display = 'none';
            onReady();
        });
}

// ── Spin toggle (called from HUD button) ─────────────────────────────────────
window.toggleSpin = function () {
    spinning = !spinning;
    const btn = document.getElementById('btn-spin');
    btn.textContent = spinning ? '⏸ STOP SPIN' : '▶ RESUME SPIN';
    btn.classList.toggle('spinning', spinning);
};
