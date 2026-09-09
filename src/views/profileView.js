import { classicalLanguageProgress, classicalLanguageStages } from '../data/classicalLanguageProgress.js';
import { topics } from '../data/posts.js';
import { systemsStack } from '../data/systemsStack.js';
import { escapeHTML } from '../utils/sanitize.js';

export function createProfileView({ allPosts, latestPostContext }) {
  const systemsStatusLabels = {
    complete: '달성',
    learning: '학습 중',
    planned: '미달성',
  };
  const completedSystemsLayers = systemsStack.filter((layer) => layer.status === 'complete').length;
  const systemsProgress = Math.round((completedSystemsLayers / systemsStack.length) * 100);
  const systemsLayers = systemsStack
    .map((layer, index) => {
      const status = systemsStatusLabels[layer.status] ? layer.status : 'planned';
      const nextStatus = systemsStack[index + 1]?.status;
      const connectsToNext = status === 'complete' && nextStatus === 'complete';
      const evidence = layer.evidence.length
        ? `<ul>${layer.evidence.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`
        : '<p>아직 기록된 달성 근거가 없습니다.</p>';

      return `
        <li class="systems-stack__step is-${status}${connectsToNext ? ' connects-next' : ''}">
          <details class="systems-layer"${index === 0 ? ' open' : ''}>
            <summary>
              <span class="systems-layer__node" aria-hidden="true">${layer.level}</span>
              <span class="systems-layer__card">
                <span class="systems-layer__meta">
                  <small>${escapeHTML(layer.domain)}</small>
                  <span>${escapeHTML(systemsStatusLabels[status])}</span>
                </span>
                <strong>${escapeHTML(layer.title)}</strong>
                <span class="systems-layer__prompt">${escapeHTML(layer.question)}</span>
                <span class="systems-layer__toggle" aria-hidden="true">근거 보기 <i>+</i></span>
              </span>
            </summary>
            <div class="systems-layer__evidence">
              <span class="page-eyebrow">EVIDENCE NOTE</span>
              ${evidence}
            </div>
          </details>
        </li>
      `;
    })
    .join('');

  const classicalStageGuide = classicalLanguageStages
    .map(
      (stage) => `
        <span class="classical-progress__checkpoint classical-progress__checkpoint--guide">
          <button
            class="classical-progress__stage-button"
            type="button"
            data-classical-language-details
            data-detail-key="stage-${stage.level}"
            data-detail-eyebrow="${stage.level}단계 판정 기준"
            data-detail-title="${escapeHTML(stage.title)}"
            data-detail-body="${escapeHTML(stage.criterion)}"
            aria-expanded="false"
            aria-controls="classical-language-detail-popover"
          >
            <span>${stage.level}</span>
            <strong>${escapeHTML(stage.title)}</strong>
            <small>상세보기</small>
          </button>
        </span>
      `,
    )
    .join('');

  const classicalLanguageRows = classicalLanguageProgress
    .map((language) => {
      const hasLevel = Number.isInteger(language.level)
        && classicalLanguageStages.some((stage) => stage.level === language.level);
      const currentStage = hasLevel
        ? classicalLanguageStages.find((stage) => stage.level === language.level)
        : null;
      const checkpoints = classicalLanguageStages
        .map((stage, index) => {
          const isReached = hasLevel && stage.level <= language.level;
          const connectsToNext = hasLevel
            && index < classicalLanguageStages.length - 1
            && stage.level < language.level;
          const classes = [
            'classical-progress__checkpoint',
            isReached ? 'is-reached' : '',
            stage.level === language.level ? 'is-current' : '',
            connectsToNext ? 'connects-next' : '',
          ].filter(Boolean).join(' ');

          return `
            <span
              class="${classes}"
              title="${escapeHTML(`${stage.level}단계 ${stage.title}: ${stage.criterion}`)}"
              ${stage.level === language.level ? 'aria-current="step"' : ''}
            >
              <i aria-hidden="true"></i>
              <small>${stage.level}</small>
            </span>
          `;
        })
        .join('');
      const progressLabel = currentStage
        ? `${language.name}: ${currentStage.level}단계 ${currentStage.title}`
        : `${language.name}: 단계 미설정`;
      const note = language.note || '아직 작성된 설명이 없습니다.';

      return `
        <div class="classical-progress__row" role="row">
          <div class="classical-progress__language" role="rowheader">
            <strong>${escapeHTML(language.name)}</strong>
            <span>${currentStage ? `${currentStage.level}단계 · ${escapeHTML(currentStage.title)}` : '단계 미설정'}</span>
            <button
              type="button"
              data-classical-language-details
              data-detail-key="language-${escapeHTML(language.id)}"
              data-detail-eyebrow="LANGUAGE NOTE"
              data-detail-title="${escapeHTML(language.name)}"
              data-detail-body="${escapeHTML(note)}"
              aria-expanded="false"
              aria-controls="classical-language-detail-popover"
            >
              <span>설명 보기</span>
              <i data-detail-icon aria-hidden="true">+</i>
            </button>
          </div>
          <div
            class="classical-progress__meter${hasLevel ? '' : ' is-unset'}"
            role="img"
            aria-label="${escapeHTML(progressLabel)}"
          >
            ${checkpoints}
          </div>
        </div>
      `;
    })
    .join('');

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
        <div class="profile-portrait">
          <img
            class="profile-portrait__image"
            src="/images/profile-lambda.svg"
            alt="아이보리색 원 안의 남색 그리스 문자 대문자 람다 프로필 로고"
          />
        </div>
        <div class="profile-intro">
          <span class="page-eyebrow">PROFILE · 아선대너무좋아님</span>
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
        <div class="profile-identity__mark" aria-hidden="true">
          <img src="/images/profile-lambda.svg" alt="" />
        </div>
        <div class="profile-identity__copy">
          <span class="page-eyebrow">WHO AM I?</span>
          <h2 id="profile-identity-title">아선대너무좋아님</h2>
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

      <section class="classical-progress" aria-labelledby="classical-progress-title">
        <header class="classical-progress__intro">
          <span class="page-eyebrow">CLASSICAL TEXT READING PROGRESS</span>
          <h2 id="classical-progress-title">고전어 원전 독해 진행도</h2>
          <p>고대어·고전 원전을 읽는 독해 학습 진행도를 고전어 학습 방법론에 따라 기록합니다. 각 단계의 간격이 동일하진 않습니다.</p>
          <button
            class="classical-progress__toggle"
            type="button"
            data-classical-progress-toggle
            aria-expanded="true"
            aria-controls="classical-progress-content"
          >
            <span data-classical-progress-toggle-label>진행도 접기</span>
            <i aria-hidden="true">−</i>
          </button>
          <button class="classical-progress__related-post" type="button" data-post-id="lang_3">
            <span>관련 포스트</span>
            <strong>${escapeHTML(allPosts.find(({ post }) => post.id === 'lang_3')?.post.title ?? '언어 진행도 정리')}</strong>
            <i aria-hidden="true">→</i>
          </button>
        </header>
        <div id="classical-progress-content" class="classical-progress__scroller" tabindex="0" aria-label="고전어 원전 독해 진행도 표. 좌우로 스크롤할 수 있습니다.">
          <div class="classical-progress__grid" role="table" aria-labelledby="classical-progress-title">
            <div class="classical-progress__row classical-progress__row--guide" role="row">
              <div class="classical-progress__language classical-progress__language--guide" role="rowheader">
                <strong>단계 기준</strong>
                <span>0–7 학습 단계</span>
              </div>
              <div class="classical-progress__meter classical-progress__meter--guide" role="cell">
                ${classicalStageGuide}
              </div>
            </div>
            ${classicalLanguageRows}
          </div>
        </div>
        <div id="classical-language-detail-popover" class="classical-language-popover" popover role="tooltip">
          <span data-classical-popover-eyebrow></span>
          <strong data-classical-popover-title></strong>
          <p data-classical-popover-body></p>
        </div>
      </section>

      <section class="systems-progress" aria-labelledby="systems-progress-title">
        <header class="systems-progress__header">
          <div>
            <span class="page-eyebrow">COMPUTER SYSTEMS ABSTRACTION STACK</span>
            <h2 id="systems-progress-title">컴퓨터 시스템 추상화 계층<br>학습 현황</h2>
            <p>반도체의 물리적 원리에 해당하는 Low Level부터 응용 프로그램 작성 지침에 해당하는 High Level까지의 컴퓨터 전 범위를 얼마나 이해했는지를 기록합니다. 학부과정의 얕은 수준에서나마 모두 이해하는 것이 목표입니다.</p>
            <div class="systems-progress__actions">
              <button
                class="systems-progress__action systems-progress__action--toggle"
                type="button"
                data-systems-toggle
                aria-expanded="true"
                aria-controls="systems-progress-content"
              >
                <span data-systems-toggle-label>계층 접기</span>
                <i aria-hidden="true">−</i>
              </button>
            </div>
          </div>
          <div class="systems-progress__aside">
            <button class="systems-progress__action systems-progress__action--post" type="button" data-post-id="eng_2">
              <span>관련 포스트</span>
              <strong>프로그래밍의 토대를 배우자</strong>
              <i aria-hidden="true">→</i>
            </button>
            <div class="systems-progress__summary" aria-label="${systemsStack.length}개 계층 중 ${completedSystemsLayers}개 달성">
              <strong>${completedSystemsLayers}<span> / ${systemsStack.length}</span></strong>
              <small>기록된 달성</small>
              <span class="systems-progress__bar" aria-hidden="true"><i style="--progress: ${systemsProgress}%"></i></span>
            </div>
          </div>
        </header>
        <div id="systems-progress-content" class="systems-progress__content">
          <div class="systems-progress__legend" aria-label="달성 상태 범례">
            <span><i class="is-complete"></i>달성</span>
            <span><i class="is-learning"></i>학습 중</span>
            <span><i class="is-planned"></i>미달성</span>
          </div>
          <ol class="systems-stack" reversed>
            ${systemsLayers}
          </ol>
        </div>
      </section>
    </main>
  `;
}

