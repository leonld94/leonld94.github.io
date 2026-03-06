import { escapeHTML } from '../utils/sanitize.js';
import { formatDateKR } from '../utils/format.js';

let activeCommentCard = null;

export function createPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.dataset.postId = post.id;

  card.innerHTML = `
    <div class="post-card__body">
      <h3 class="post-card__title">${escapeHTML(post.title)}</h3>
      <div class="post-card__date">${formatDateKR(post.date)}</div>
      <div class="post-card__content">${post.content}</div>
    </div>
    <div class="post-card__comment-section">
      <button class="post-card__comment-toggle" aria-expanded="false">
        <span class="post-card__comment-icon">💬</span>
        댓글
      </button>
      <div class="post-card__comment-container"></div>
    </div>
  `;

  const toggleBtn = card.querySelector('.post-card__comment-toggle');
  const container = card.querySelector('.post-card__comment-container');

  toggleBtn.addEventListener('click', () => {
    const isOpen = container.classList.contains('open');

    if (activeCommentCard && activeCommentCard !== card) {
      closeComments(activeCommentCard);
    }

    if (isOpen) {
      closeComments(card);
    } else {
      openComments(card, post.id);
    }
  });

  return card;
}

export function resetActiveComments() {
  if (activeCommentCard) {
    closeComments(activeCommentCard);
  }
}

function openComments(card, postId) {
  const container = card.querySelector('.post-card__comment-container');
  const btn = card.querySelector('.post-card__comment-toggle');

  container.innerHTML = '';
  loadGiscus(container, postId);

  container.classList.add('open');
  btn.classList.add('active');
  btn.setAttribute('aria-expanded', 'true');
  activeCommentCard = card;
}

function closeComments(card) {
  const container = card.querySelector('.post-card__comment-container');
  const btn = card.querySelector('.post-card__comment-toggle');

  container.classList.remove('open');
  btn.classList.remove('active');
  btn.setAttribute('aria-expanded', 'false');

  setTimeout(() => { container.innerHTML = ''; }, 400);

  if (activeCommentCard === card) activeCommentCard = null;
}

function loadGiscus(container, postId) {
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', 'leonld94/leonld94.github.io');
  script.setAttribute('data-repo-id', 'MDEwOlJlcG9zaXRvcnkzODc3Mzc5MTY=');
  script.setAttribute('data-category', 'Comments');
  script.setAttribute('data-category-id', 'DIC_kwDOFxxpPM4C3ygV');
  script.setAttribute('data-mapping', 'specific');
  script.setAttribute('data-term', postId);
  script.setAttribute('data-strict', '0');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'bottom');
  script.setAttribute('data-theme', `${window.location.origin}/giscus-theme.css`);
  script.setAttribute('data-lang', 'ko');
  script.crossOrigin = 'anonymous';
  script.async = true;

  container.appendChild(script);
}
