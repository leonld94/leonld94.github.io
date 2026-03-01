import { escapeHTML } from '../utils/sanitize.js';
import { formatDateKR } from '../utils/format.js';

export function createSidebar() {
  const sidebar = document.createElement('nav');
  sidebar.className = 'sidebar';
  sidebar.setAttribute('aria-label', '글 목록');

  sidebar.innerHTML = `
    <div class="sidebar__topic-label"></div>
    <ul class="sidebar__list"></ul>
  `;

  return sidebar;
}

export function updateSidebar(sidebar, topic, onPostClick) {
  const label = sidebar.querySelector('.sidebar__topic-label');
  const list = sidebar.querySelector('.sidebar__list');

  label.textContent = topic.title;
  list.innerHTML = '';

  topic.posts.forEach((post) => {
    const li = document.createElement('li');
    li.className = 'sidebar__item';
    li.dataset.postId = post.id;
    li.setAttribute('tabindex', '0');

    li.innerHTML = `
      <div>${escapeHTML(post.title)}</div>
      <div class="sidebar__date">${escapeHTML(formatDateKR(post.date))}</div>
    `;

    li.addEventListener('click', () => {
      onPostClick(post.id);
    });

    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPostClick(post.id);
      }
    });

    list.appendChild(li);
  });
}

export function setActivePost(sidebar, postId) {
  sidebar.querySelectorAll('.sidebar__item').forEach((item) => {
    const isActive = item.dataset.postId === postId;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

export function showSidebar(sidebar) {
  sidebar.classList.add('visible');
}

export function hideSidebar(sidebar) {
  sidebar.classList.remove('visible');
}
