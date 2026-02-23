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
  position: [-0.8, -0.72, 0] as const,
  rotationY: Math.PI * 0.05,
} as const;

const MOUTH = {
  speed: 8,
  amplitude: 0.35,
  closeSpeed: 3,
  morphTarget: 'Surprised',
} as const;

const BACKGROUND = {
  topColor: '#E4DDD2',
  bottomColor: '#E4DDD2',
  height: 256,
} as const;

const WALL_CLOCK = {
  position: [0.25, 1.15, 0.0] as const,
  radius: 0.3,
  colors: {
    face: 0xfaf7f2,       // cream white
    rim: 0xc8c3bc,        // warm gray border
    tick: 0x8a9199,        // subtle gray
    hand: 0x5a636b,        // dark gray
    second: 0xc17f59,      // warm copper
    center: 0x5a636b,
  },
  // Classic display time: 10:10:30 (symmetric V)
  staticTime: { h: 10, m: 10, s: 30 },
} as const;

const DEG2RAD = Math.PI / 180;

const EMOTE_ACTIONS = ['Wave', 'ThumbsUp', 'Yes', 'No', 'Punch', 'Jump', 'Death'] as const;

// === Public Interface ===

export interface RobotController {
  fadeToAction: (name: string, duration?: number) => void;
  setMouthOpen: (open: boolean) => void;
  setClockAlive: (alive: boolean) => void;
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

  // --- Background & Lighting ---
  setupBackground(THREE, scene);
  setupLighting(THREE, scene);

  // --- Wall Clock ---
  const wallClock = createWallClock(THREE, scene);

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

  function setClockAlive(alive: boolean) {
    wallClock.setAlive(alive);
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
    wallClock.update();
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

  return { fadeToAction, setMouthOpen, setClockAlive, dispose };
}

// === Internal Helpers ===

function setupBackground(THREE: typeof THREE_NS, scene: THREE_NS.Scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = BACKGROUND.height;

  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, BACKGROUND.height);
  grad.addColorStop(0, BACKGROUND.topColor);
  grad.addColorStop(1, BACKGROUND.bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, BACKGROUND.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  scene.background = texture;
}

interface WallClockHandle {
  update: () => void;
  setAlive: (alive: boolean) => void;
}

function createWallClock(THREE: typeof THREE_NS, scene: THREE_NS.Scene): WallClockHandle {
  const C = WALL_CLOCK;
  const R = C.radius;

  const group = new THREE.Group();
  group.position.set(...C.position);

  // --- Face (cream circle) ---
  const faceMat = new THREE.MeshStandardMaterial({
    color: C.colors.face,
    roughness: 0.9,
    metalness: 0.0,
  });
  const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(R * 0.92, 64), faceMat);
  faceMesh.position.z = 0.005;
  group.add(faceMesh);

  // --- Rim (outer ring) ---
  const rimMat = new THREE.MeshStandardMaterial({
    color: C.colors.rim,
    roughness: 0.6,
    metalness: 0.1,
  });
  const rimMesh = new THREE.Mesh(new THREE.RingGeometry(R * 0.9, R, 64), rimMat);
  rimMesh.position.z = 0.003;
  group.add(rimMesh);

  // --- Hour ticks (12 marks) ---
  const tickMat = new THREE.MeshStandardMaterial({ color: C.colors.tick });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const isQuarter = i % 3 === 0;
    const len = isQuarter ? R * 0.14 : R * 0.08;
    const width = isQuarter ? R * 0.035 : R * 0.02;
    const tickGeo = new THREE.PlaneGeometry(width, len);
    const tick = new THREE.Mesh(tickGeo, tickMat);

    // Position at the inner edge of the rim
    const dist = R * 0.82 - len / 2;
    tick.position.x = Math.sin(angle) * dist;
    tick.position.y = Math.cos(angle) * dist;
    tick.position.z = 0.008;
    tick.rotation.z = -angle;
    group.add(tick);
  }

  // --- Hands ---
  const handMat = new THREE.MeshStandardMaterial({
    color: C.colors.hand,
    roughness: 0.5,
    metalness: 0.2,
  });
  const secMat = new THREE.MeshStandardMaterial({
    color: C.colors.second,
    roughness: 0.4,
    metalness: 0.3,
  });

  // Hour hand: short, thick
  const hourLen = R * 0.5;
  const hourGeo = new THREE.PlaneGeometry(R * 0.045, hourLen);
  hourGeo.translate(0, hourLen / 2, 0); // pivot at bottom
  const hourHand = new THREE.Mesh(hourGeo, handMat);
  hourHand.position.z = 0.012;
  group.add(hourHand);

  // Minute hand: longer, thinner
  const minLen = R * 0.72;
  const minGeo = new THREE.PlaneGeometry(R * 0.03, minLen);
  minGeo.translate(0, minLen / 2, 0);
  const minuteHand = new THREE.Mesh(minGeo, handMat);
  minuteHand.position.z = 0.014;
  group.add(minuteHand);

  // Second hand: longest, thinnest, copper
  const secLen = R * 0.78;
  const secGeo = new THREE.PlaneGeometry(R * 0.012, secLen);
  secGeo.translate(0, secLen / 2, 0);
  const secondHand = new THREE.Mesh(secGeo, secMat);
  secondHand.position.z = 0.016;
  secondHand.visible = false; // hidden until alive
  group.add(secondHand);

  // --- Center dot ---
  const dotMat = new THREE.MeshStandardMaterial({ color: C.colors.center });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(R * 0.05, 24), dotMat);
  dot.position.z = 0.018;
  group.add(dot);

  scene.add(group);

  // --- State ---
  let alive = false;

  // Set initial static time (10:10:30)
  setHandsToTime(C.staticTime.h, C.staticTime.m, C.staticTime.s);

  function setHandsToTime(h: number, m: number, s: number) {
    hourHand.rotation.z = -((h % 12) * 30 + m * 0.5) * DEG2RAD;
    minuteHand.rotation.z = -(m * 6 + s * 0.1) * DEG2RAD;
    secondHand.rotation.z = -(s * 6) * DEG2RAD;
  }

  function update() {
    if (!alive) return;
    const now = new Date();
    setHandsToTime(now.getHours(), now.getMinutes(), now.getSeconds());
  }

  function setAlive(isAlive: boolean) {
    alive = isAlive;
    secondHand.visible = isAlive;
    if (!isAlive) {
      setHandsToTime(C.staticTime.h, C.staticTime.m, C.staticTime.s);
    }
  }

  return { update, setAlive };
}

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
