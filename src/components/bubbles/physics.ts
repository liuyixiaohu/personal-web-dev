// ============================================
// Bubble Physics Engine
// Handles: floating motion, boundary bouncing,
// collision detection, and route resolution
// ============================================

export type BubbleId = 'pm' | 'ds' | 'visual';

export interface BubbleConfig {
  id: BubbleId;
  color: string;
}

export interface BubbleState {
  id: BubbleId;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isDragging: boolean;
  // Sinusoidal floating parameters
  floatPhase: number;
  floatFreq: number;
  floatAmpX: number;
  floatAmpY: number;
  // Base position (center of floating orbit)
  baseX: number;
  baseY: number;
}

// === Bubble Configurations ===

export const BUBBLE_CONFIGS: BubbleConfig[] = [
  { id: 'pm', color: '#F0D7D7' },
  { id: 'ds', color: '#D6E6F3' },
  { id: 'visual', color: '#DDEEE7' },
];

// === Route Tables ===

const CLICK_ROUTES: Record<BubbleId, string> = {
  pm: '/professional/product-marketing',
  ds: '/professional/data-science',
  visual: '/professional/visual-design',
};

type CollisionKey = `${BubbleId}+${BubbleId}`;

const COLLISION_ROUTES: Record<string, string> = {
  'ds+pm': '/professional/quant-insights',
  'pm+ds': '/professional/quant-insights',
  'pm+visual': '/professional/brand-narrative',
  'visual+pm': '/professional/brand-narrative',
  'ds+visual': '/professional/information-design',
  'visual+ds': '/professional/information-design',
};

export function getClickRoute(id: BubbleId): string {
  return CLICK_ROUTES[id];
}

export function getCollisionRoute(a: BubbleId, b: BubbleId): string | undefined {
  const key: CollisionKey = `${a}+${b}`;
  return COLLISION_ROUTES[key];
}

// === Initialization ===

export function createBubbles(
  containerWidth: number,
  containerHeight: number,
): BubbleState[] {
  // Responsive bubble radius
  const minDim = Math.min(containerWidth, containerHeight);
  const radius = Math.max(45, Math.min(75, minDim * 0.1));

  // Spread bubbles evenly across the container
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const spread = Math.min(containerWidth, containerHeight) * 0.25;

  const positions = [
    { x: centerX - spread, y: centerY - spread * 0.3 },   // PM: upper-left
    { x: centerX + spread, y: centerY - spread * 0.3 },   // DS: upper-right
    { x: centerX, y: centerY + spread * 0.5 },            // Visual: lower-center
  ];

  return BUBBLE_CONFIGS.map((config, i) => ({
    ...config,
    x: positions[i].x,
    y: positions[i].y,
    vx: 0,
    vy: 0,
    radius,
    isDragging: false,
    floatPhase: (Math.PI * 2 * i) / 3,         // Offset phases
    floatFreq: 0.3 + Math.random() * 0.2,      // 0.3–0.5 Hz
    floatAmpX: 8 + Math.random() * 12,          // 8–20px
    floatAmpY: 6 + Math.random() * 10,          // 6–16px
    baseX: positions[i].x,
    baseY: positions[i].y,
  }));
}

// === Physics Update (per frame) ===

const DAMPING = 0.95;
const BOUNDARY_BOUNCE = 0.6;
const FLOAT_SPEED = 1; // time multiplier

export function updateBubble(
  bubble: BubbleState,
  dt: number, // delta time in seconds
  time: number, // elapsed time in seconds
  containerWidth: number,
  containerHeight: number,
): void {
  if (bubble.isDragging) return;

  // Apply floating motion (sinusoidal offset from base position)
  const t = time * FLOAT_SPEED;
  const floatX = Math.sin(t * bubble.floatFreq * Math.PI * 2 + bubble.floatPhase) * bubble.floatAmpX;
  const floatY = Math.cos(t * bubble.floatFreq * Math.PI * 2 + bubble.floatPhase * 1.3) * bubble.floatAmpY;

  // If bubble has velocity (e.g. after drag release), apply it
  if (Math.abs(bubble.vx) > 0.1 || Math.abs(bubble.vy) > 0.1) {
    bubble.baseX += bubble.vx * dt;
    bubble.baseY += bubble.vy * dt;
    bubble.vx *= DAMPING;
    bubble.vy *= DAMPING;
  }

  // Target position = base + float offset
  bubble.x = bubble.baseX + floatX;
  bubble.y = bubble.baseY + floatY;

  // Boundary clamping (keep base within bounds)
  const r = bubble.radius;
  if (bubble.baseX - r < 0) {
    bubble.baseX = r;
    bubble.vx = Math.abs(bubble.vx) * BOUNDARY_BOUNCE;
  }
  if (bubble.baseX + r > containerWidth) {
    bubble.baseX = containerWidth - r;
    bubble.vx = -Math.abs(bubble.vx) * BOUNDARY_BOUNCE;
  }
  if (bubble.baseY - r < 0) {
    bubble.baseY = r;
    bubble.vy = Math.abs(bubble.vy) * BOUNDARY_BOUNCE;
  }
  if (bubble.baseY + r > containerHeight) {
    bubble.baseY = containerHeight - r;
    bubble.vy = -Math.abs(bubble.vy) * BOUNDARY_BOUNCE;
  }
}

// === Collision Detection ===

export interface CollisionResult {
  a: BubbleId;
  b: BubbleId;
  midX: number;
  midY: number;
}

export function checkCollisions(bubbles: BubbleState[]): CollisionResult | null {
  for (let i = 0; i < bubbles.length; i++) {
    for (let j = i + 1; j < bubbles.length; j++) {
      const a = bubbles[i];
      const b = bubbles[j];

      // Only check collision when at least one bubble is being dragged
      // (natural floating shouldn't trigger collisions)
      if (!a.isDragging && !b.isDragging) continue;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist * 0.85) {
        // Collision! Return midpoint for burst effect
        return {
          a: a.id,
          b: b.id,
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2,
        };
      }
    }
  }
  return null;
}

// === Drag Helpers ===

export function startDrag(bubble: BubbleState): void {
  bubble.isDragging = true;
  bubble.vx = 0;
  bubble.vy = 0;
}

export function moveDrag(bubble: BubbleState, x: number, y: number, prevX: number, prevY: number, dt: number): void {
  bubble.x = x;
  bubble.y = y;
  bubble.baseX = x;
  bubble.baseY = y;
  // Track velocity for inertia on release
  if (dt > 0) {
    bubble.vx = (x - prevX) / dt;
    bubble.vy = (y - prevY) / dt;
  }
}

export function endDrag(bubble: BubbleState): void {
  bubble.isDragging = false;
  // Velocity is already set from moveDrag — inertia kicks in
  // Clamp max velocity
  const maxVel = 800;
  bubble.vx = Math.max(-maxVel, Math.min(maxVel, bubble.vx));
  bubble.vy = Math.max(-maxVel, Math.min(maxVel, bubble.vy));
}
