export function createSidebar() {
  const sidebar = document.createElement('nav');
  sidebar.className = 'sidebar';

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

    li.innerHTML = `
      <div>${post.title}</div>
      <div class="sidebar__date">${post.date}</div>
    `;

    li.addEventListener('click', () => {
      onPostClick(post.id);
    });

    list.appendChild(li);
  });
}

export function setActivePost(sidebar, postId) {
  sidebar.querySelectorAll('.sidebar__item').forEach((item) => {
    item.classList.toggle('active', item.dataset.postId === postId);
  });
}

export function showSidebar(sidebar) {
  sidebar.classList.add('visible');
}

export function hideSidebar(sidebar) {
  sidebar.classList.remove('visible');
}
