<script lang="ts">
  import { onMount } from 'svelte';
  import StoryModal from './StoryModal.svelte';
  import { pins, type PinData } from './pins';

  // --- State ---
  let container: HTMLDivElement;
  let selectedPin = $state<PinData | null>(null);
  let orbitControls: any = null;

  onMount(async () => {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');
    const ThreeGlobe = (await import('three-globe')).default;

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    const rect = container.getBoundingClientRect();
    const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 2000);
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rect.width, rect.height);
    container.appendChild(renderer.domElement);

    // CSS2D renderer for HTML pin labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(rect.width, rect.height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // --- Lighting (neutral white to preserve ocean blue color) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(200, 150, 100);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-150, -100, -150);
    scene.add(fillLight);

    // --- Globe ---
    const GLOBE_RADIUS = 100;

    const globe = new ThreeGlobe()
      .globeMaterial(
        new THREE.MeshPhongMaterial({
          color: new THREE.Color('#D6E6F3'),
          emissive: new THREE.Color('#D6E6F3'),
          emissiveIntensity: 0.4,
          shininess: 10,
        })
      )
      .showAtmosphere(true)
      .atmosphereColor('#c5d8e8')
      .atmosphereAltitude(0.15);

    // Load world geometry
    try {
      const topojsonClient = await import('topojson-client');
      const res = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
      const worldData = await res.json();
      const countries = topojsonClient.feature(worldData, worldData.objects.countries);

      globe
        .polygonsData(countries.features)
        .polygonCapColor(() => '#DDEEE7')
        .polygonSideColor(() => '#c8e0d8')
        .polygonStrokeColor(() => '#b8d4ca')
        .polygonAltitude(0.008);
    } catch (err) {
      console.warn('Failed to load world data:', err);
    }

    // --- Custom pin layer using three-globe's built-in lat/lng system ---
    // This ensures pins stay in sync with the globe's rotation automatically.
    const pinData = pins.map(p => ({ ...p, alt: 0.01 }));

    globe
      .customLayerData(pinData)
      .customThreeObject((d: any) => {
        // Teardrop / water-drop shape via LatheGeometry
        // 2D profile: rounded at bottom, tapers to a point at top
        const points: InstanceType<typeof THREE.Vector2>[] = [];
        const SEGMENTS = 24;
        for (let i = 0; i <= SEGMENTS; i++) {
          const t = i / SEGMENTS; // 0 = bottom tip, 1 = top
          const angle = t * Math.PI;
          // Radius: bulges in upper half, tapers to point at bottom
          const r = Math.sin(angle) * (0.6 + t * 0.5);
          const y = t * 4.0; // total height ~4 units
          points.push(new THREE.Vector2(r * 1.0, y));
        }
        // Ensure bottom tip closes to 0
        points[0] = new THREE.Vector2(0, 0);

        const geometry = new THREE.LatheGeometry(points, 16);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(d.color),
          emissive: new THREE.Color(d.color),
          emissiveIntensity: 0.4,
          shininess: 60,
          transparent: true,
          opacity: 0.85,
        });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
      })
      .customThreeObjectUpdate((obj: any, d: any) => {
        // Position the pin using three-globe's coordinate system
        const coords = globe.getCoords(d.lat, d.lng, d.alt);
        if (coords) {
          Object.assign(obj.position, coords);

          // Orient pin to point radially outward from globe center
          const normal = new THREE.Vector3(coords.x, coords.y, coords.z).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
          obj.quaternion.copy(quaternion);
        }
      });

    scene.add(globe);

    // --- CSS2D labels for pin cities (added to scene, positioned in animate) ---
    const labelObjects: { label: any; pin: PinData }[] = [];
    for (const pin of pins) {
      const labelEl = document.createElement('div');
      labelEl.className = 'pin-label-3d';
      labelEl.textContent = pin.city;
      const label = new CSS2DObject(labelEl);
      scene.add(label);
      labelObjects.push({ label, pin });
    }

    // --- OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    orbitControls = controls;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 150;
    controls.maxDistance = 500;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;

    // --- Pin click detection (screen-space projection) ---
    function onClickHandler(event: MouseEvent) {
      if (selectedPin) return;

      const canvasRect = renderer.domElement.getBoundingClientRect();
      const clickX = event.clientX - canvasRect.left;
      const clickY = event.clientY - canvasRect.top;

      scene.updateMatrixWorld(true);

      let closestPin: PinData | null = null;
      let closestDist = Infinity;
      const PIN_CLICK_RADIUS = 30;

      for (const { label, pin } of labelObjects) {
        const worldPos = new THREE.Vector3();
        label.getWorldPosition(worldPos);

        // Skip pins on back side of globe
        const camToPin = worldPos.clone().sub(camera.position);
        const camToCenter = new THREE.Vector3(0, 0, 0).sub(camera.position);
        if (camToPin.length() > camToCenter.length() + GLOBE_RADIUS * 0.3) continue;

        const projected = worldPos.clone().project(camera);
        const screenX = (projected.x * 0.5 + 0.5) * canvasRect.width;
        const screenY = (-projected.y * 0.5 + 0.5) * canvasRect.height;

        const dx = clickX - screenX;
        const dy = clickY - screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PIN_CLICK_RADIUS && dist < closestDist) {
          closestDist = dist;
          closestPin = pin;
        }
      }

      if (closestPin) {
        selectedPin = closestPin;
        controls.autoRotate = false;
      }
    }

    let mouseDownPos = { x: 0, y: 0 };
    let mouseDownTime = 0;
    renderer.domElement.addEventListener('pointerdown', (e) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      mouseDownTime = Date.now();
    });
    renderer.domElement.addEventListener('pointerup', (e) => {
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      const elapsed = Date.now() - mouseDownTime;
      if (Math.sqrt(dx * dx + dy * dy) < 10 && elapsed < 500) {
        onClickHandler(e);
      }
    });

    // --- Hover cursor ---
    function onMoveHandler(event: MouseEvent) {
      const canvasRect = renderer.domElement.getBoundingClientRect();
      const mx = event.clientX - canvasRect.left;
      const my = event.clientY - canvasRect.top;

      let hovering = false;
      for (const { label } of labelObjects) {
        const worldPos = new THREE.Vector3();
        label.getWorldPosition(worldPos);

        const camToPin = worldPos.clone().sub(camera.position);
        const camToCenter = new THREE.Vector3(0, 0, 0).sub(camera.position);
        if (camToPin.length() > camToCenter.length() + GLOBE_RADIUS * 0.3) continue;

        const projected = worldPos.clone().project(camera);
        const sx = (projected.x * 0.5 + 0.5) * canvasRect.width;
        const sy = (-projected.y * 0.5 + 0.5) * canvasRect.height;
        const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
        if (dist < 30) {
          hovering = true;
          break;
        }
      }
      renderer.domElement.style.cursor = hovering ? 'pointer' : 'grab';
    }
    renderer.domElement.addEventListener('mousemove', onMoveHandler);

    // --- Animation Loop ---
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Update CSS2D label positions to match globe's lat/lng
      for (const { label, pin } of labelObjects) {
        const coords = globe.getCoords(pin.lat, pin.lng, 0.04);
        if (coords) {
          label.position.set(coords.x, coords.y, coords.z);
        }
      }

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    }
    animate();

    // --- Resize ---
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.removeEventListener('mousemove', onMoveHandler);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (labelRenderer.domElement.parentNode) {
        labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
      }
    };
  });

  function handleCloseModal() {
    selectedPin = null;
    if (orbitControls) {
      orbitControls.autoRotate = true;
    }
  }
</script>

<div class="globe-container" bind:this={container}></div>

{#if selectedPin}
  <StoryModal pin={selectedPin} onClose={handleCloseModal} />
{/if}

<style>
  .globe-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  :global(.pin-label-3d) {
    font-family: 'EB Garamond', Garamond, serif;
    font-size: 11px;
    font-weight: 500;
    color: #5A636B;
    white-space: nowrap;
    pointer-events: none;
    text-shadow:
      0 0 3px rgba(250, 247, 242, 0.95),
      0 0 6px rgba(250, 247, 242, 0.8);
    transform: translateY(-6px);
  }
</style>
