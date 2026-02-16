// ============================================
// Robot Scene Engine (Three.js)
// Handles: scene setup, model loading, animation
// loop, mouth morph targets, and cleanup
// ============================================

import type * as THREE_NS from 'three';

// === Configuration ===

const CAMERA = {
  fov: 28,
  position: [0, 1.0, 4.0] as const,
  lookAt: [0, 0.35, 0] as const,
  near: 0.1,
  far: 100,
} as const;

const LIGHTING = {
  hemisphere: {
    skyColor: 0xfff5e6,
    groundColor: 0xfaf0e4,
    intensity: 1.5,
    position: [0, 10, 0] as const,
  },
  directional: {
    color: 0xfff8f0,
    intensity: 1.0,
    position: [3, 5, 4] as const,
  },
  fill: {
    color: 0xfff0e8,
    intensity: 0.4,
    position: [-3, 3, 2] as const,
  },
} as const;

const ROBOT = {
  modelPath: '/models/RobotExpressive.glb',
  scale: 0.4,
  position: [-0.2, -0.72, 0] as const,
  rotationY: Math.PI * 0.05,
} as const;

const MOUTH = {
  speed: 8,
  amplitude: 0.35,
  closeSpeed: 3,
  morphTarget: 'Surprised',
} as const;

const EMOTE_ACTIONS = ['Wave', 'ThumbsUp', 'Yes', 'No', 'Punch', 'Jump', 'Death'] as const;

// === Public Interface ===

export interface RobotController {
  fadeToAction: (name: string, duration?: number) => void;
  setMouthOpen: (open: boolean) => void;
  dispose: () => void;
}

/**
 * Creates and initializes the robot bar scene.
 * Returns a controller for the Svelte component to interact with.
 */
export async function createRobotScene(
  container: HTMLDivElement,
  onLoaded: () => void,
): Promise<RobotController> {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  // --- Scene & Camera ---
  const scene = new THREE.Scene();
  const rect = container.getBoundingClientRect();
  const camera = new THREE.PerspectiveCamera(
    CAMERA.fov,
    rect.width / rect.height,
    CAMERA.near,
    CAMERA.far,
  );
  camera.position.set(...CAMERA.position);
  camera.lookAt(...CAMERA.lookAt);

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(rect.width, rect.height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // --- Lighting ---
  setupLighting(THREE, scene);

  // --- State ---
  let mixer: THREE_NS.AnimationMixer | null = null;
  let actions: Record<string, THREE_NS.AnimationAction> = {};
  let activeAction: THREE_NS.AnimationAction | null = null;
  let previousAction: THREE_NS.AnimationAction | null = null;
  let face: THREE_NS.Mesh | null = null;
  let mouthAnimating = false;
  let mouthTime = 0;

  // --- Actions ---
  function fadeToAction(name: string, duration = 0.5) {
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
  }

  function setMouthOpen(open: boolean) {
    mouthAnimating = open;
    if (!open) mouthTime = 0;
  }

  // --- Load Model ---
  const loader = new GLTFLoader();
  loader.load(ROBOT.modelPath, (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(ROBOT.scale);
    model.position.set(...ROBOT.position);
    model.rotation.y = ROBOT.rotationY;
    scene.add(model);

    // Find face mesh for morph targets
    model.traverse((child) => {
      const mesh = child as THREE_NS.Mesh;
      if (mesh.isMesh && mesh.morphTargetDictionary?.[MOUTH.morphTarget] !== undefined) {
        face = mesh;
      }
    });

    // Setup animation mixer
    mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      actions[clip.name] = action;

      if ((EMOTE_ACTIONS as readonly string[]).includes(clip.name)) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
      }
    }

    // Intro: Wave → Idle
    if (actions['Wave'] && actions['Idle']) {
      fadeToAction('Wave', 0.2);
      mouthAnimating = true;

      mixer.addEventListener('finished', function onWaveEnd(e: any) {
        if (e.action === actions['Wave']) {
          mixer!.removeEventListener('finished', onWaveEnd);
          fadeToAction('Idle', 0.5);
          mouthAnimating = false;
        }
      });
    } else if (actions['Idle']) {
      fadeToAction('Idle', 0.2);
    }

    onLoaded();
  });

  // --- Animation Loop ---
  const clock = new THREE.Clock();
  let animId: number;

  function animate() {
    animId = requestAnimationFrame(animate);
    const delta = clock.getDelta();

    mixer?.update(delta);
    updateMouth(face, delta);
    renderer.render(scene, camera);
  }

  function updateMouth(face: THREE_NS.Mesh | null, delta: number) {
    if (!face?.morphTargetDictionary || !face.morphTargetInfluences) return;

    const idx = face.morphTargetDictionary[MOUTH.morphTarget];
    if (idx === undefined) return;

    if (mouthAnimating) {
      mouthTime += delta * MOUTH.speed;
      face.morphTargetInfluences[idx] = Math.abs(Math.sin(mouthTime)) * MOUTH.amplitude;
    } else if (face.morphTargetInfluences[idx] > 0) {
      face.morphTargetInfluences[idx] = Math.max(
        0,
        face.morphTargetInfluences[idx] - delta * MOUTH.closeSpeed,
      );
    }
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

  // --- Dispose ---
  function dispose() {
    cancelAnimationFrame(animId);
    resizeObserver.disconnect();
    mixer?.stopAllAction();
    renderer.dispose();

    scene.traverse((obj) => {
      const mesh = obj as THREE_NS.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });

    renderer.domElement.parentNode?.removeChild(renderer.domElement);
  }

  return { fadeToAction, setMouthOpen, dispose };
}

// === Internal Helpers ===

function setupLighting(THREE: typeof THREE_NS, scene: THREE_NS.Scene) {
  const { hemisphere: h, directional: d, fill: f } = LIGHTING;

  const hemiLight = new THREE.HemisphereLight(h.skyColor, h.groundColor, h.intensity);
  hemiLight.position.set(...h.position);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(d.color, d.intensity);
  dirLight.position.set(...d.position);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(f.color, f.intensity);
  fillLight.position.set(...f.position);
  scene.add(fillLight);
}
