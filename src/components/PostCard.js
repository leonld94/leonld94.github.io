import { escapeHTML } from '../utils/sanitize.js';
import { formatDateKR } from '../utils/format.js';

export function createPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.dataset.postId = post.id;

  card.innerHTML = `
    <h3 class="post-card__title">${escapeHTML(post.title)}</h3>
    <div class="post-card__date">${formatDateKR(post.date)}</div>
    <div class="post-card__content">${post.content}</div>
    <div class="post-card__comment-section">
      <div class="post-card__comment-divider"></div>
      <h4 class="post-card__comment-heading">댓글</h4>
      <div class="post-card__comment-container"></div>
    </div>
  `;

  return card;
}

export function loadGiscusForCard(card) {
  const container = card.querySelector('.post-card__comment-container');
  if (!container || container.dataset.loaded) return;
  container.dataset.loaded = 'true';

  const postId = card.dataset.postId;
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
