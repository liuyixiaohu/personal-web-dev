<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import { subscribe, initLang, t } from '../../i18n/langStore';

  // === Types ===
  type DrinkId = 'pm' | 'ds' | 'visual';

  interface Drink {
    id: DrinkId;
    color: string;
    route: string;
    descKey: string;
  }

  // === Constants ===
  const DRINKS: Drink[] = [
    { id: 'pm',     color: '#F0D7D7', route: '/professional/product-marketing', descKey: 'bar.drink.pm.desc' },
    { id: 'ds',     color: '#D6E6F3', route: '/professional/data-science',      descKey: 'bar.drink.ds.desc' },
    { id: 'visual', color: '#DDEEE7', route: '/professional/visual-design',     descKey: 'bar.drink.visual.desc' },
  ];

  // === State ===
  let container: HTMLDivElement;
  let hoveredDrink = $state<DrinkId | null>(null);
  let isSpeaking   = $state(false);
  let dialogText   = $state('');
  let isLoaded     = $state(false);
  let speechTimeout: ReturnType<typeof setTimeout> | null = null;

  // Three.js refs (set inside onMount)
  let fadeToAction: ((name: string, duration?: number) => void) | null = null;
  let setMouthOpen: ((open: boolean) => void) | null = null;
  let drinkMeshes: Map<DrinkId, any> = new Map();

  // === i18n ===
  initLang();
  dialogText = t('bar.greeting');

  $effect(() => {
    const unsub = subscribe(() => {
      if (hoveredDrink) {
        const drink = DRINKS.find(d => d.id === hoveredDrink)!;
        dialogText = t(drink.descKey);
      } else {
        dialogText = t('bar.greeting');
      }
    });
    return unsub;
  });

  // === Handlers ===
  function handleDrinkHover(drinkId: DrinkId) {
    hoveredDrink = drinkId;
    const drink = DRINKS.find(d => d.id === drinkId)!;
    dialogText = t(drink.descKey);
    isSpeaking = true;

    // Animate drink glass
    const drinkMesh = drinkMeshes.get(drinkId);
    if (drinkMesh) {
      drinkMesh.userData.targetY = 0.15; // Lift up slightly
    }

    // Robot reaction
    fadeToAction?.('ThumbsUp', 0.4);
    setMouthOpen?.(true);

    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
      isSpeaking = false;
      setMouthOpen?.(false);
    }, 1800);
  }

  function handleDrinkLeave() {
    hoveredDrink = null;
    dialogText = t('bar.greeting');
    isSpeaking = false;
    setMouthOpen?.(false);

    // Reset all drink glasses
    drinkMeshes.forEach(mesh => {
      mesh.userData.targetY = 0;
    });

    fadeToAction?.('Idle', 0.5);

    if (speechTimeout) clearTimeout(speechTimeout);
  }

  function handleDrinkClick(drinkId: DrinkId) {
    const drink = DRINKS.find(d => d.id === drinkId)!;
    navigate(drink.route);
  }

  // === Three.js Setup ===
  onMount(async () => {
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

    // --- Scene ---
    const scene = new THREE.Scene();

    const rect = container.getBoundingClientRect();
    const camera = new THREE.PerspectiveCamera(28, rect.width / rect.height, 0.1, 100);
    camera.position.set(0, 1.0, 4.0);
    camera.lookAt(0, 0.35, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(rect.width, rect.height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- Lighting (warm tones to match site) ---
    const hemiLight = new THREE.HemisphereLight(0xfff5e6, 0xfaf0e4, 1.5);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff8f0, 1.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xfff0e8, 0.4);
    fillLight.position.set(-3, 3, 2);
    scene.add(fillLight);

    // --- Create 3D Coupe Glasses ---
    function createCoupeGlass(color: string) {
      const group = new THREE.Group();

      // Glass material (transparent with slight tint)
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
        envMapIntensity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });

      // Liquid material (colored, semi-transparent)
      const liquidMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.6,
        thickness: 0.3,
      });

      // Bowl (wide shallow cup)
      const bowlGeometry = new THREE.SphereGeometry(0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
      const bowl = new THREE.Mesh(bowlGeometry, glassMaterial);
      bowl.position.y = 0.1;
      group.add(bowl);

      // Liquid inside
      const liquidGeometry = new THREE.SphereGeometry(0.075, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
      const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
      liquid.position.y = 0.095;
      group.add(liquid);

      // Stem
      const stemGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8);
      const stemMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e4de,
        metalness: 0.1,
        roughness: 0.3,
      });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = 0.045;
      group.add(stem);

      // Base
      const baseGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.01, 16);
      const base = new THREE.Mesh(baseGeometry, stemMaterial);
      base.position.y = 0.005;
      group.add(base);

      // Animation data
      group.userData.targetY = 0;
      group.userData.currentY = 0;

      return group;
    }

    // Position glasses on bar counter (Y = -0.6 is counter-top level in world space)
    const glassPositions = [
      { id: 'pm' as DrinkId, x: -0.5, z: -0.6 },
      { id: 'ds' as DrinkId, x: 0, z: -0.6 },
      { id: 'visual' as DrinkId, x: 0.5, z: -0.6 },
    ];

    glassPositions.forEach(pos => {
      const drink = DRINKS.find(d => d.id === pos.id)!;
      const glass = createCoupeGlass(drink.color);
      glass.position.set(pos.x, -0.6, pos.z);
      scene.add(glass);
      drinkMeshes.set(pos.id, glass);
    });

    // --- Load Robot Model ---
    const loader = new GLTFLoader();
    let mixer: THREE.AnimationMixer | null = null;
    let actions: Record<string, THREE.AnimationAction> = {};
    let activeAction: THREE.AnimationAction | null = null;
    let previousAction: THREE.AnimationAction | null = null;
    let face: THREE.Mesh | null = null;
    let mouthAnimating = false;
    let mouthTime = 0;

    // Expose fadeToAction for handlers
    fadeToAction = (name: string, duration = 0.5) => {
      if (!actions[name]) return;
      previousAction = activeAction;
      activeAction = actions[name];

      if (previousAction && previousAction !== activeAction) {
        previousAction.fadeOut(duration);
      }

      activeAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(duration)
        .play();
    };

    setMouthOpen = (open: boolean) => {
      mouthAnimating = open;
      if (!open) mouthTime = 0;
    };

    loader.load('/models/RobotExpressive.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.4, 0.4, 0.4);
      model.position.set(0, -0.6, 0);
      model.rotation.y = Math.PI * 0.05;
      scene.add(model);

      // Find face mesh for morph targets
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetDictionary) {
          if ((child as THREE.Mesh).morphTargetDictionary?.['Surprised'] !== undefined) {
            face = child as THREE.Mesh;
          }
        }
      });

      // Setup animation mixer and actions
      mixer = new THREE.AnimationMixer(model);
      const emoteActions = ['Wave', 'ThumbsUp', 'Yes', 'No', 'Punch', 'Jump', 'Death'];

      for (const clip of gltf.animations) {
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;

        if (emoteActions.includes(clip.name)) {
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
        }
      }

      // Intro: Wave, then transition to Idle
      if (actions['Wave'] && actions['Idle']) {
        fadeToAction!('Wave', 0.2);
        mouthAnimating = true;

        mixer.addEventListener('finished', function onWaveEnd(e: any) {
          if (e.action === actions['Wave']) {
            mixer!.removeEventListener('finished', onWaveEnd);
            fadeToAction!('Idle', 0.5);
            mouthAnimating = false;
          }
        });
      } else if (actions['Idle']) {
        fadeToAction!('Idle', 0.2);
      }

      isLoaded = true;
    });

    // --- Raycaster for glass interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event: MouseEvent) {
      const canvasRect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const glassArray = Array.from(drinkMeshes.values());
      const intersects = raycaster.intersectObjects(glassArray, true);

      if (intersects.length > 0) {
        const intersectedGroup = intersects[0].object.parent;
        const drinkId = Array.from(drinkMeshes.entries()).find(([_, mesh]) => mesh === intersectedGroup)?.[0];
        if (drinkId && drinkId !== hoveredDrink) {
          handleDrinkHover(drinkId);
        }
      } else if (hoveredDrink) {
        handleDrinkLeave();
      }
    }

    function onMouseClick(event: MouseEvent) {
      if (hoveredDrink) {
        handleDrinkClick(hoveredDrink);
      }
    }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onMouseClick);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
      }

      // Animate glass lift on hover
      drinkMeshes.forEach(glass => {
        glass.userData.currentY += (glass.userData.targetY - glass.userData.currentY) * 0.1;
        glass.position.y = -0.6 + glass.userData.currentY;
      });

      // Mouth morph target animation
      if (mouthAnimating && face && face.morphTargetDictionary && face.morphTargetInfluences) {
        mouthTime += delta * 8;
        const idx = face.morphTargetDictionary['Surprised'];
        if (idx !== undefined) {
          face.morphTargetInfluences[idx] = Math.abs(Math.sin(mouthTime)) * 0.35;
        }
      } else if (face && face.morphTargetDictionary && face.morphTargetInfluences) {
        // Smoothly close mouth
        const idx = face.morphTargetDictionary['Surprised'];
        if (idx !== undefined && face.morphTargetInfluences[idx] > 0) {
          face.morphTargetInfluences[idx] = Math.max(0, face.morphTargetInfluences[idx] - delta * 3);
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // --- Resize ---
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onMouseClick);
      mixer?.stopAllAction();
      renderer.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  });
</script>

<div class="robot-bar-scene">
  <!-- Speech Bubble -->
  <div class="speech-bubble" class:visible={isLoaded}>
    <p class="speech-text">{dialogText}</p>
  </div>

  <!-- Stage: canvas + overlapping bar -->
  <div class="stage">
    <!-- 3D Canvas (includes robot + glasses) -->
    <div class="canvas-container" bind:this={container}></div>

    <!-- Bar Counter only (no CSS drinks) -->
    <div class="bar-area">
      <div class="bar-counter">
        <div class="counter-top"></div>
        <div class="counter-body"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .robot-bar-scene {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: var(--space-sm) 0 0 0;
  }

  /* --- Speech Bubble --- */
  .speech-bubble {
    position: absolute;
    top: clamp(0.5rem, 4vh, 1.5rem);
    left: 50%;
    transform: translateX(15%);
    max-width: 380px;
    width: auto;
    padding: 0.55rem 1.2rem;
    background: white;
    border: 1.2px solid #e2ded8;
    border-radius: 26px;
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: 3;
  }

  .speech-bubble.visible {
    opacity: 1;
  }

  /* Tail pointing downward */
  .speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -9px;
    left: 20%;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 9px solid white;
  }

  .speech-bubble::before {
    content: '';
    position: absolute;
    bottom: -11px;
    left: calc(20% - 1px);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #e2ded8;
  }

  .speech-text {
    font-family: inherit;
    font-size: clamp(0.72rem, 0.62rem + 0.45vw, 0.95rem);
    color: #5A636B;
    text-align: center;
    line-height: 1.45;
    margin: 0;
  }

  /* --- Stage: layered canvas + bar --- */
  .stage {
    position: relative;
    width: 100%;
  }

  /* --- 3D Canvas --- */
  .canvas-container {
    width: 100%;
    height: 58vh;
    min-height: 340px;
    max-height: 600px;
    position: relative;
    z-index: 1;
    cursor: pointer;
  }

  .canvas-container :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  /* --- Bar Area --- */
  .bar-area {
    position: absolute;
    top: 65%;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    pointer-events: none; /* Let raycaster handle glass clicks */
  }

  /* --- Bar Counter --- */
  .bar-counter {
    position: relative;
    width: 100%;
  }

  .counter-top {
    height: 12px;
    background: #d5d0ca;
    border-radius: 4px 4px 0 0;
    box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.3);
  }

  .counter-body {
    height: 35vh;
    background: #eae6e0;
    border-radius: 0;
  }

  /* --- Responsive --- */
  @media (max-width: 480px) {
    .robot-bar-scene {
      padding: var(--space-xs);
    }

    .stage {
      width: 92%;
    }

    .canvas-container {
      height: 45vh;
      min-height: 260px;
    }

    .counter-body {
      height: 70px;
    }

    .speech-bubble {
      max-width: 280px;
    }
  }
</style>
