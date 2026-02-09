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
    const ThreeGlobe = (await import('three-globe')).default;

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    const rect = container.getBoundingClientRect();
    const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 2000);
    // Position camera to face Berkeley, CA (37.87°N, 122.27°W)
    const camDist = 220;
    const targetLat = 37.87 * Math.PI / 180;
    const targetLng = -122.27 * Math.PI / 180;
    camera.position.x = camDist * Math.cos(targetLat) * Math.sin(targetLng);
    camera.position.y = camDist * Math.sin(targetLat);
    camera.position.z = camDist * Math.cos(targetLat) * Math.cos(targetLng);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rect.width, rect.height);
    container.appendChild(renderer.domElement);

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

    // --- Custom dot layer using three-globe's built-in lat/lng system ---
    const pinData = pins.map(p => ({ ...p, alt: 0.01 }));

    globe
      .customLayerData(pinData)
      .customThreeObject((d: any) => {
        // Small dot marker
        const geometry = new THREE.SphereGeometry(0.35, 12, 12);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(d.color),
          emissive: new THREE.Color(d.color),
          emissiveIntensity: 0.5,
          shininess: 80,
        });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
      })
      .customThreeObjectUpdate((obj: any, d: any) => {
        // Position the dot using three-globe's coordinate system
        const coords = globe.getCoords(d.lat, d.lng, d.alt);
        if (coords) {
          Object.assign(obj.position, coords);
        }
      });

    scene.add(globe);

    // --- OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    orbitControls = controls;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.15;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 150;
    controls.maxDistance = 500;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;

    // --- Helper: project pin lat/lng to screen coordinates ---
    function pinToScreen(pin: PinData, canvasRect: DOMRect) {
      const coords = globe.getCoords(pin.lat, pin.lng, 0.01);
      if (!coords) return null;

      const worldPos = new THREE.Vector3(coords.x, coords.y, coords.z);

      // Skip pins on back side of globe
      const camToPin = worldPos.clone().sub(camera.position);
      const camToCenter = new THREE.Vector3(0, 0, 0).sub(camera.position);
      if (camToPin.length() > camToCenter.length() + GLOBE_RADIUS * 0.3) return null;

      const projected = worldPos.clone().project(camera);
      return {
        x: (projected.x * 0.5 + 0.5) * canvasRect.width,
        y: (-projected.y * 0.5 + 0.5) * canvasRect.height,
      };
    }

    // --- Pin click detection (screen-space projection) ---
    function onClickHandler(event: MouseEvent) {
      if (selectedPin) return;

      const canvasRect = renderer.domElement.getBoundingClientRect();
      const clickX = event.clientX - canvasRect.left;
      const clickY = event.clientY - canvasRect.top;

      scene.updateMatrixWorld(true);

      let closestPin: PinData | null = null;
      let closestDist = Infinity;
      const PIN_CLICK_RADIUS = 20;

      for (const pin of pins) {
        const screen = pinToScreen(pin, canvasRect);
        if (!screen) continue;

        const dx = clickX - screen.x;
        const dy = clickY - screen.y;
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
      for (const pin of pins) {
        const screen = pinToScreen(pin, canvasRect);
        if (!screen) continue;

        const dist = Math.sqrt((mx - screen.x) ** 2 + (my - screen.y) ** 2);
        if (dist < 20) {
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
      renderer.render(scene, camera);
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
</style>
