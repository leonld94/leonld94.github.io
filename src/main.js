import './styles/main.css';
import { topics } from './data/posts.js';
import { formatDateKR } from './utils/format.js';
import { escapeHTML } from './utils/sanitize.js';

const app = document.getElementById('app');
const allPosts = topics.flatMap((topic) =>
  topic.posts.map((post) => ({ post, topic }))
);

const state = {
  activePostId: getInitialPostId(),
  navOpen: false,
};

function getInitialPostId() {
  const requestedId = decodeURIComponent(window.location.hash.replace(/^#post=/, ''));
  if (requestedId && allPosts.some(({ post }) => post.id === requestedId)) {
    return requestedId;
  }
  return allPosts[0]?.post.id ?? null;
}

function getActiveContext() {
  return allPosts.find(({ post }) => post.id === state.activePostId) ?? allPosts[0];
}

function createTopicList(activeTopic, activePost) {
  return topics
    .map((topic) => {
      const isActive = topic.id === activeTopic.id;
      const posts = topic.posts
        .map(
          (post) => `
            <li>
              <button
                class="post-link${post.id === activePost.id ? ' is-active' : ''}"
                type="button"
                data-post-id="${escapeHTML(post.id)}"
                ${post.id === activePost.id ? 'aria-current="page"' : ''}
              >
                <span>${escapeHTML(post.title)}</span>
                <time datetime="${escapeHTML(post.date)}">${escapeHTML(formatDateKR(post.date))}</time>
              </button>
            </li>
          `
        )
        .join('');

      return `
        <section class="topic-group${isActive ? ' is-active' : ''}">
          <button
            class="topic-button"
            type="button"
            data-topic-id="${escapeHTML(topic.id)}"
            aria-expanded="${isActive}"
          >
            <span class="topic-button__identity">
              <span aria-hidden="true">${escapeHTML(topic.emoji)}</span>
              <span>${escapeHTML(topic.title)}</span>
            </span>
            <span class="topic-button__count">${topic.posts.length}</span>
          </button>
          <ul class="topic-posts">${posts}</ul>
        </section>
      `;
    })
    .join('');
}

function createArticleNavigation(topic, activePost) {
  const currentIndex = topic.posts.findIndex((post) => post.id === activePost.id);
  const previous = topic.posts[currentIndex - 1];
  const next = topic.posts[currentIndex + 1];

  const navButton = (post, direction, label) => {
    if (!post) return '<span class="article-nav__empty"></span>';
    return `
      <button class="article-nav__button article-nav__button--${direction}" type="button" data-post-id="${escapeHTML(post.id)}">
        <span>${label}</span>
        <strong>${escapeHTML(post.title)}</strong>
      </button>
    `;
  };

  return `
    <nav class="article-nav" aria-label="같은 분류의 다른 글">
      ${navButton(previous, 'previous', '← 이전 글')}
      ${navButton(next, 'next', '다음 글 →')}
    </nav>
  `;
}

function render() {
  const context = getActiveContext();
  if (!context) {
    app.innerHTML = '<p class="empty-state">아직 등록된 글이 없습니다.</p>';
    return;
  }

  const { topic, post } = context;
  document.title = `${post.title} | 아선대너무좋아님의 블로그`;

  app.innerHTML = `
    <a class="skip-link" href="#article">본문으로 바로가기</a>

    <header class="floating-menu">
      <button class="nav-toggle" type="button" aria-controls="category-panel" aria-expanded="${state.navOpen}">
        <span class="nav-toggle__icon" aria-hidden="true"></span>
        <span>분류</span>
      </button>
      <button class="brand" type="button" data-home>
        <span class="brand__mark" aria-hidden="true">A</span>
        <span class="brand__name">아선대너무좋아</span>
        <span class="brand__suffix">의 블로그</span>
      </button>
      <div class="floating-menu__current" aria-live="polite">
        <span aria-hidden="true">${escapeHTML(topic.emoji)}</span>
        ${escapeHTML(topic.title)}
      </div>
    </header>

    <button class="nav-backdrop${state.navOpen ? ' is-visible' : ''}" type="button" aria-label="분류 목록 닫기"></button>

    <div class="blog-layout">
      <aside id="category-panel" class="category-panel${state.navOpen ? ' is-open' : ''}" aria-label="글 분류와 목록">
        <div class="panel-heading">
          <div>
            <span class="panel-heading__eyebrow">CATEGORIES</span>
            <h2>글 목록</h2>
          </div>
          <button class="panel-close" type="button" aria-label="분류 목록 닫기">×</button>
        </div>
        <nav class="category-nav">${createTopicList(topic, post)}</nav>
        <p class="category-panel__total">${topics.length}개 분류 · ${allPosts.length}개의 기록</p>
      </aside>

      <main id="article" class="article-column" tabindex="-1">
        <article class="article-card" data-current-post="${escapeHTML(post.id)}">
          <header class="article-header">
            <div class="article-header__meta">
              <span class="article-topic">${escapeHTML(topic.emoji)} ${escapeHTML(topic.title)}</span>
              <time datetime="${escapeHTML(post.date)}">${escapeHTML(formatDateKR(post.date))}</time>
            </div>
            <h1>${escapeHTML(post.title)}</h1>
            <div class="article-header__rule" aria-hidden="true"><span></span></div>
          </header>
          <div class="article-content">${post.content}</div>
          ${createArticleNavigation(topic, post)}
        </article>
      </main>

      <aside class="comment-panel" aria-label="댓글">
        <div class="comment-panel__header">
          <div>
            <span class="panel-heading__eyebrow">COMMENTS</span>
            <h2>댓글</h2>
          </div>
          <span class="comment-panel__mark" aria-hidden="true">✦</span>
        </div>
        <p class="comment-panel__description">이 글에 관한 생각을 남겨주세요.</p>
        <div class="comment-container" data-comment-for="${escapeHTML(post.id)}"></div>
        <noscript>댓글을 보려면 JavaScript를 활성화해주세요.</noscript>
      </aside>
    </div>
  `;

  bindEvents();
  loadComments(post.id);
}

function bindEvents() {
  app.querySelectorAll('[data-post-id]').forEach((button) => {
    button.addEventListener('click', () => selectPost(button.dataset.postId));
  });

  app.querySelectorAll('[data-topic-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const topic = topics.find((item) => item.id === button.dataset.topicId);
      if (topic?.posts[0]) selectPost(topic.posts[0].id);
    });
  });

  app.querySelector('[data-home]')?.addEventListener('click', () => {
    if (allPosts[0]) selectPost(allPosts[0].post.id);
  });

  app.querySelector('.nav-toggle')?.addEventListener('click', openNavigation);
  app.querySelector('.panel-close')?.addEventListener('click', closeNavigation);
  app.querySelector('.nav-backdrop')?.addEventListener('click', closeNavigation);

  app.querySelector('.article-content')?.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-post-link]');
    if (!link) return;
    event.preventDefault();
    selectPost(link.dataset.postLink);
  });
}

function selectPost(postId, { updateHistory = true } = {}) {
  if (!allPosts.some(({ post }) => post.id === postId)) return;
  state.activePostId = postId;
  state.navOpen = false;

  if (updateHistory) {
    window.history.pushState({ postId }, '', `#post=${encodeURIComponent(postId)}`);
  }

  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => app.querySelector('#article')?.focus({ preventScroll: true }));
}

function openNavigation() {
  state.navOpen = true;
  app.querySelector('.category-panel')?.classList.add('is-open');
  app.querySelector('.nav-backdrop')?.classList.add('is-visible');
  app.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'true');
}

function closeNavigation() {
  state.navOpen = false;
  app.querySelector('.category-panel')?.classList.remove('is-open');
  app.querySelector('.nav-backdrop')?.classList.remove('is-visible');
  app.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
}

function loadComments(postId) {
  const container = app.querySelector('.comment-container');
  if (!container) return;

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

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.navOpen) closeNavigation();
});

window.addEventListener('popstate', () => {
  state.activePostId = getInitialPostId();
  state.navOpen = false;
  render();
});

render();
