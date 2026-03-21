/**
 * Re-translate SVG map labels and open modal content on language change.
 */
import { t } from '../../i18n/langStore';
import { toParagraphs } from './modal';

/** Update all SVG pin labels and, if the modal is open, its content too. */
export function updateLabels() {
  document.querySelectorAll('.map-label[data-i18n-prefix]').forEach((el) => {
    const prefix = (el as HTMLElement).dataset.i18nPrefix!;
    const year = (el as HTMLElement).dataset.year!;
    el.textContent = `${t(prefix)} · ${year}`;
  });

  // Also update modal if open
  const modal = document.getElementById('story-modal');
  if (modal?.classList.contains('visible')) {
    const modalTitle = document.getElementById('modal-title')!;
    const modalBody = document.getElementById('modal-body')!;
    const titleKey = modalTitle.getAttribute('data-i18n');
    const storyKey = modalBody.getAttribute('data-i18n');
    if (titleKey) modalTitle.textContent = t(titleKey);
    if (storyKey) modalBody.innerHTML = toParagraphs(t(storyKey));
  }
}
