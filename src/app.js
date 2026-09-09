import { topics } from './data/posts.js';
import { voiceContents } from './data/voiceContents.js';
import { createPostsView } from './views/postsView.js';
import { createProfileView } from './views/profileView.js';
import { createVoiceDetailView, createVoiceView, voiceUnitKey } from './views/voiceView.js';

const app = document.getElementById('app');
const allPosts = topics.flatMap((topic) =>
  topic.posts.map((post) => ({ post, topic }))
);

function comparePostRecency(left, right) {
  const leftDate = Date.parse(left.post.date);
  const rightDate = Date.parse(right.post.date);

  if (Number.isFinite(leftDate) && Number.isFinite(rightDate) && leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  const leftSequence = Number(left.post.id.match(/(\d+)$/)?.[1] ?? -1);
  const rightSequence = Number(right.post.id.match(/(\d+)$/)?.[1] ?? -1);
  return leftSequence - rightSequence;
}

const latestPostContext = allPosts.reduce((latest, current) => {
  if (!latest) return current;
  return comparePostRecency(current, latest) > 0 ? current : latest;
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
    ? createProfileView({ allPosts, latestPostContext })
    : state.activeView === 'voice'
      ? state.activeVoiceId
        ? createVoiceDetailView({ state, voiceUnitCache, voiceUnitErrors, voiceVolume })
        : createVoiceView()
      : createPostsView({ activeContext: context, allPosts, navOpen: state.navOpen });

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

  app.querySelector('[data-classical-progress-toggle]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    const section = button.closest('.classical-progress');
    const content = section?.querySelector('#classical-progress-content');
    if (!section || !content) return;

    const isCollapsed = !content.hidden;
    content.hidden = isCollapsed;
    section.classList.toggle('is-collapsed', isCollapsed);
    button.setAttribute('aria-expanded', String(!isCollapsed));
    button.querySelector('[data-classical-progress-toggle-label]').textContent = isCollapsed
      ? '진행도 펼치기'
      : '진행도 접기';
    button.querySelector('i').textContent = isCollapsed ? '+' : '−';

    const popover = section.querySelector('#classical-language-detail-popover');
    if (isCollapsed && popover?.matches(':popover-open')) popover.hidePopover();
  });

  const classicalLanguagePopover = app.querySelector('#classical-language-detail-popover');
  const classicalLanguageDetailButtons = [...app.querySelectorAll('[data-classical-language-details]')];
  if (classicalLanguagePopover) {
    classicalLanguagePopover.addEventListener('toggle', () => {
      const isOpen = classicalLanguagePopover.matches(':popover-open');
      classicalLanguageDetailButtons.forEach((button) => {
        const isActive = isOpen && button.dataset.detailKey === classicalLanguagePopover.dataset.detailKey;
        button.setAttribute('aria-expanded', String(isActive));
        const icon = button.querySelector('[data-detail-icon]');
        if (icon) icon.textContent = isActive ? '−' : '+';
      });
    });

    classicalLanguageDetailButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const isSameDetail = classicalLanguagePopover.matches(':popover-open')
          && classicalLanguagePopover.dataset.detailKey === button.dataset.detailKey;
        if (classicalLanguagePopover.matches(':popover-open')) classicalLanguagePopover.hidePopover();
        if (isSameDetail) return;

        classicalLanguagePopover.dataset.detailKey = button.dataset.detailKey;
        classicalLanguagePopover.querySelector('[data-classical-popover-eyebrow]').textContent = button.dataset.detailEyebrow;
        classicalLanguagePopover.querySelector('[data-classical-popover-title]').textContent = button.dataset.detailTitle;
        classicalLanguagePopover.querySelector('[data-classical-popover-body]').textContent = button.dataset.detailBody;
        classicalLanguagePopover.showPopover();

        const buttonRect = button.getBoundingClientRect();
        const popoverRect = classicalLanguagePopover.getBoundingClientRect();
        const isKeyboardClick = event.detail === 0;
        const anchorX = isKeyboardClick ? buttonRect.right : event.clientX;
        const anchorY = isKeyboardClick ? buttonRect.bottom : event.clientY;
        const left = Math.min(
          Math.max(12, anchorX + 14),
          window.innerWidth - popoverRect.width - 12,
        );
        const preferredTop = anchorY + 14;
        const top = preferredTop + popoverRect.height <= window.innerHeight - 12
          ? preferredTop
          : Math.max(12, anchorY - popoverRect.height - 14);
        classicalLanguagePopover.style.left = `${left}px`;
        classicalLanguagePopover.style.top = `${top}px`;
      });
    });
  }

  app.querySelector('[data-systems-toggle]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    const section = button.closest('.systems-progress');
    const content = section?.querySelector('#systems-progress-content');
    const summary = section?.querySelector('.systems-progress__summary');
    if (!section || !content || !summary) return;

    const isCollapsed = !content.hidden;
    content.hidden = isCollapsed;
    summary.hidden = isCollapsed;
    section.classList.toggle('is-collapsed', isCollapsed);
    button.setAttribute('aria-expanded', String(!isCollapsed));
    button.querySelector('[data-systems-toggle-label]').textContent = isCollapsed ? '계층 펼치기' : '계층 접기';
    button.querySelector('i').textContent = isCollapsed ? '+' : '−';
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
