export function createScrollRack(topics, onSelect) {
  const rack = document.createElement('div');
  rack.className = 'scroll-rack';

  topics.forEach((topic) => {
    const icon = document.createElement('div');
    icon.className = 'scroll-icon';
    icon.dataset.topicId = topic.id;

    icon.innerHTML = `
      <div class="scroll-icon__roll">
        <div class="scroll-icon__rod scroll-icon__rod--left"></div>
        <div class="scroll-icon__body"></div>
        <div class="scroll-icon__rod scroll-icon__rod--right"></div>
        <span class="scroll-icon__emoji">${topic.emoji}</span>
      </div>
      <span class="scroll-icon__label">${topic.title}</span>
    `;

    icon.addEventListener('click', () => {
      onSelect(topic.id);
    });

    rack.appendChild(icon);
  });

  return rack;
}

export function setActiveIcon(rack, topicId) {
  rack.querySelectorAll('.scroll-icon').forEach((icon) => {
    icon.classList.toggle('active', icon.dataset.topicId === topicId);
  });
}
