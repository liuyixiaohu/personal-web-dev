<script lang="ts">
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

  const DRINK_X = [250, 400, 550];

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
    speechTimeout = setTimeout(() => { isSpeaking = false; }, 1500);
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
</script>

<div class="bar-scene">
  <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg"
       role="img" aria-label="Robot bartender with three drinks">

    <!-- === Speech Bubble === -->
    <g class="speech-bubble">
      <rect x="270" y="15" width="260" height="58" rx="22" ry="22"
            fill="white" stroke="#e2ded8" stroke-width="1" />
      <polygon points="388,73 400,88 412,73" fill="white" />
      <polygon points="388,73 400,88 412,73" fill="none" stroke="#e2ded8" stroke-width="1" />
      <line x1="386" y1="73.5" x2="414" y2="73.5" stroke="white" stroke-width="3" />
      <foreignObject x="280" y="22" width="240" height="48">
        <p class="speech-text">{dialogText}</p>
      </foreignObject>
    </g>

    <!-- === Robot === -->
    <g class="robot">
      <!-- Antenna -->
      <line x1="400" y1="108" x2="400" y2="88" stroke="#8a9199" stroke-width="2.5"
            stroke-linecap="round" />
      <circle cx="400" cy="84" r="5.5" fill="#D6E6F3" />

      <!-- Head -->
      <circle cx="400" cy="155" r="55" fill="#e2ded8" />
      <!-- Head highlight -->
      <ellipse cx="390" cy="135" rx="30" ry="20" fill="#FAF7F2" opacity="0.3" />

      <!-- Ears -->
      <circle cx="345" cy="145" r="8" fill="#d5d0ca" />
      <circle cx="455" cy="145" r="8" fill="#d5d0ca" />

      <!-- Eyes -->
      <g class="eyes"
         class:gaze-left={hoveredDrink === 'pm'}
         class:gaze-right={hoveredDrink === 'visual'}>
        <!-- Left eye -->
        <circle cx="378" cy="148" r="12" fill="white" />
        <circle cx="378" cy="148" r="8" fill="#5A636B" />
        <circle cx="381" cy="145" r="2.5" fill="white" />
        <!-- Right eye -->
        <circle cx="422" cy="148" r="12" fill="white" />
        <circle cx="422" cy="148" r="8" fill="#5A636B" />
        <circle cx="425" cy="145" r="2.5" fill="white" />
      </g>

      <!-- Blush spots -->
      <ellipse cx="362" cy="168" rx="8" ry="5" fill="#F0D7D7" opacity="0.5" />
      <ellipse cx="438" cy="168" rx="8" ry="5" fill="#F0D7D7" opacity="0.5" />

      <!-- Mouth -->
      <ellipse class="mouth" class:speaking={isSpeaking}
               cx="400" cy="175" rx="10" ry="3.5" fill="#5A636B" />

      <!-- Neck -->
      <rect x="392" y="205" width="16" height="10" rx="3" fill="#d5d0ca" />

      <!-- Body -->
      <rect x="360" y="213" width="80" height="70" rx="14" fill="#d5d0ca" />
      <!-- Chest panel -->
      <rect x="376" y="223" width="48" height="34" rx="6" fill="#c8c3bc" />
      <!-- Chest indicator dots -->
      <circle cx="390" cy="242" r="4" fill="#F0D7D7" />
      <circle cx="400" cy="242" r="4" fill="#D6E6F3" />
      <circle cx="410" cy="242" r="4" fill="#DDEEE7" />
      <!-- Bowtie -->
      <polygon points="393,218 400,222 407,218 400,214" fill="#8a9199" />

      <!-- Arms -->
      <path d="M360,235 Q330,265 300,290" stroke="#d5d0ca" stroke-width="12"
            fill="none" stroke-linecap="round" />
      <path d="M440,235 Q470,265 500,290" stroke="#d5d0ca" stroke-width="12"
            fill="none" stroke-linecap="round" />
      <!-- Hands (small circles at arm ends) -->
      <circle cx="296" cy="293" r="9" fill="#e2ded8" />
      <circle cx="504" cy="293" r="9" fill="#e2ded8" />
    </g>

    <!-- === Bar Counter === -->
    <rect x="40" y="298" width="720" height="14" rx="3" fill="#d5d0ca" />
    <rect x="40" y="312" width="720" height="100" fill="#e2ded8" />
    <!-- Counter top edge -->
    <line x1="40" y1="298" x2="760" y2="298" stroke="#c8c3bc" stroke-width="0.8" />
    <!-- Counter panel lines -->
    <line x1="300" y1="320" x2="300" y2="405" stroke="#d5d0ca" stroke-width="1" />
    <line x1="500" y1="320" x2="500" y2="405" stroke="#d5d0ca" stroke-width="1" />

    <!-- === Drinks === -->
    {#each DRINKS as drink, i}
      <g transform="translate({DRINK_X[i]}, 0)">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g class="drink-inner"
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

          <!-- Glass bowl (liquid) -->
          <ellipse class="drink-bowl" cx="0" cy="264" rx="28" ry="16"
                   fill={drink.color} />
          <!-- Glass rim highlight -->
          <ellipse cx="0" cy="256" rx="20" ry="7"
                   fill="white" opacity="0.35" />
          <!-- Glass stem -->
          <rect x="-3" y="278" width="6" height="14" rx="2" fill="#d5d0ca" />
          <!-- Glass base -->
          <ellipse cx="0" cy="293" rx="15" ry="5" fill="#d5d0ca" />

          <!-- Invisible click area (larger) -->
          <rect x="-35" y="245" width="70" height="55" fill="transparent" />

          <!-- Label on counter front -->
          <foreignObject x="-55" y="330" width="110" height="36">
            <p class="drink-label">{t(`bar.drink.${drink.id}`)}</p>
          </foreignObject>
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
    max-width: 800px;
    height: auto;
  }

  /* --- Speech Bubble --- */
  .speech-text {
    font-family: inherit;
    font-size: clamp(0.75rem, 0.65rem + 0.4vw, 0.92rem);
    color: #5A636B;
    text-align: center;
    line-height: 1.4;
    margin: 0;
    padding: 0 0.3rem;
  }

  /* --- Robot Mouth Animation --- */
  .mouth {
    transform-origin: 400px 175px;
    transition: transform 0.12s ease;
  }

  .mouth.speaking {
    animation: mouth-flap 0.3s ease-in-out infinite;
  }

  @keyframes mouth-flap {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(2.8); }
  }

  /* --- Eye Gaze --- */
  .eyes {
    transition: transform 0.3s ease;
  }

  .eyes.gaze-left {
    transform: translateX(-3px);
  }

  .eyes.gaze-right {
    transform: translateX(3px);
  }

  /* --- Drink Interaction --- */
  .drink-inner {
    cursor: pointer;
    outline: none;
  }

  .drink-inner:focus-visible {
    outline: 2px solid #5A636B;
    outline-offset: 4px;
  }

  .drink-inner.hovered {
    transform: translateY(-5px);
    transition: transform 0.25s ease;
  }

  .drink-inner:not(.hovered) {
    transform: translateY(0);
    transition: transform 0.25s ease;
  }

  .drink-bowl {
    transition: filter 0.25s ease;
  }

  .drink-inner.hovered .drink-bowl {
    filter: brightness(1.06) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.1));
  }

  .drink-label {
    font-family: inherit;
    font-size: clamp(0.6rem, 0.5rem + 0.3vw, 0.78rem);
    color: #8a9199;
    text-align: center;
    line-height: 1.3;
    margin: 0;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  .drink-inner.hovered .drink-label {
    color: #5A636B;
  }
</style>
