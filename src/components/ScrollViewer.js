import { createPostCard, loadGiscusForCard } from './PostCard.js';

let commentObserver = null;

export function createScrollViewer() {
  const viewer = document.createElement('div');
  viewer.className = 'scroll-viewer';

  viewer.innerHTML = `
    <div class="scroll-handle scroll-handle--left"></div>
    <div class="scroll-parchment-wrapper">
      <div class="scroll-parchment"></div>
    </div>
    <div class="scroll-handle scroll-handle--right"></div>
    <div class="scroll-progress"></div>
  `;

  return viewer;
}

export function loadTopic(viewer, topic) {
  cleanupCommentObserver();

  const parchment = viewer.querySelector('.scroll-parchment');
  parchment.innerHTML = '';

  topic.posts.forEach((post) => {
    const card = createPostCard(post);
    parchment.appendChild(card);
  });

  // Reset scroll position
  const wrapper = viewer.querySelector('.scroll-parchment-wrapper');
  wrapper.scrollLeft = 0;

  // Reset progress
  updateProgress(viewer, 0);
}

export function startCommentObserver(viewer) {
  cleanupCommentObserver();

  const wrapper = viewer.querySelector('.scroll-parchment-wrapper');
  const parchment = viewer.querySelector('.scroll-parchment');

  commentObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadGiscusForCard(entry.target);
          commentObserver.unobserve(entry.target);
        }
      });
    },
    { root: wrapper, threshold: 0.1 }
  );

  parchment.querySelectorAll('.post-card').forEach((card) => {
    commentObserver.observe(card);
  });
}

export function cleanupCommentObserver() {
  if (commentObserver) {
    commentObserver.disconnect();
    commentObserver = null;
  }
}

export function getParchmentWrapper(viewer) {
  return viewer.querySelector('.scroll-parchment-wrapper');
}

export function scrollToPost(viewer, postId, scrollCtrl) {
  const wrapper = viewer.querySelector('.scroll-parchment-wrapper');
  const card = wrapper.querySelector(`[data-post-id="${CSS.escape(postId)}"]`);
  if (!card) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const scrollOffset = cardRect.left - wrapperRect.left + wrapper.scrollLeft - 20;

  if (scrollCtrl) {
    scrollCtrl.scrollTo(scrollOffset);
  } else {
    wrapper.scrollTo({
      left: scrollOffset,
      behavior: 'smooth',
    });
  }
}

export function updateProgress(viewer, ratio) {
  const bar = viewer.querySelector('.scroll-progress');
  if (bar) {
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
  }
}
