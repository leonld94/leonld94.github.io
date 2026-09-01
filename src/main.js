import './styles/main.css';
import { topics } from './data/posts.js';
import { voiceContents } from './data/voiceContents.js';
import { formatDateKR } from './utils/format.js';
import { escapeHTML } from './utils/sanitize.js';

const app = document.getElementById('app');
const allPosts = topics.flatMap((topic) =>
  topic.posts.map((post) => ({ post, topic }))
);
const latestPostContext = allPosts.reduce((latest, current) => {
  if (!latest) return current;
  return new Date(current.post.date) > new Date(latest.post.date) ? current : latest;
}, null);
const voiceUnitCache = new Map();
const voiceUnitRequests = new Map();
const voiceUnitErrors = new Map();
const voiceVolumeStorageKey = 'leonld94-voice-volume';

function readVoiceVolume() {
  try {
    const storedValue = window.localStorage.getItem(voiceVolumeStorageKey);
    if (storedValue === null) return 1;
    const storedVolume = Number(storedValue);
    return Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1 ? storedVolume : 1;
  } catch {
    return 1;
  }
}

function saveVoiceVolume(volume) {
  try {
    window.localStorage.setItem(voiceVolumeStorageKey, String(volume));
  } catch {
    // 저장소를 사용할 수 없는 환경에서도 현재 페이지의 볼륨 조절은 유지합니다.
  }
}

let voiceVolume = readVoiceVolume();

const initialRoute = readRoute();
const state = {
  activeView: initialRoute.view,
  activePostId: initialRoute.postId,
  activeVoiceId: initialRoute.voiceId,
  activeVoiceUnitId: initialRoute.voiceUnitId,
  navOpen: false,
};

function readRoute() {
  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#profile') {
    return { view: 'profile', postId: allPosts[0]?.post.id ?? null, voiceId: null, voiceUnitId: null };
  }
  if (window.location.hash.startsWith('#voice')) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const requestedVoiceId = params.get('voice');
    const voiceItem = voiceContents.find((item) => item.id === requestedVoiceId);
    const requestedUnitId = params.get('unit') ?? params.get('book');
    const voiceUnitId = voiceItem?.units.some((unit) => unit.id === requestedUnitId)
      ? requestedUnitId
      : voiceItem?.units[0]?.id ?? null;
    return { view: 'voice', postId: allPosts[0]?.post.id ?? null, voiceId: voiceItem?.id ?? null, voiceUnitId };
  }

  const requestedId = decodeURIComponent(window.location.hash.replace(/^#post=/, ''));
  const postId = allPosts.some(({ post }) => post.id === requestedId)
    ? requestedId
    : allPosts[0]?.post.id ?? null;
  return { view: 'posts', postId, voiceId: null, voiceUnitId: null };
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
          <h1>배우고 생각한 것을<br>남깁니다.</h1>
          <p>여러 취미를 즐기며 발견한 생각들을 기록하는 개인 블로그입니다. 흩어지기 쉬운 생각을 한곳에 모읍니다.</p>
          ${latestPostContext
            ? `<button class="profile-read-button" type="button" data-post-id="${escapeHTML(latestPostContext.post.id)}">
                <span class="profile-read-button__label">
                  <small>LATEST POST</small>
                  <strong>${escapeHTML(latestPostContext.post.title)}</strong>
                </span>
                <span aria-hidden="true">→</span>
              </button>`
            : ''}
        </div>
      </section>

      <section class="profile-identity" aria-labelledby="profile-identity-title">
        <div class="profile-identity__mark" aria-hidden="true">A</div>
        <div class="profile-identity__copy">
          <span class="page-eyebrow">WHO AM I?</span>
          <h2 id="profile-identity-title">아선대너무좋아</h2>
          <p>선형대수를 매우 좋아하는 공학도입니다.</p>
        </div>
        <span class="profile-identity__tag">NICKNAME</span>
      </section>

      <section class="profile-details" aria-label="블로그 소개">
        <article class="profile-note">
          <span class="page-eyebrow">ABOUT THIS BLOG</span>
          <h2>서로 다른 분야 사이의<br>연결고리를 찾아서</h2>
          <p>새로 배운 개념과 오래 품은 질문을 정리합니다. 흔한 답보단 재미있는 색다른 생각을 남기는 공간입니다.</p>
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
        <span class="page-eyebrow">VOICE · CLASSICAL GREEK</span>
        <h1>음성으로 만나는<br>고전 그리스어</h1>
        <p>재구성된 고전 그리스어 낭독을 듣는 곳입니다.<br>작품을 선택하면 읽기 화면으로 이동합니다.</p>
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

function voiceUnitKey(workId, unitId) {
  return `${workId}/${unitId}`;
}

function displayPassageLabel(label) {
  const text = String(label);
  return /^\d$/.test(text) ? text.padStart(2, '0') : text;
}

function voiceSpeakerNames(speaker) {
  if (!speaker) return [];
  if (speaker.label) return [{ text: speaker.label, language: null }];
  return [
    speaker.greek ? { text: speaker.greek, language: 'grc' } : null,
    speaker.korean ? { text: speaker.korean, language: 'ko' } : null,
    speaker.english ? { text: speaker.english, language: 'en' } : null,
  ].filter(Boolean);
}

function createVoiceSpeaker(speaker) {
  const names = voiceSpeakerNames(speaker);
  if (names.length === 0) return '';
  return `
    <span class="voice-line__speaker">
      ${names.map(({ text, language }, index) => `<${index === 0 ? 'strong' : 'small'}${language ? ` lang="${language}"` : ''}>${escapeHTML(text)}</${index === 0 ? 'strong' : 'small'}>`).join('')}
    </span>
  `;
}

function createVoiceDetailView() {
  const voiceItem = voiceContents.find((item) => item.id === state.activeVoiceId) ?? voiceContents[0];
  if (!voiceItem) return '<main id="main-content"><p class="empty-state">등록된 음성 작품이 없습니다.</p></main>';
  const activeUnit = voiceItem.units.find((unit) => unit.id === state.activeVoiceUnitId) ?? voiceItem.units[0];
  const cacheKey = voiceUnitKey(voiceItem.id, activeUnit.id);
  const voicePassages = voiceUnitCache.get(cacheKey) ?? [];
  const loadError = voiceUnitErrors.get(cacheKey);
  const passageRange = voicePassages.length > 0
    ? `${voicePassages[0].label}–${voicePassages.at(-1).label}`
    : '—';
  const navigation = voiceItem.navigation;
  const volumePercent = Math.round(voiceVolume * 100);
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
  const unitList = voiceItem.units
    .map(
      (unit) => `
        <button class="voice-book-link${unit.id === activeUnit?.id ? ' is-active' : ''}" type="button" data-voice-unit="${escapeHTML(unit.id)}" ${unit.id === activeUnit?.id ? 'aria-current="page"' : ''}>
          <span>${escapeHTML(unit.label)}</span>
          <small>${unit.passageCount}${escapeHTML(navigation.passage.label)}</small>
        </button>
      `
    )
    .join('');
  const passageRows = voicePassages
    .map(
      (passage, index) => {
        const speakerNames = voiceSpeakerNames(passage.speaker);
        const speakerLabel = speakerNames.length > 0 ? `, 화자 ${speakerNames.map(({ text }) => text).join(' / ')}` : '';
        return `
        <button
          class="voice-line${passage.audio ? ' has-audio' : ' is-unavailable'}${passage.order % 5 === 0 ? ' is-milestone' : ''}${passage.paragraphStart ? ' is-paragraph-start' : ''}${passage.omitted ? ' is-omitted' : ''}"
          type="button"
          data-voice-line="${index}"
          data-passage-label="${escapeHTML(passage.label)}"
          ${passage.audio ? `data-audio="${escapeHTML(passage.audio)}"` : 'disabled'}
          aria-label="${escapeHTML(passage.label)}${escapeHTML(navigation.passage.label)}${escapeHTML(speakerLabel)}${passage.omitted ? ', 이 판본에서 생략됨' : passage.audio ? ', 음성 재생' : ', 음성 준비 중'}"
        >
          <span class="voice-line__number">${escapeHTML(displayPassageLabel(passage.label))}</span>
          <span class="voice-line__text">
            ${createVoiceSpeaker(passage.speaker)}
            <span class="voice-line__greek" lang="${passage.omitted ? 'en' : 'grc'}">${escapeHTML(passage.greekText)}</span>
            <span class="voice-line__korean" lang="ko">${escapeHTML(passage.koreanText)}</span>
          </span>
          <span class="voice-line__audio" aria-hidden="true">
            ${passage.audio
              ? `<i></i><small>${escapeHTML(passage.label)}${escapeHTML(navigation.passage.label)}</small>`
              : '<small>준비 중</small>'}
          </span>
          <span class="voice-line__progress" aria-hidden="true"></span>
        </button>
      `;
      }
    )
    .join('');

  return `
    <div class="voice-reader-layout">
      <aside class="voice-reader-nav" aria-label="작품과 ${escapeHTML(navigation.passage.label)} 탐색">
        <button class="voice-back-button" type="button" data-voice-home>← 음성 홈</button>
        <div class="voice-reader-nav__section">
          <span class="panel-heading__eyebrow">WORKS</span>
          <h2>작품</h2>
          <nav class="voice-detail-list">${voiceList}</nav>
        </div>
        <div class="voice-reader-nav__section">
            <span class="panel-heading__eyebrow">CURRENT POSITION</span>
          <div class="voice-reader-position">
            <span>${escapeHTML(navigation.unit.singular)}</span><strong>${escapeHTML(activeUnit?.label ?? '—')}</strong>
            <span>${escapeHTML(navigation.passage.plural)}</span><strong>${escapeHTML(passageRange)}</strong>
          </div>
        </div>
        ${voiceItem.units.length > 1
          ? `<div class="voice-reader-nav__section">
              <span class="panel-heading__eyebrow">${escapeHTML(navigation.unit.plural)}</span>
              <h2>${escapeHTML(navigation.unit.label)} 선택</h2>
              <nav class="voice-book-list" aria-label="${escapeHTML(navigation.unit.label)} 선택">${unitList}</nav>
            </div>`
          : ''}
      </aside>

      <aside class="voice-volume-panel" aria-labelledby="voice-volume-title">
        <span class="panel-heading__eyebrow">VOLUME</span>
        <div class="voice-volume-panel__heading">
          <h2 id="voice-volume-title">음성 크기</h2>
          <output for="voice-volume" data-volume-output>${volumePercent}%</output>
        </div>
        <div class="voice-volume-panel__control">
          <span aria-hidden="true">−</span>
          <input
            id="voice-volume"
            class="voice-volume-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value="${volumePercent}"
            aria-label="음성 크기"
            aria-valuetext="${volumePercent}%"
            style="--volume-level: ${volumePercent}%"
            data-volume-control
          >
          <span aria-hidden="true">＋</span>
        </div>
        <div class="voice-volume-panel__scale" aria-hidden="true">
          <span>0</span><i></i><i></i><i></i><span>100</span>
        </div>
        <p>재생 중에도 바로 적용되며 다음 방문에도 유지됩니다.</p>
        <span class="voice-player-status" data-player-status aria-live="polite"></span>
      </aside>

      <main id="main-content" class="voice-reader" tabindex="-1">
        <header class="voice-reader__header">
          <div class="voice-reader__meta">
            <span>${escapeHTML(navigation.unit.singular)} ${escapeHTML(activeUnit?.label ?? '—')}</span>
            <span>${escapeHTML(navigation.passage.plural)} ${escapeHTML(passageRange)}</span>
          </div>
          <h1 lang="ko">${escapeHTML(voiceItem.korean)}</h1>
          <div class="voice-title-pair">
            <span lang="grc">${escapeHTML(voiceItem.greek)}</span>
            <span lang="en">${escapeHTML(voiceItem.english)}</span>
          </div>
          <p>음성이 있는 ${escapeHTML(navigation.passage.label)}을 누르면 재생을 시작합니다. 다음 ${escapeHTML(navigation.passage.label)}에도 음성이 있으면 자동으로 이동하며 이어서 재생합니다.</p>
          ${voiceItem.source?.url
            ? `<a class="voice-source-link" href="${escapeHTML(voiceItem.source.url)}" target="_blank" rel="noreferrer">${escapeHTML(voiceItem.source.label)} ↗</a>`
            : ''}
          ${voiceItem.source?.credit ? `<small class="voice-source-credit">${escapeHTML(voiceItem.source.credit)}</small>` : ''}
        </header>
        <section class="voice-line-list" aria-label="${escapeHTML(navigation.passage.label)}별 원문과 음성">
          ${loadError
            ? `<p class="voice-loading-state is-error">본문을 불러오지 못했습니다: ${escapeHTML(loadError.message)}</p>`
            : voiceUnitCache.has(cacheKey)
              ? passageRows
              : '<p class="voice-loading-state">본문을 불러오는 중입니다…</p>'}
        </section>
        <audio class="voice-audio-player" preload="auto"></audio>
      </main>
    </div>
  `;
}

function ensureActiveVoiceUnitLoaded() {
  const voiceItem = voiceContents.find((item) => item.id === state.activeVoiceId);
  const activeUnit = voiceItem?.units.find((unit) => unit.id === state.activeVoiceUnitId);
  if (!voiceItem || !activeUnit) return;
  const cacheKey = voiceUnitKey(voiceItem.id, activeUnit.id);
  if (voiceUnitCache.has(cacheKey) || voiceUnitRequests.has(cacheKey)) return;

  voiceUnitErrors.delete(cacheKey);
  const request = activeUnit.load()
    .then((passages) => {
      voiceUnitCache.set(cacheKey, passages);
      voiceUnitRequests.delete(cacheKey);
      if (state.activeVoiceId === voiceItem.id && state.activeVoiceUnitId === activeUnit.id) render();
    })
    .catch((error) => {
      voiceUnitRequests.delete(cacheKey);
      voiceUnitErrors.set(cacheKey, error);
      if (state.activeVoiceId === voiceItem.id && state.activeVoiceUnitId === activeUnit.id) render();
    });
  voiceUnitRequests.set(cacheKey, request);
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
  if (state.activeView === 'voice' && state.activeVoiceId) {
    ensureActiveVoiceUnitLoaded();
    setupVoiceLinePlayer();
  }
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

  app.querySelectorAll('[data-voice-unit]').forEach((button) => {
    button.addEventListener('click', () => selectVoiceUnit(button.dataset.voiceUnit));
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
  const volumeControl = app.querySelector('[data-volume-control]');
  const volumeOutput = app.querySelector('[data-volume-output]');
  const playerStatus = app.querySelector('[data-player-status]');
  const passageLabel = voiceContents.find((item) => item.id === state.activeVoiceId)?.navigation.passage.label || '구절';
  if (!player) return;

  function applyVolume(percent, { persist = false } = {}) {
    const normalizedPercent = Math.min(100, Math.max(0, Number(percent) || 0));
    voiceVolume = normalizedPercent / 100;
    player.volume = voiceVolume;
    volumeControl?.style.setProperty('--volume-level', `${normalizedPercent}%`);
    volumeControl?.setAttribute('aria-valuetext', `${Math.round(normalizedPercent)}%`);
    if (volumeOutput) volumeOutput.textContent = `${Math.round(normalizedPercent)}%`;
    if (persist) saveVoiceVolume(voiceVolume);
  }

  applyVolume(voiceVolume * 100);
  volumeControl?.addEventListener('input', () => applyVolume(volumeControl.value, { persist: true }));
  if (rows.length === 0) return;

  let currentIndex = -1;

  function updatePlayerStatus(index, status) {
    const row = rows[index];
    if (!row) return;
    const label = row.dataset.passageLabel;
    if (playerStatus) playerStatus.textContent = `${label}${passageLabel} ${status}`;
  }

  async function playLine(index, { autoAdvance = false } = {}) {
    const row = rows[index];
    const audioPath = row?.dataset.audio;
    if (!row || !audioPath) return;

    rows.forEach((item) => item.classList.remove('is-playing', 'is-paused'));
    row.classList.add('is-playing');
    currentIndex = index;
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
      if (playerStatus) playerStatus.textContent = '재생할 수 없습니다. 브라우저의 오디오 재생 설정을 확인해주세요.';
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

    if (playerStatus) playerStatus.textContent = `연속된 ${passageLabel}의 음성을 모두 재생했습니다.`;
  });
}

function selectView(view, { updateHistory = true } = {}) {
  if (!['profile', 'posts', 'voice'].includes(view)) return;
  state.activeView = view;
  state.activeVoiceId = null;
  state.activeVoiceUnitId = null;
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
  state.activeVoiceUnitId = voiceContents.find((item) => item.id === voiceId)?.units[0]?.id ?? null;
  state.navOpen = false;

  if (updateHistory) {
    window.history.pushState({ voiceId, voiceUnitId: state.activeVoiceUnitId }, '', `#voice=${encodeURIComponent(voiceId)}&unit=${encodeURIComponent(state.activeVoiceUnitId)}`);
  }

  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => app.querySelector('#main-content')?.focus({ preventScroll: true }));
}

function selectVoiceUnit(unitId, { updateHistory = true } = {}) {
  const voiceItem = voiceContents.find((item) => item.id === state.activeVoiceId);
  if (!voiceItem?.units.some((unit) => unit.id === unitId)) return;
  state.activeVoiceUnitId = unitId;

  if (updateHistory) {
    window.history.pushState({ voiceId: voiceItem.id, voiceUnitId: unitId }, '', `#voice=${encodeURIComponent(voiceItem.id)}&unit=${encodeURIComponent(unitId)}`);
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
  state.activeVoiceUnitId = null;
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
  state.activeVoiceUnitId = route.voiceUnitId;
  state.navOpen = false;
  render();
});

render();
