import { journeyStories } from '../../data/journeyStories';
import { track } from '../analytics';

export function toParagraphs(raw: string): string {
  return raw
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.startsWith('<img') ? p : `<p>${p}</p>`)
    .join('');
}

export function initModal() {
  const modal = document.getElementById('story-modal')!;
  const modalTitle = document.getElementById('modal-title')!;
  const modalBody = document.getElementById('modal-body')!;
  const modalCity = document.getElementById('modal-city')!;
  const modalCountry = document.getElementById('modal-country')!;
  const modalClose = document.getElementById('modal-close')!;

  function openModal(pin: { id: string; city: string }) {
    const entry = journeyStories[pin.id];
    if (!entry) return;
    modalCity.textContent = entry.city;
    modalCountry.textContent = entry.country;
    modalTitle.textContent = entry.title;
    modalBody.innerHTML = toParagraphs(entry.story);
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
