import { voiceContents } from '../data/voiceContents.js';
import { escapeHTML } from '../utils/sanitize.js';

export function createVoiceView() {
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

export function voiceUnitKey(workId, unitId) {
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

export function createVoiceDetailView({ state, voiceUnitCache, voiceUnitErrors, voiceVolume }) {
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

