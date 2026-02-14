<script lang="ts">
  import { navigate } from 'astro:transitions/client';
  import { subscribe, initLang, t } from '../../i18n/langStore';

  // === Types ===
  type DrinkId = 'pm' | 'ds' | 'visual';

  interface Drink {
    id: DrinkId;
    color: string;
    highlight: string;
    route: string;
    descKey: string;
  }

  // === Constants ===
  const DRINKS: Drink[] = [
    { id: 'pm',     color: '#F0D7D7', highlight: '#f5e4e4', route: '/professional/product-marketing', descKey: 'bar.drink.pm.desc' },
    { id: 'ds',     color: '#D6E6F3', highlight: '#e4eff8', route: '/professional/data-science',      descKey: 'bar.drink.ds.desc' },
    { id: 'visual', color: '#DDEEE7', highlight: '#e8f4ee', route: '/professional/visual-design',     descKey: 'bar.drink.visual.desc' },
  ];

  const DRINK_X = [245, 400, 555];

  // === State ===
  let hoveredDrink = $state<DrinkId | null>(null);
  let isSpeaking   = $state(false);
  let dialogText   = $state('');
  let speechTimeout: ReturnType<typeof setTimeout> | null = null;

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
    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => { isSpeaking = false; }, 1800);
  }

  function handleDrinkLeave() {
    hoveredDrink = null;
    dialogText = t('bar.greeting');
    isSpeaking = false;
    if (speechTimeout) clearTimeout(speechTimeout);
  }

  function handleDrinkClick(drinkId: DrinkId) {
    const drink = DRINKS.find(d => d.id === drinkId)!;
    navigate(drink.route);
  }

  // Eye gaze direction
  function eyeOffsetX(drinkId: DrinkId | null): number {
    if (!drinkId) return 0;
    if (drinkId === 'pm') return -2.5;
    if (drinkId === 'visual') return 2.5;
    return 0;
  }
</script>

<div class="bar-scene">
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg"
       role="img" aria-label="Robot bartender with three drinks">

    <defs>
      <!-- Body highlight gradient -->
      <linearGradient id="body-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0.18" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </linearGradient>
      <!-- Head highlight gradient -->
      <linearGradient id="head-shine" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0.22" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </linearGradient>
      <!-- Glass shine -->
      <linearGradient id="glass-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0.5" />
        <stop offset="50%" stop-color="white" stop-opacity="0.1" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- === Speech Bubble === -->
    <g class="speech-bubble">
      <rect x="245" y="8" width="310" height="60" rx="26" ry="26"
            fill="white" stroke="#e2ded8" stroke-width="1.2" />
      <!-- Tail -->
      <path d="M388,68 L400,84 L412,68" fill="white" />
      <path d="M387,68 L400,85 L413,68" fill="none" stroke="#e2ded8" stroke-width="1.2" />
      <!-- Cover tail-rect junction -->
      <rect x="388" y="64" width="24" height="6" fill="white" />
      <foreignObject x="256" y="14" width="288" height="52">
        <p class="speech-text">{dialogText}</p>
      </foreignObject>
    </g>

    <!-- === Robot (kawaii Baymax-inspired) === -->
    <g class="robot">
      <!-- Antenna -->
      <line x1="400" y1="106" x2="400" y2="88" stroke="#c8c3bc" stroke-width="3"
            stroke-linecap="round" />
      <circle cx="400" cy="84" r="6" fill="#D6E6F3" stroke="#c1d9ea" stroke-width="1" />
      <!-- Antenna glow -->
      <circle cx="400" cy="84" r="6" fill="#D6E6F3" opacity="0.4">
        <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
      </circle>

      <!-- Head — big, round, dominant -->
      <circle cx="400" cy="162" r="62" fill="#eae6e0" stroke="#d5d0ca" stroke-width="1.5" />
      <circle cx="400" cy="162" r="62" fill="url(#head-shine)" />
      <!-- Head top highlight spot -->
      <ellipse cx="385" cy="128" rx="22" ry="12" fill="white" opacity="0.2" />

      <!-- Ears -->
      <circle cx="336" cy="152" r="10" fill="#ddd9d3" stroke="#d5d0ca" stroke-width="1" />
      <circle cx="464" cy="152" r="10" fill="#ddd9d3" stroke="#d5d0ca" stroke-width="1" />
      <!-- Ear inner dots -->
      <circle cx="336" cy="152" r="4" fill="#c8c3bc" />
      <circle cx="464" cy="152" r="4" fill="#c8c3bc" />

      <!-- Visor / eye area -->
      <rect x="362" y="140" width="76" height="36" rx="18" fill="#4a5259" />
      <!-- Eyes (glowing on visor) -->
      <g class="eyes" style="transform: translateX({eyeOffsetX(hoveredDrink)}px)">
        <!-- Left eye -->
        <ellipse cx="382" cy="158" rx="11" ry="12" fill="#a8d8ea" />
        <ellipse cx="382" cy="156" rx="8" ry="9" fill="#c8ecf5" />
        <!-- Left eye sparkle -->
        <circle cx="386" cy="153" r="3" fill="white" opacity="0.85" />
        <circle cx="379" cy="161" r="1.5" fill="white" opacity="0.5" />

        <!-- Right eye -->
        <ellipse cx="418" cy="158" rx="11" ry="12" fill="#a8d8ea" />
        <ellipse cx="418" cy="156" rx="8" ry="9" fill="#c8ecf5" />
        <!-- Right eye sparkle -->
        <circle cx="422" cy="153" r="3" fill="white" opacity="0.85" />
        <circle cx="415" cy="161" r="1.5" fill="white" opacity="0.5" />
      </g>

      <!-- Blush spots — kawaii signature -->
      <ellipse cx="356" cy="178" rx="10" ry="6" fill="#F0D7D7" opacity="0.55" />
      <ellipse cx="444" cy="178" rx="10" ry="6" fill="#F0D7D7" opacity="0.55" />

      <!-- Mouth -->
      <g class="mouth-group" class:speaking={isSpeaking}>
        {#if isSpeaking}
          <!-- Open mouth (talking) -->
          <ellipse cx="400" cy="190" rx="8" ry="5" fill="#4a5259" />
        {:else}
          <!-- Smile arc -->
          <path d="M392,188 Q400,196 408,188" stroke="#4a5259" stroke-width="2.2"
                fill="none" stroke-linecap="round" />
        {/if}
      </g>

      <!-- Neck -->
      <rect x="390" y="220" width="20" height="12" rx="4" fill="#ddd9d3" />

      <!-- Body — short & stubby, Baymax proportions -->
      <rect x="355" y="230" width="90" height="80" rx="28" fill="#eae6e0"
            stroke="#d5d0ca" stroke-width="1.5" />
      <rect x="355" y="230" width="90" height="80" rx="28" fill="url(#body-shine)" />

      <!-- Apron — bartender signature -->
      <path d="M368,256 L368,300 Q400,314 432,300 L432,256 Z"
            fill="white" stroke="#e2ded8" stroke-width="1" opacity="0.85" />
      <!-- Apron strings -->
      <path d="M368,256 Q355,250 348,256" stroke="#e2ded8" stroke-width="1.2"
            fill="none" stroke-linecap="round" />
      <path d="M432,256 Q445,250 452,256" stroke="#e2ded8" stroke-width="1.2"
            fill="none" stroke-linecap="round" />

      <!-- Chest indicator dots (three drink colors) -->
      <circle cx="388" cy="248" r="4.5" fill="#F0D7D7" stroke="white" stroke-width="0.8" />
      <circle cx="400" cy="248" r="4.5" fill="#D6E6F3" stroke="white" stroke-width="0.8" />
      <circle cx="412" cy="248" r="4.5" fill="#DDEEE7" stroke="white" stroke-width="0.8" />

      <!-- Bowtie -->
      <g transform="translate(400,233)">
        <path d="M-8,-4 L0,0 L-8,4 Z" fill="#c8c3bc" />
        <path d="M8,-4 L0,0 L8,4 Z" fill="#c8c3bc" />
        <circle cx="0" cy="0" r="2.5" fill="#b5b0aa" />
      </g>

      <!-- Arms — curved, resting on bar -->
      <!-- Left arm (holding a shaker!) -->
      <path d="M355,255 Q320,280 298,310" stroke="#ddd9d3" stroke-width="16"
            fill="none" stroke-linecap="round" />
      <!-- Left hand -->
      <circle cx="295" cy="314" r="11" fill="#eae6e0" stroke="#d5d0ca" stroke-width="1" />

      <!-- Cocktail shaker in left hand -->
      <g transform="translate(283,280) rotate(-15)">
        <rect x="-6" y="0" width="12" height="28" rx="4" fill="#c8c3bc" stroke="#b5b0aa" stroke-width="0.8" />
        <rect x="-7" y="0" width="14" height="5" rx="2.5" fill="#b5b0aa" />
        <rect x="-4" y="-6" width="8" height="8" rx="3" fill="#d5d0ca" stroke="#c8c3bc" stroke-width="0.8" />
        <circle cx="0" cy="-8" r="2" fill="#b5b0aa" />
      </g>

      <!-- Right arm -->
      <path d="M445,255 Q480,280 502,310" stroke="#ddd9d3" stroke-width="16"
            fill="none" stroke-linecap="round" />
      <!-- Right hand -->
      <circle cx="505" cy="314" r="11" fill="#eae6e0" stroke="#d5d0ca" stroke-width="1" />

      <!-- Stubby feet (just visible below counter) -->
      <ellipse cx="380" cy="312" rx="14" ry="8" fill="#ddd9d3" stroke="#d5d0ca" stroke-width="1" />
      <ellipse cx="420" cy="312" rx="14" ry="8" fill="#ddd9d3" stroke="#d5d0ca" stroke-width="1" />
    </g>

    <!-- === Bar Counter === -->
    <!-- Counter top surface -->
    <rect x="30" y="318" width="740" height="12" rx="4" fill="#d5d0ca" />
    <!-- Counter top edge highlight -->
    <rect x="30" y="318" width="740" height="3" rx="2" fill="#e2ded8" />
    <!-- Counter body -->
    <rect x="30" y="330" width="740" height="190" rx="0" fill="#eae6e0" />
    <!-- Counter panel lines (subtle) -->
    <line x1="290" y1="340" x2="290" y2="510" stroke="#e2ded8" stroke-width="1" />
    <line x1="510" y1="340" x2="510" y2="510" stroke="#e2ded8" stroke-width="1" />

    <!-- === Drinks (coupe glasses on the counter) === -->
    {#each DRINKS as drink, i}
      <g transform="translate({DRINK_X[i]}, 0)">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g class="drink-group"
           class:hovered={hoveredDrink === drink.id}
           role="button"
           tabindex="0"
           aria-label={t(`bar.drink.${drink.id}`)}
           onmouseenter={() => handleDrinkHover(drink.id)}
           onmouseleave={() => handleDrinkLeave()}
           onclick={() => handleDrinkClick(drink.id)}
           onkeydown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               handleDrinkClick(drink.id);
             }
           }}
           onfocus={() => handleDrinkHover(drink.id)}
           onblur={() => handleDrinkLeave()}>

          <!-- Glass bowl (coupe shape) -->
          <path d="M-26,276 Q-28,260 -20,250 Q0,236 20,250 Q28,260 26,276 Z"
                fill={drink.color} stroke={drink.color} stroke-width="0.5" />
          <!-- Glass shine overlay -->
          <path d="M-26,276 Q-28,260 -20,250 Q0,236 20,250 Q28,260 26,276 Z"
                fill="url(#glass-shine)" />
          <!-- Liquid surface rim -->
          <ellipse cx="0" cy="276" rx="26" ry="6" fill={drink.color} />
          <ellipse cx="0" cy="274" rx="18" ry="3.5"
                   fill={drink.highlight} opacity="0.7" />

          <!-- Stem -->
          <rect x="-2.5" y="280" width="5" height="22" rx="2" fill="#d5d0ca" />
          <!-- Base -->
          <ellipse cx="0" cy="303" rx="16" ry="5" fill="#d5d0ca" stroke="#c8c3bc" stroke-width="0.5" />
          <!-- Base top highlight -->
          <ellipse cx="0" cy="302" rx="10" ry="2.5" fill="#e2ded8" opacity="0.5" />

          <!-- Invisible larger click area -->
          <rect x="-38" y="230" width="76" height="90" fill="transparent" />
        </g>
      </g>
    {/each}

  </svg>
</div>

<style>
  .bar-scene {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .bar-scene svg {
    width: 100%;
    max-width: 820px;
    height: auto;
  }

  /* --- Speech Bubble --- */
  .speech-text {
    font-family: inherit;
    font-size: clamp(0.72rem, 0.62rem + 0.45vw, 0.95rem);
    color: #5A636B;
    text-align: center;
    line-height: 1.45;
    margin: 0;
    padding: 0.15rem 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  /* --- Robot idle bobbing --- */
  .robot {
    animation: robot-bob 3s ease-in-out infinite;
  }

  @keyframes robot-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  /* --- Mouth animation --- */
  .mouth-group.speaking ellipse {
    animation: mouth-flap 0.35s ease-in-out infinite;
    transform-origin: 400px 190px;
  }

  @keyframes mouth-flap {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(2.2); }
  }

  /* --- Eye gaze (inline style handles X offset) --- */
  .eyes {
    transition: transform 0.35s ease;
  }

  /* --- Drink Interaction --- */
  .drink-group {
    cursor: pointer;
    outline: none;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .drink-group:focus-visible {
    outline: 2px solid #5A636B;
    outline-offset: 6px;
  }

  .drink-group.hovered {
    transform: translateY(-8px);
  }

  .drink-group:not(.hovered) {
    transform: translateY(0);
  }

  .drink-group.hovered path:first-child {
    filter: brightness(1.06) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08));
  }
</style>
