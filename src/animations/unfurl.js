const UNFURL_DURATION = 650;
const REFURL_DURATION = 400;

export function unfurl(viewerEl) {
  return new Promise((resolve) => {
    viewerEl.classList.remove('unfurled');
    viewerEl.classList.add('unfurling');

    // Phase 1: Height + opacity
    const heightAnim = viewerEl.animate(
      [
        { height: '0px', opacity: 0 },
        { height: '75vh', opacity: 1 },
      ],
      {
        duration: UNFURL_DURATION * 0.5,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards',
      }
    );

    heightAnim.onfinish = () => {
      // Phase 2: Width (parchment unrolls)
      const wrapper = viewerEl.querySelector('.scroll-parchment-wrapper');
      const widthAnim = wrapper.animate(
        [
          { width: '0px' },
          { width: 'min(75vw, 1100px)' },
        ],
        {
          duration: UNFURL_DURATION * 0.6,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );

      widthAnim.onfinish = () => {
        viewerEl.classList.remove('unfurling');
        viewerEl.classList.add('unfurled');

        // Set final styles directly
        viewerEl.style.height = '75vh';
        viewerEl.style.opacity = '1';
        wrapper.style.width = 'min(75vw, 1100px)';

        // Clean up animations
        heightAnim.cancel();
        widthAnim.cancel();

        resolve();
      };
    };
  });
}

export function refurl(viewerEl) {
  return new Promise((resolve) => {
    viewerEl.classList.remove('unfurled');
    viewerEl.classList.add('unfurling');

    const wrapper = viewerEl.querySelector('.scroll-parchment-wrapper');

    // Phase 1: Width collapses
    const widthAnim = wrapper.animate(
      [
        { width: wrapper.offsetWidth + 'px' },
        { width: '0px' },
      ],
      {
        duration: REFURL_DURATION * 0.5,
        easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
        fill: 'forwards',
      }
    );

    widthAnim.onfinish = () => {
      // Phase 2: Height collapses
      const heightAnim = viewerEl.animate(
        [
          { height: viewerEl.offsetHeight + 'px', opacity: 1 },
          { height: '0px', opacity: 0 },
        ],
        {
          duration: REFURL_DURATION * 0.6,
          easing: 'ease-in',
          fill: 'forwards',
        }
      );

      heightAnim.onfinish = () => {
        viewerEl.classList.remove('unfurling');

        // Reset inline styles
        viewerEl.style.height = '';
        viewerEl.style.opacity = '';
        wrapper.style.width = '';

        heightAnim.cancel();
        widthAnim.cancel();

        resolve();
      };
    };
  });
}
