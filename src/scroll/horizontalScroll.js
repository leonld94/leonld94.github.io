export function enableHorizontalScroll(containerEl, { speed = 2, onProgress } = {}) {
  containerEl.scrollLeft = 0;
  let targetScrollLeft = 0;
  let animating = false;
  let animFrameId = null;

  function onWheel(e) {
    e.preventDefault();
    e.stopPropagation();

    // Normalize deltaY across browsers:
    // Firefox uses deltaMode 1 (lines), Chrome uses deltaMode 0 (pixels)
    let delta = e.deltaY;
    if (e.deltaMode === 1) {        // DOM_DELTA_LINE
      delta *= 40;
    } else if (e.deltaMode === 2) { // DOM_DELTA_PAGE
      delta *= containerEl.clientWidth;
    }

    targetScrollLeft += delta * speed;

    const maxScroll = containerEl.scrollWidth - containerEl.clientWidth;
    targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

    if (!animating) {
      animating = true;
      animFrameId = requestAnimationFrame(smoothScroll);
    }
  }

  function smoothScroll() {
    const diff = targetScrollLeft - containerEl.scrollLeft;

    if (Math.abs(diff) < 0.5) {
      containerEl.scrollLeft = targetScrollLeft;
      animating = false;
      animFrameId = null;
      emitProgress();
      return;
    }

    containerEl.scrollLeft += diff * 0.12;
    emitProgress();
    animFrameId = requestAnimationFrame(smoothScroll);
  }

  function emitProgress() {
    if (!onProgress) return;
    const maxScroll = containerEl.scrollWidth - containerEl.clientWidth;
    if (maxScroll <= 0) {
      onProgress(0);
      return;
    }
    onProgress(containerEl.scrollLeft / maxScroll);
  }

  function onScroll() {
    if (!animating) {
      targetScrollLeft = containerEl.scrollLeft;
      emitProgress();
    }
  }

  containerEl.addEventListener('wheel', onWheel, { passive: false });
  containerEl.addEventListener('scroll', onScroll);

  return {
    destroy() {
      containerEl.removeEventListener('wheel', onWheel);
      containerEl.removeEventListener('scroll', onScroll);
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      animating = false;
    },
    reset() {
      targetScrollLeft = 0;
      containerEl.scrollLeft = 0;
      emitProgress();
    },
    scrollTo(left) {
      const maxScroll = containerEl.scrollWidth - containerEl.clientWidth;
      targetScrollLeft = Math.max(0, Math.min(left, maxScroll));
      if (!animating) {
        animating = true;
        animFrameId = requestAnimationFrame(smoothScroll);
      }
    },
  };
}
