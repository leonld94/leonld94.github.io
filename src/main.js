import './styles/main.css';
import { topics } from './data/posts.js';
import { createScrollRack, setActiveIcon } from './components/ScrollRack.js';
import { createScrollViewer, loadTopic, getParchmentWrapper, scrollToPost, updateProgress } from './components/ScrollViewer.js';
import { createSidebar, updateSidebar, setActivePost, showSidebar, hideSidebar } from './components/Sidebar.js';
import { unfurl, refurl } from './animations/unfurl.js';
import { enableHorizontalScroll } from './scroll/horizontalScroll.js';

// ── State ──
const state = {
  activeTopic: null,
  isAnimating: false,
  activePostId: null,
};

let horizontalScrollCtrl = null;
let postObserver = null;

// ── DOM Setup ──
const app = document.getElementById('app');

// Header
const header = document.createElement('header');
header.className = 'header';
header.innerHTML = `
  <h1 class="header__title">아선대너무좋아님</h1>
  <p class="header__subtitle">생각을 펼치다</p>
`;

// Welcome
const welcome = document.createElement('div');
welcome.className = 'welcome';
welcome.innerHTML = `
  <img class="welcome__icon" src="/images/scroll.png" alt="두루마리" />
  <div class="welcome__text">아래 두루마리를 선택하여<br>이야기를 펼쳐보세요</div>
`;

// Hint
const hint = document.createElement('div');
hint.className = 'hint';
hint.textContent = '↕ 스크롤하여 글을 넘겨보세요';

// Components
const sidebar = createSidebar();
const scrollViewer = createScrollViewer();
const scrollRack = createScrollRack(topics, handleTopicSelect);

// Mount
app.appendChild(header);
app.appendChild(welcome);
app.appendChild(hint);
app.appendChild(sidebar);
app.appendChild(scrollViewer);
app.appendChild(scrollRack);

// ── Topic Selection Handler ──
async function handleTopicSelect(topicId) {
  if (state.isAnimating) return;

  const topic = topics.find((t) => t.id === topicId);
  if (!topic) return;

  // Same topic → close
  if (state.activeTopic === topicId) {
    state.isAnimating = true;
    hideSidebar(sidebar);
    hint.classList.remove('visible');
    header.classList.remove('hidden');
    welcome.classList.remove('hidden');

    cleanupScroll();
    await refurl(scrollViewer);

    state.activeTopic = null;
    state.activePostId = null;
    setActiveIcon(scrollRack, null);
    state.isAnimating = false;
    return;
  }

  // Different topic while one is open → close first then open
  if (state.activeTopic) {
    state.isAnimating = true;
    cleanupScroll();
    await refurl(scrollViewer);
    state.activeTopic = null;
  }

  // Open new topic
  state.isAnimating = true;
  state.activeTopic = topicId;
  setActiveIcon(scrollRack, topicId);

  header.classList.add('hidden');
  welcome.classList.add('hidden');

  // Load posts into scroll
  loadTopic(scrollViewer, topic);

  // Update sidebar
  updateSidebar(sidebar, topic, (postId) => {
    scrollToPost(scrollViewer, postId);
  });

  // Unfurl animation
  await unfurl(scrollViewer);

  // Show sidebar after unfurl
  showSidebar(sidebar);

  // Set up horizontal scroll
  const wrapper = getParchmentWrapper(scrollViewer);
  horizontalScrollCtrl = enableHorizontalScroll(wrapper, {
    speed: 2.5,
    onProgress: (ratio) => {
      updateProgress(scrollViewer, ratio);
    },
  });

  // Ensure scroll starts at the first (newest) post
  horizontalScrollCtrl.reset();

  // Show hint briefly
  hint.classList.add('visible');
  setTimeout(() => hint.classList.remove('visible'), 3000);

  // Set first post as active
  if (topic.posts.length > 0) {
    state.activePostId = topic.posts[0].id;
    setActivePost(sidebar, topic.posts[0].id);
  }

  // Observe posts for active highlighting (delay to avoid animation interference)
  setTimeout(() => {
    setupPostObserver(wrapper, topic);
  }, 600);

  state.isAnimating = false;
}

// ── Post Observer ──
function setupPostObserver(wrapper, topic) {
  if (postObserver) {
    postObserver.disconnect();
  }

  postObserver = new IntersectionObserver(
    (entries) => {
      // Find the leftmost visible post card
      let bestEntry = null;
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          if (!bestEntry || entry.boundingClientRect.left < bestEntry.boundingClientRect.left) {
            bestEntry = entry;
          }
        }
      });
      if (bestEntry) {
        const postId = bestEntry.target.dataset.postId;
        if (postId && postId !== state.activePostId) {
          state.activePostId = postId;
          setActivePost(sidebar, postId);
        }
      }
    },
    {
      root: wrapper,
      threshold: [0.2, 0.5, 0.8],
    }
  );

  wrapper.querySelectorAll('.post-card').forEach((card) => {
    postObserver.observe(card);
  });
}

// ── Cleanup ──
function cleanupScroll() {
  if (horizontalScrollCtrl) {
    horizontalScrollCtrl.destroy();
    horizontalScrollCtrl = null;
  }
  if (postObserver) {
    postObserver.disconnect();
    postObserver = null;
  }
}
