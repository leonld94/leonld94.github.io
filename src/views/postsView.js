import { topics } from '../data/posts.js';
import { formatDateKR } from '../utils/format.js';
import { escapeHTML } from '../utils/sanitize.js';

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
          `,
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

export function createPostsView({ activeContext, allPosts, navOpen }) {
  if (!activeContext) return '<p class="empty-state">아직 등록된 글이 없습니다.</p>';
  const { topic, post } = activeContext;

  return `
    <button class="mobile-category-trigger" type="button" aria-controls="category-panel" aria-expanded="${navOpen}">
      <span aria-hidden="true">☰</span> 분류 및 글 목록
    </button>
    <button class="nav-backdrop${navOpen ? ' is-visible' : ''}" type="button" aria-label="분류 목록 닫기"></button>

    <div class="blog-layout">
      <aside id="category-panel" class="category-panel${navOpen ? ' is-open' : ''}" aria-label="글 분류와 목록">
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

      <main id="main-content" class="article-column" tabindex="-1">
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
}
