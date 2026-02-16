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

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
      }

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
    <!-- 3D Canvas -->
    <div class="canvas-container" bind:this={container}></div>

    <!-- Bar Counter + Drinks — overlaps bottom of canvas -->
    <div class="bar-area">
      <div class="drinks-row">
        {#each DRINKS as drink}
          <button
            class="drink-item"
            class:hovered={hoveredDrink === drink.id}
            aria-label={t(`bar.drink.${drink.id}`)}
            onmouseenter={() => handleDrinkHover(drink.id)}
            onmouseleave={() => handleDrinkLeave()}
            onclick={() => handleDrinkClick(drink.id)}
            onfocus={() => handleDrinkHover(drink.id)}
            onblur={() => handleDrinkLeave()}
          >
            <div class="coupe-bowl" style="background: {drink.color}"></div>
            <div class="coupe-stem"></div>
            <div class="coupe-base"></div>
          </button>
        {/each}
      </div>
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

  /* Tail pointing to bottom-left (toward robot head) */
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
  }

  .canvas-container :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  /* --- Bar Area: counter-top at 45% height from bottom --- */
  .bar-area {
    position: absolute;
    top: 45%;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
  }

  .drinks-row {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    gap: clamp(3rem, 8vw, 6rem);
    padding-bottom: 6px;
  }

  /* --- Drink (coupe glass) --- */
  .drink-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0.5rem;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    outline: none;
  }

  .drink-item:focus-visible {
    outline: 2px solid #5A636B;
    outline-offset: 4px;
    border-radius: 8px;
  }

  .drink-item.hovered {
    transform: translateY(-10px);
  }

  .coupe-bowl {
    width: 64px;
    height: 36px;
    border-radius: 4px 4px 50% 50%;
    transition: filter 0.25s ease;
  }

  .drink-item.hovered .coupe-bowl {
    filter: brightness(1.08) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08));
  }

  .coupe-stem {
    width: 5px;
    height: 22px;
    background: #d5d0ca;
  }

  .coupe-base {
    width: 36px;
    height: 7px;
    background: #d5d0ca;
    border-radius: 50%;
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
    height: 55vh;
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

    .coupe-bowl {
      width: 44px;
      height: 26px;
    }

    .coupe-stem {
      height: 16px;
    }

    .coupe-base {
      width: 26px;
    }

    .counter-body {
      height: 70px;
    }

    .speech-bubble {
      max-width: 280px;
    }
  }
</style>
