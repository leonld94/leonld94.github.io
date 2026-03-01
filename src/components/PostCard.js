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
  `;

  return card;
}
