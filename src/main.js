import './styles/main.css';
import { topics } from './data/posts.js';
import { voiceContents } from './data/voiceContents.js';
import { formatDateKR } from './utils/format.js';
import { escapeHTML } from './utils/sanitize.js';

const app = document.getElementById('app');
const allPosts = topics.flatMap((topic) =>
  topic.posts.map((post) => ({ post, topic }))
);

const initialRoute = readRoute();
const state = {
  activeView: initialRoute.view,
  activePostId: initialRoute.postId,
  activeVoiceId: initialRoute.voiceId,
  navOpen: false,
};

function readRoute() {
  if (window.location.hash === '#profile') {
    return { view: 'profile', postId: allPosts[0]?.post.id ?? null, voiceId: null };
  }
  if (window.location.hash.startsWith('#voice')) {
    const requestedVoiceId = decodeURIComponent(window.location.hash.replace(/^#voice=?/, ''));
    const voiceId = voiceContents.some((item) => item.id === requestedVoiceId)
      ? requestedVoiceId
      : null;
    return { view: 'voice', postId: allPosts[0]?.post.id ?? null, voiceId };
  }

  const requestedId = decodeURIComponent(window.location.hash.replace(/^#post=/, ''));
  const postId = allPosts.some(({ post }) => post.id === requestedId)
    ? requestedId
    : allPosts[0]?.post.id ?? null;
  return { view: 'posts', postId, voiceId: null };
}

function getActiveContext() {
  return allPosts.find(({ post }) => post.id === state.activePostId) ?? allPosts[0];
}

function createFloatingMenu() {
  const menuItems = [
    { id: 'profile', label: '프로필' },
    { id: 'posts', label: '글' },
    { id: 'voice', label: '음성' },
  ];

  return `
    <header class="floating-menu">
      <nav class="primary-nav" aria-label="블로그 메뉴">
        ${menuItems
          .map(
            (item) => `
              <button
                class="view-button${state.activeView === item.id ? ' is-active' : ''}"
                type="button"
                data-view="${item.id}"
                ${state.activeView === item.id ? 'aria-current="page"' : ''}
              >${item.label}</button>
            `
          )
          .join('')}
      </nav>
    </header>
  `;
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

function createPostsView() {
  const context = getActiveContext();
  if (!context) return '<p class="empty-state">아직 등록된 글이 없습니다.</p>';
  const { topic, post } = context;

  return `
    <button class="mobile-category-trigger" type="button" aria-controls="category-panel" aria-expanded="${state.navOpen}">
      <span aria-hidden="true">☰</span> 분류 및 글 목록
    </button>
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

function createProfileView() {
  const topicCards = topics
    .map(
      (topic) => `
        <button class="profile-topic" type="button" data-profile-topic="${escapeHTML(topic.id)}">
          <span class="profile-topic__emoji" aria-hidden="true">${escapeHTML(topic.emoji)}</span>
          <span>
            <strong>${escapeHTML(topic.title)}</strong>
            <small>${topic.posts.length}개의 기록</small>
          </span>
          <span aria-hidden="true">↗</span>
        </button>
      `
    )
    .join('');

  return `
    <main id="main-content" class="profile-page" tabindex="-1">
      <section class="profile-hero">
        <div class="profile-portrait" aria-hidden="true">
          <span>A</span>
          <i></i><i></i><i></i>
        </div>
        <div class="profile-intro">
          <span class="page-eyebrow">PROFILE · 아선대너무좋아</span>
          <h1>배우고 생각한 것을<br>오래 남깁니다.</h1>
          <p>수학, 철학, 공학, 언어를 오가며 발견한 연결을 기록하는 개인 블로그입니다. 여러 활동 속에서 흩어지기 쉬운 생각을 한곳에 모읍니다.</p>
          <button class="profile-read-button" type="button" data-view="posts">최근 글 읽기 <span aria-hidden="true">→</span></button>
        </div>
      </section>

      <section class="profile-details" aria-label="블로그 소개">
        <article class="profile-note">
          <span class="page-eyebrow">ABOUT THIS BLOG</span>
          <h2>서로 다른 분야 사이의<br>연결고리를 찾아서</h2>
          <p>새로 배운 개념과 오래 품은 질문을 주제별 글로 정리합니다. 완성된 답보다 생각이 이어지는 과정을 남기는 공간입니다.</p>
          <dl class="profile-stats">
            <div><dt>${topics.length}</dt><dd>관심 분야</dd></div>
            <div><dt>${allPosts.length}</dt><dd>공개된 글</dd></div>
          </dl>
        </article>
        <div class="profile-interests">
          <div class="profile-interests__heading">
            <span class="page-eyebrow">INTERESTS</span>
            <h2>기록하는 분야</h2>
          </div>
          <div class="profile-topic-grid">${topicCards}</div>
        </div>
      </section>
    </main>
  `;
}

function createVoiceView() {
  const contentCards = voiceContents
    .map(
      (item, index) => `
        <button class="voice-entry-card" type="button" data-voice-id="${escapeHTML(item.id)}">
          <span class="voice-entry-card__number">0${index + 1}</span>
          <span class="voice-entry-card__titles">
            <strong lang="grc">${escapeHTML(item.greek)}</strong>
            <span lang="en">${escapeHTML(item.english)}</span>
            <span lang="ko">${escapeHTML(item.korean)}</span>
          </span>
          <span class="voice-entry-card__action" aria-hidden="true">
            <i></i>
          </span>
        </button>
      `
    )
    .join('');

  return `
    <main id="main-content" class="voice-landing" tabindex="-1">
      <header class="voice-landing__header">
        <span class="page-eyebrow">VOICE · HOMERIC EPICS</span>
        <h1>세 언어로 만나는<br>호메로스</h1>
        <p>고전 그리스어, 영어, 한국어로 이어지는 두 작품의 입구입니다. 작품을 선택하면 읽기 화면으로 이동합니다.</p>
      </header>

      <section class="voice-entry-list" aria-label="음성 콘텐츠 목록">
        ${contentCards}
      </section>

      <footer class="voice-landing__footer">
        <span>ANCIENT GREEK</span>
        <i aria-hidden="true"></i>
        <span>ENGLISH</span>
        <i aria-hidden="true"></i>
        <span>한국어</span>
      </footer>
    </main>
  `;
}

function createVoiceDetailView() {
  const voiceItem = voiceContents.find((item) => item.id === state.activeVoiceId) ?? voiceContents[0];
  const voiceLines = voiceItem.lines ?? [];
  const playableLines = voiceLines.filter((line) => line.audio);
  const lastPreparedLine = playableLines.at(-1)?.number ?? 0;
  const lineRange = voiceLines.length > 0 ? `1–${voiceLines.length}` : '—';
  const voiceList = voiceContents
    .map(
      (item) => `
        <button class="voice-detail-link${item.id === voiceItem.id ? ' is-active' : ''}" type="button" data-voice-id="${escapeHTML(item.id)}" ${item.id === voiceItem.id ? 'aria-current="page"' : ''}>
          <span lang="grc">${escapeHTML(item.greek)}</span>
          <small lang="ko">${escapeHTML(item.korean)}</small>
        </button>
      `
    )
    .join('');
  const lineRows = voiceLines
    .map(
      (line, index) => `
        <button
          class="voice-line${line.audio ? ' has-audio' : ' is-unavailable'}${line.number % 5 === 0 ? ' is-milestone' : ''}"
          type="button"
          data-voice-line="${index}"
          ${line.audio ? `data-audio="${line.audio}" data-note="${escapeHTML(line.note)}"` : 'disabled'}
          aria-label="${line.number}행${line.note ? `, ${escapeHTML(line.note)} 음성 재생` : ', 음성 준비 중'}"
        >
          <span class="voice-line__number">${String(line.number).padStart(2, '0')}</span>
          <span class="voice-line__text">${escapeHTML(line.text)}</span>
          <span class="voice-line__audio" aria-hidden="true">
            ${line.audio
              ? `<i></i><small>${escapeHTML(line.note)}</small>`
              : '<small>준비 중</small>'}
          </span>
          <span class="voice-line__progress" aria-hidden="true"></span>
        </button>
      `
    )
    .join('');

  return `
    <div class="voice-reader-layout">
      <aside class="voice-reader-nav" aria-label="작품과 행 탐색">
        <button class="voice-back-button" type="button" data-voice-home>← 음성 홈</button>
        <div class="voice-reader-nav__section">
          <span class="panel-heading__eyebrow">WORKS</span>
          <h2>작품</h2>
          <nav class="voice-detail-list">${voiceList}</nav>
        </div>
        <div class="voice-reader-nav__section">
          <span class="panel-heading__eyebrow">CURRENT POSITION</span>
          <div class="voice-reader-position">
            <span>BOOK</span><strong>${escapeHTML(voiceItem.book)}</strong>
            <span>LINES</span><strong>${lineRange}</strong>
          </div>
        </div>
      </aside>

      <main id="main-content" class="voice-reader" tabindex="-1">
        <header class="voice-reader__header">
          <div class="voice-reader__meta">
            <span>BOOK ${escapeHTML(voiceItem.book)}</span>
            <span>LINES ${lineRange}</span>
          </div>
          <h1 lang="ko">${escapeHTML(voiceItem.korean)}</h1>
          <div class="voice-title-pair">
            <span lang="grc">${escapeHTML(voiceItem.greek)}</span>
            <span lang="en">${escapeHTML(voiceItem.english)}</span>
          </div>
          <p>음성이 있는 행을 누르면 재생을 시작합니다. 다음 행에도 음성이 있으면 자동으로 이동하며 이어서 재생합니다.</p>
        </header>
        <section class="voice-line-list" aria-label="행별 원문과 음성">
          ${lineRows}
        </section>
        <audio class="voice-audio-player" preload="auto"></audio>
      </main>

      <aside class="voice-playback-panel" aria-label="음성 재생 상태" aria-live="polite">
        <span class="panel-heading__eyebrow">NOW PLAYING</span>
        <div class="voice-playback-disc" aria-hidden="true"><i></i></div>
        <strong data-player-line>행을 선택하세요</strong>
        <span data-player-note>${lastPreparedLine > 0 ? `1–${lastPreparedLine}행에 음성이 준비되어 있습니다.` : '준비된 음성이 없습니다.'}</span>
        <div class="voice-scale" aria-label="도레미파솔라시도 음계">
          ${playableLines.map((line) => `<i>${escapeHTML(line.note || `${line.number}행`)}</i>`).join('')}
        </div>
        <p><span class="voice-playback-panel__dot"></span> 연속 재생 활성화</p>
      </aside>
    </div>
  `;
}

function render() {
  const context = getActiveContext();
  const titleByView = {
    profile: '프로필 | 아선대너무좋아님의 블로그',
    voice: '음성 | 아선대너무좋아님의 블로그',
    posts: context ? `${context.post.title} | 아선대너무좋아님의 블로그` : '글 | 아선대너무좋아님의 블로그',
  };
  const activeVoice = voiceContents.find((item) => item.id === state.activeVoiceId);
  document.title = activeVoice
    ? `${activeVoice.korean} | 아선대너무좋아님의 블로그`
    : titleByView[state.activeView];

  const view = state.activeView === 'profile'
    ? createProfileView()
    : state.activeView === 'voice'
      ? state.activeVoiceId
        ? createVoiceDetailView()
        : createVoiceView()
      : createPostsView();

  app.innerHTML = `
    <a class="skip-link" href="#main-content">본문으로 바로가기</a>
    ${createFloatingMenu()}
    ${view}
  `;

  bindEvents();
  if (state.activeView === 'posts' && context) loadComments(context.post.id);
  if (state.activeView === 'voice' && state.activeVoiceId) setupVoiceLinePlayer();
}

function bindEvents() {
  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => selectView(button.dataset.view));
  });

  app.querySelectorAll('[data-post-id]').forEach((button) => {
    button.addEventListener('click', () => selectPost(button.dataset.postId));
  });

  app.querySelectorAll('[data-voice-id]').forEach((button) => {
    button.addEventListener('click', () => selectVoiceContent(button.dataset.voiceId));
  });

  app.querySelector('[data-voice-home]')?.addEventListener('click', () => selectView('voice'));

  app.querySelectorAll('[data-topic-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const topic = topics.find((item) => item.id === button.dataset.topicId);
      if (topic?.posts[0]) selectPost(topic.posts[0].id);
    });
  });

  app.querySelectorAll('[data-profile-topic]').forEach((button) => {
    button.addEventListener('click', () => {
      const topic = topics.find((item) => item.id === button.dataset.profileTopic);
      if (topic?.posts[0]) selectPost(topic.posts[0].id);
    });
  });

  app.querySelector('.mobile-category-trigger')?.addEventListener('click', openNavigation);
  app.querySelector('.panel-close')?.addEventListener('click', closeNavigation);
  app.querySelector('.nav-backdrop')?.addEventListener('click', closeNavigation);

  app.querySelector('.article-content')?.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-post-link]');
    if (!link) return;
    event.preventDefault();
    selectPost(link.dataset.postLink);
  });
}

function setupVoiceLinePlayer() {
  const player = app.querySelector('.voice-audio-player');
  const rows = [...app.querySelectorAll('.voice-line')];
  const playerLine = app.querySelector('[data-player-line]');
  const playerNote = app.querySelector('[data-player-note]');
  const playbackPanel = app.querySelector('.voice-playback-panel');
  if (!player || rows.length === 0) return;

  let currentIndex = -1;

  function updatePlayerStatus(index, status) {
    const row = rows[index];
    if (!row) return;
    const lineNumber = Number(row.dataset.voiceLine) + 1;
    playerLine.textContent = `${lineNumber}행 · ${status}`;
    playerNote.textContent = `${row.dataset.note} 음을 재생하고 있습니다.`;
  }

  async function playLine(index, { autoAdvance = false } = {}) {
    const row = rows[index];
    const audioPath = row?.dataset.audio;
    if (!row || !audioPath) return;

    rows.forEach((item) => item.classList.remove('is-playing', 'is-paused'));
    row.classList.add('is-playing');
    currentIndex = index;
    playbackPanel?.classList.add('is-active');
    updatePlayerStatus(index, '재생 중');

    if (autoAdvance) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    player.src = audioPath;
    player.currentTime = 0;
    try {
      await player.play();
    } catch {
      row.classList.remove('is-playing');
      playbackPanel?.classList.remove('is-active');
      playerLine.textContent = '재생할 수 없습니다';
      playerNote.textContent = '브라우저의 오디오 재생 설정을 확인해주세요.';
    }
  }

  rows.forEach((row, index) => {
    if (!row.dataset.audio) return;
    row.addEventListener('click', async () => {
      if (currentIndex === index && !player.paused) {
        player.pause();
        row.classList.replace('is-playing', 'is-paused');
        updatePlayerStatus(index, '일시 정지');
        return;
      }

      if (currentIndex === index && player.paused && player.currentTime > 0 && !player.ended) {
        row.classList.replace('is-paused', 'is-playing');
        updatePlayerStatus(index, '재생 중');
        await player.play();
        return;
      }

      await playLine(index);
    });
  });

  player.addEventListener('timeupdate', () => {
    const row = rows[currentIndex];
    if (!row || !player.duration) return;
    row.style.setProperty('--line-progress', `${(player.currentTime / player.duration) * 100}%`);
  });

  player.addEventListener('ended', async () => {
    const completedRow = rows[currentIndex];
    completedRow?.classList.remove('is-playing', 'is-paused');
    completedRow?.classList.add('is-complete');
    completedRow?.style.setProperty('--line-progress', '100%');

    const nextIndex = currentIndex + 1;
    if (rows[nextIndex]?.dataset.audio) {
      await playLine(nextIndex, { autoAdvance: true });
      return;
    }

    playbackPanel?.classList.remove('is-active');
    playerLine.textContent = '연속 재생 완료';
    playerNote.textContent = `${currentIndex + 1}행까지 준비된 음성을 모두 재생했습니다.`;
  });
}

function selectView(view, { updateHistory = true } = {}) {
  if (!['profile', 'posts', 'voice'].includes(view)) return;
  state.activeView = view;
  state.activeVoiceId = null;
  state.navOpen = false;

  if (updateHistory) {
    const hash = view === 'posts'
      ? `#post=${encodeURIComponent(state.activePostId)}`
      : `#${view}`;
    window.history.pushState({ view }, '', hash);
  }

  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => app.querySelector('#main-content')?.focus({ preventScroll: true }));
}

function selectVoiceContent(voiceId, { updateHistory = true } = {}) {
  if (!voiceContents.some((item) => item.id === voiceId)) return;
  state.activeView = 'voice';
  state.activeVoiceId = voiceId;
  state.navOpen = false;

  if (updateHistory) {
    window.history.pushState({ voiceId }, '', `#voice=${encodeURIComponent(voiceId)}`);
  }

  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => app.querySelector('#main-content')?.focus({ preventScroll: true }));
}

function selectPost(postId, { updateHistory = true } = {}) {
  if (!allPosts.some(({ post }) => post.id === postId)) return;
  state.activeView = 'posts';
  state.activePostId = postId;
  state.activeVoiceId = null;
  state.navOpen = false;

  if (updateHistory) {
    window.history.pushState({ postId }, '', `#post=${encodeURIComponent(postId)}`);
  }

  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => app.querySelector('#main-content')?.focus({ preventScroll: true }));
}

function openNavigation() {
  state.navOpen = true;
  app.querySelector('.category-panel')?.classList.add('is-open');
  app.querySelector('.nav-backdrop')?.classList.add('is-visible');
  app.querySelector('.mobile-category-trigger')?.setAttribute('aria-expanded', 'true');
}

function closeNavigation() {
  state.navOpen = false;
  app.querySelector('.category-panel')?.classList.remove('is-open');
  app.querySelector('.nav-backdrop')?.classList.remove('is-visible');
  app.querySelector('.mobile-category-trigger')?.setAttribute('aria-expanded', 'false');
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
  const route = readRoute();
  state.activeView = route.view;
  state.activePostId = route.postId;
  state.activeVoiceId = route.voiceId;
  state.navOpen = false;
  render();
});

render();
