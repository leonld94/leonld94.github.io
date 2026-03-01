import { escapeHTML } from '../utils/sanitize.js';

export function createScrollRack(topics, onSelect) {
  const rack = document.createElement('div');
  rack.className = 'scroll-rack';
  rack.setAttribute('role', 'toolbar');
  rack.setAttribute('aria-label', '주제 선택');

  topics.forEach((topic) => {
    const icon = document.createElement('div');
    icon.className = 'scroll-icon';
    icon.dataset.topicId = topic.id;
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-label', `${topic.title} 주제 열기`);
    icon.setAttribute('aria-pressed', 'false');

    icon.innerHTML = `
      <div class="scroll-icon__roll">
        <div class="scroll-icon__rod scroll-icon__rod--left"></div>
        <div class="scroll-icon__body"></div>
        <div class="scroll-icon__rod scroll-icon__rod--right"></div>
        <span class="scroll-icon__emoji">${escapeHTML(topic.emoji)}</span>
      </div>
      <span class="scroll-icon__label">${escapeHTML(topic.title)}</span>
    `;

    icon.addEventListener('click', () => {
      onSelect(topic.id);
    });

    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(topic.id);
      }
    });

    rack.appendChild(icon);
  });

  return rack;
}

export function setActiveIcon(rack, topicId) {
  rack.querySelectorAll('.scroll-icon').forEach((icon) => {
    const isActive = icon.dataset.topicId === topicId;
    icon.classList.toggle('active', isActive);
    icon.setAttribute('aria-pressed', String(isActive));
  });
}
