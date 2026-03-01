export function createPostCard(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.dataset.postId = post.id;

  card.innerHTML = `
    <h3 class="post-card__title">${post.title}</h3>
    <div class="post-card__date">${formatDate(post.date)}</div>
    <div class="post-card__content">${post.content}</div>
  `;

  return card;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}
