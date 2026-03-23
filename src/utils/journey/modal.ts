/**
 * Modal logic for the Life Journey page.
 * Handles opening/closing the story modal, setting content, and tracking.
 */
import { t } from '../../i18n/langStore';
import { track } from '../analytics';

/** Convert \n\n-delimited text to <p> blocks. Inline HTML (links, imgs) preserved. */
export function toParagraphs(raw: string): string {
  return raw
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.startsWith('<img') ? p : `<p>${p}</p>`)
    .join('');
}

/**
 * Initialise modal behaviour and return open/close helpers.
 * Safe to call multiple times (re-binds to current DOM elements).
 */
export function initModal() {
  const modal = document.getElementById('story-modal')!;
  const modalTitle = document.getElementById('modal-title')!;
  const modalBody = document.getElementById('modal-body')!;
  const modalCity = document.getElementById('modal-city')!;
  const modalCountry = document.getElementById('modal-country')!;
  const modalClose = document.getElementById('modal-close')!;

  function openModal(pin: any) {
    const pinKey = pin.id.replace(/-/g, '');
    const cityKey = `pin.${pinKey}.city`;
    const countryKey = `pin.${pinKey}.country`;
    modalCity.textContent = t(cityKey);
    modalCity.setAttribute('data-i18n', cityKey);
    modalCountry.textContent = t(countryKey);
    modalCountry.setAttribute('data-i18n', countryKey);
    const titleKey = `pin.${pinKey}.title`;
    const storyKey = `pin.${pinKey}.story`;
    modalTitle.textContent = t(titleKey);
    modalTitle.setAttribute('data-i18n', titleKey);
    modalBody.innerHTML = toParagraphs(t(storyKey));
    modalBody.setAttribute('data-i18n', storyKey);
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    track('map_pin_click', { pin_city: pin.city, pin_id: pin.id });
  }

  function closeModal() {
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
  });

  return { openModal, closeModal };
}
