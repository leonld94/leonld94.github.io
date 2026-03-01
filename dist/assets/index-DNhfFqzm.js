(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const c of t)if(c.type==="childList")for(const a of c.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(t){const c={};return t.integrity&&(c.integrity=t.integrity),t.referrerPolicy&&(c.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?c.credentials="include":t.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function i(t){if(t.ep)return;t.ep=!0;const c=n(t);fetch(t.href,c)}})();const A=[{id:"tech",title:"기술",emoji:"💻",icon:"&#xe3af;",posts:[{id:"tech-001",title:"JavaScript 비동기 처리의 이해",date:"2026-02-15",content:`<h2>콜백에서 async/await까지</h2>
<p>JavaScript의 비동기 처리는 웹 개발의 핵심입니다. 초기에는 콜백 함수를 사용했지만, 콜백 지옥이라는 문제가 발생했습니다.</p>
<h3>Promise의 등장</h3>
<p>ES6에서 도입된 Promise는 비동기 작업을 체이닝할 수 있게 해주었습니다. <code>.then()</code>과 <code>.catch()</code>를 통해 성공과 실패를 깔끔하게 처리할 수 있습니다.</p>
<h3>async/await</h3>
<p>ES2017에서 도입된 async/await는 비동기 코드를 동기 코드처럼 작성할 수 있게 해줍니다. 가독성이 크게 향상되며, try-catch로 에러 처리가 가능합니다.</p>
<pre><code class="language-javascript">async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
</code></pre>
<p>현대 JavaScript 개발에서는 async/await가 표준적인 비동기 처리 방식이 되었습니다.</p>
`},{id:"tech-002",title:"CSS Grid 완벽 가이드",date:"2026-01-20",content:`<h2>2차원 레이아웃의 혁명</h2>
<p>CSS Grid는 웹 레이아웃을 근본적으로 변화시켰습니다. Flexbox가 1차원 레이아웃에 특화되어 있다면, Grid는 행과 열을 동시에 제어할 수 있습니다.</p>
<h3>기본 개념</h3>
<p><code>display: grid</code>를 선언하고, <code>grid-template-columns</code>와 <code>grid-template-rows</code>로 구조를 정의합니다.</p>
<pre><code class="language-css">.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
</code></pre>
<h3>실전 패턴</h3>
<p>반응형 카드 레이아웃, 대시보드, 매거진 스타일 등 다양한 패턴을 Grid로 쉽게 구현할 수 있습니다. <code>auto-fill</code>과 <code>minmax()</code>를 조합하면 미디어 쿼리 없이도 반응형 디자인이 가능합니다.</p>
`},{id:"tech-003",title:"Web Animation API 심화",date:"2025-12-10",content:`<h2>브라우저 네이티브 애니메이션</h2>
<p>Web Animations API는 CSS 애니메이션과 JavaScript 제어의 장점을 결합합니다. requestAnimationFrame보다 선언적이고, CSS보다 유연합니다.</p>
<h3>기본 사용법</h3>
<pre><code class="language-javascript">element.animate([
  { transform: 'translateX(0)' },
  { transform: 'translateX(300px)' }
], {
  duration: 1000,
  easing: 'ease-out',
  fill: 'forwards'
});
</code></pre>
<h3>타임라인 제어</h3>
<p>Animation 객체의 <code>pause()</code>, <code>reverse()</code>, <code>playbackRate</code> 등을 통해 세밀한 제어가 가능합니다.</p>
`}]},{id:"life",title:"일상",emoji:"🌿",posts:[{id:"life-001",title:"미니멀 라이프 시작하기",date:"2026-02-01",content:`<h2>덜어내는 삶의 가치</h2>
<p>미니멀리즘을 시작한 지 6개월이 지났습니다. 물건을 줄이는 것에서 시작했지만, 결국 삶의 우선순위를 재정립하는 과정이었습니다.</p>
<h3>시작은 작게</h3>
<p>옷장에서 1년간 입지 않은 옷을 정리하는 것부터 시작했습니다. 처음엔 망설여졌지만, 비워진 공간이 주는 해방감은 예상 이상이었습니다.</p>
<h3>디지털 미니멀리즘</h3>
<p>물리적 공간뿐 아니라 디지털 공간도 정리했습니다. 사용하지 않는 앱 삭제, 알림 최소화, SNS 사용 시간 제한. 집중력이 눈에 띄게 향상되었습니다.</p>
<p>미니멀리즘은 목적이 아니라 도구입니다. 정말 중요한 것에 집중하기 위한 방법론이라고 생각합니다.</p>
`},{id:"life-002",title:"집에서 만드는 수제 빵",date:"2026-01-15",content:`<h2>사워도우 여정</h2>
<p>코로나 시절 시작한 홈베이킹이 이제는 주말 루틴이 되었습니다. 특히 사워도우 빵은 만드는 과정 자체가 명상과 같습니다.</p>
<h3>스타터 키우기</h3>
<p>밀가루와 물만으로 자연 발효종을 키웁니다. 매일 먹이를 주며 관찰하는 과정에서 미생물의 세계를 엿볼 수 있습니다.</p>
<h3>첫 번째 빵</h3>
<p>7일간 키운 스타터로 드디어 첫 사워도우를 구웠습니다. 오븐 스프링이 완벽하진 않았지만, 집 안에 퍼진 빵 냄새는 잊을 수 없습니다.</p>
`},{id:"life-003",title:"아침 루틴의 힘",date:"2025-12-28",content:`<h2>하루를 바꾸는 첫 두 시간</h2>
<p>아침 5시 30분 기상을 3개월째 실천하고 있습니다. 세상이 조용한 이른 아침, 온전히 나만의 시간을 갖는 것은 생각보다 큰 변화를 가져왔습니다.</p>
<h3>나의 아침 루틴</h3>
<p>5:30 기상 → 스트레칭 10분 → 명상 15분 → 독서 30분 → 글쓰기 30분. 이 두 시간이 하루 전체의 톤을 결정합니다.</p>
`}]},{id:"travel",title:"여행",emoji:"✈️",posts:[{id:"travel-001",title:"교토의 숨겨진 정원들",date:"2026-01-25",content:`<h2>관광객이 모르는 교토</h2>
<p>교토를 세 번째 방문하면서, 이번에는 유명 관광지 대신 현지인들이 사랑하는 작은 정원들을 찾아다녔습니다.</p>
<h3>시센도(詩仙堂)</h3>
<p>이치조지 지역의 작은 사찰. 단풍 시즌에도 비교적 한적하며, 다다미 방에 앉아 정원을 바라보는 시간이 여행의 하이라이트였습니다.</p>
<h3>도후쿠지 호조 정원</h3>
<p>현대적 감각의 석정(石庭)이 인상적이었습니다. 사각형 돌과 이끼가 체크무늬를 이루는 모습은 전통과 현대의 조화를 보여줍니다.</p>
<p>교토의 진짜 매력은 골목 안에 숨어 있습니다.</p>
`},{id:"travel-002",title:"제주 올레길 종주기",date:"2025-12-05",content:`<h2>26코스, 425km의 기록</h2>
<p>제주 올레길 전 코스를 2주에 걸쳐 완주했습니다. 매일 평균 30km를 걸으며 제주의 다양한 얼굴을 만났습니다.</p>
<h3>하이라이트 코스</h3>
<p>7코스(외돌개~월평): 해안 절벽을 따라 걷는 구간이 압권. 10코스(표선~온평): 넓은 들판과 오름이 어우러진 제주의 전형적인 풍경.</p>
<h3>걸으며 깨달은 것</h3>
<p>속도를 늦추면 보이는 것들이 있습니다. 길가의 작은 꽃, 바람의 방향, 구름의 움직임. 걷기는 세상을 가장 정직하게 경험하는 방법입니다.</p>
`},{id:"travel-003",title:"포르투갈 리스본 3일",date:"2025-11-18",content:`<h2>노란 트램과 파두의 도시</h2>
<p>리스본은 기대 이상이었습니다. 언덕 위에서 내려다보는 빨간 지붕들, 좁은 골목에서 울려퍼지는 파두 음악, 그리고 에그타르트의 완벽한 맛.</p>
<h3>알파마 지구</h3>
<p>리스본에서 가장 오래된 동네. 미로 같은 골목길을 헤매다 보면 예상치 못한 전망대를 만납니다. 해질녘 미라도루로 다 그라사에서 본 풍경은 잊을 수 없습니다.</p>
<h3>벨렝 지구</h3>
<p>제로니모스 수도원의 압도적인 건축미. 그리고 바로 옆 파스테이스 데 벨렝에서 먹는 따뜻한 에그타르트. 시나몬을 뿌려 먹으면 완벽합니다.</p>
`}]},{id:"book",title:"독서",emoji:"📚",posts:[{id:"book-001",title:"올해 읽은 최고의 책 5선",date:"2026-02-20",content:`<h2>2025년 독서 결산</h2>
<p>지난해 읽은 47권 중 가장 인상 깊었던 5권을 소개합니다.</p>
<h3>1. 사피엔스 - 유발 하라리</h3>
<p>인류의 역사를 거시적 관점에서 조망합니다. 특히 '허구를 믿는 능력’이 인류를 지구의 지배자로 만들었다는 관점이 인상적이었습니다.</p>
<h3>2. 원씽 - 게리 켈러</h3>
<p>집중의 힘에 대한 책. &quot;가장 중요한 한 가지는 무엇인가?&quot;라는 질문이 의사결정의 프레임워크가 되었습니다.</p>
<h3>3. 디자인 오브 에브리데이 씽스</h3>
<p>도널드 노먼의 UX 고전. 문 손잡이부터 스위치까지, 일상 속 디자인을 다시 보게 됩니다.</p>
`},{id:"book-002",title:"효과적인 독서법",date:"2026-01-10",content:`<h2>읽는 것과 이해하는 것의 차이</h2>
<p>많이 읽는 것보다 깊이 읽는 것이 중요합니다. 제가 실천하는 독서법을 공유합니다.</p>
<h3>3단계 독서법</h3>
<p>1단계: 훑어보기(30분) - 목차, 서론, 결론을 빠르게 파악. 2단계: 정독(시간 무제한) - 밑줄과 메모를 하며 천천히. 3단계: 정리(1시간) - 핵심 내용을 자신의 언어로 요약.</p>
<h3>메모의 중요성</h3>
<p>책의 내용을 그대로 옮기는 것이 아니라, 자신의 경험과 연결 짓는 메모가 진짜 학습입니다.</p>
`}]}];function C(e,s){const n=document.createElement("div");return n.className="scroll-rack",e.forEach(i=>{const t=document.createElement("div");t.className="scroll-icon",t.dataset.topicId=i.id,t.innerHTML=`
      <div class="scroll-icon__roll">
        <div class="scroll-icon__rod scroll-icon__rod--left"></div>
        <div class="scroll-icon__body"></div>
        <div class="scroll-icon__rod scroll-icon__rod--right"></div>
        <span class="scroll-icon__emoji">${i.emoji}</span>
      </div>
      <span class="scroll-icon__label">${i.title}</span>
    `,t.addEventListener("click",()=>{s(i.id)}),n.appendChild(t)}),n}function y(e,s){e.querySelectorAll(".scroll-icon").forEach(n=>{n.classList.toggle("active",n.dataset.topicId===s)})}function q(e){const s=document.createElement("div");return s.className="post-card",s.dataset.postId=e.id,s.innerHTML=`
    <h3 class="post-card__title">${e.title}</h3>
    <div class="post-card__date">${I(e.date)}</div>
    <div class="post-card__content">${e.content}</div>
  `,s}function I(e){const s=new Date(e),n=s.getFullYear(),i=s.getMonth()+1,t=s.getDate();return`${n}년 ${i}월 ${t}일`}function M(){const e=document.createElement("div");return e.className="scroll-viewer",e.innerHTML=`
    <div class="scroll-handle scroll-handle--left"></div>
    <div class="scroll-parchment-wrapper">
      <div class="scroll-parchment"></div>
      <div class="scroll-progress"></div>
    </div>
    <div class="scroll-handle scroll-handle--right"></div>
  `,e}function N(e,s){const n=e.querySelector(".scroll-parchment");n.innerHTML="",s.posts.forEach(t=>{const c=q(t);n.appendChild(c)});const i=e.querySelector(".scroll-parchment-wrapper");i.scrollLeft=0,T(e,0)}function R(e){return e.querySelector(".scroll-parchment-wrapper")}function O(e,s){const n=e.querySelector(".scroll-parchment-wrapper"),i=n.querySelector(`[data-post-id="${s}"]`);if(!i)return;const t=n.getBoundingClientRect(),a=i.getBoundingClientRect().left-t.left+n.scrollLeft-20;n.scrollTo({left:a,behavior:"smooth"})}function T(e,s){const n=e.querySelector(".scroll-progress");n&&(n.style.width=`${Math.min(100,Math.max(0,s*100))}%`)}function $(){const e=document.createElement("nav");return e.className="sidebar",e.innerHTML=`
    <div class="sidebar__topic-label"></div>
    <ul class="sidebar__list"></ul>
  `,e}function H(e,s,n){const i=e.querySelector(".sidebar__topic-label"),t=e.querySelector(".sidebar__list");i.textContent=s.title,t.innerHTML="",s.posts.forEach(c=>{const a=document.createElement("li");a.className="sidebar__item",a.dataset.postId=c.id,a.innerHTML=`
      <div>${c.title}</div>
      <div class="sidebar__date">${c.date}</div>
    `,a.addEventListener("click",()=>{n(c.id)}),t.appendChild(a)})}function P(e,s){e.querySelectorAll(".sidebar__item").forEach(n=>{n.classList.toggle("active",n.dataset.postId===s)})}function j(e){e.classList.add("visible")}function W(e){e.classList.remove("visible")}const L=650,_=400;function k(e){return new Promise(s=>{e.classList.remove("unfurled"),e.classList.add("unfurling");const n=e.animate([{height:"0px",opacity:0},{height:"75vh",opacity:1}],{duration:L*.5,easing:"cubic-bezier(0.34, 1.56, 0.64, 1)",fill:"forwards"});n.onfinish=()=>{const i=e.querySelector(".scroll-parchment-wrapper"),t=i.animate([{width:"0px"},{width:"min(75vw, 1100px)"}],{duration:L*.6,easing:"cubic-bezier(0.22, 1, 0.36, 1)",fill:"forwards"});t.onfinish=()=>{e.classList.remove("unfurling"),e.classList.add("unfurled"),e.style.height="75vh",e.style.opacity="1",i.style.width="min(75vw, 1100px)",n.cancel(),t.cancel(),s()}}})}function S(e){return new Promise(s=>{e.classList.remove("unfurled"),e.classList.add("unfurling");const n=e.querySelector(".scroll-parchment-wrapper"),i=n.animate([{width:n.offsetWidth+"px"},{width:"0px"}],{duration:_*.5,easing:"cubic-bezier(0.55, 0, 1, 0.45)",fill:"forwards"});i.onfinish=()=>{const t=e.animate([{height:e.offsetHeight+"px",opacity:1},{height:"0px",opacity:0}],{duration:_*.6,easing:"ease-in",fill:"forwards"});t.onfinish=()=>{e.classList.remove("unfurling"),e.style.height="",e.style.opacity="",n.style.width="",t.cancel(),i.cancel(),s()}}})}function D(e,{speed:s=2,onProgress:n}={}){let i=e.scrollLeft,t=!1;function c(r){r.preventDefault(),r.stopPropagation(),i+=r.deltaY*s;const x=e.scrollWidth-e.clientWidth;i=Math.max(0,Math.min(i,x)),t||(t=!0,a())}function a(){const r=i-e.scrollLeft;if(Math.abs(r)<.5){e.scrollLeft=i,t=!1,v();return}e.scrollLeft+=r*.12,v(),requestAnimationFrame(a)}function v(){if(!n)return;const r=e.scrollWidth-e.clientWidth;if(r<=0){n(0);return}n(e.scrollLeft/r)}return e.addEventListener("wheel",c,{passive:!1}),e.addEventListener("scroll",()=>{t||(i=e.scrollLeft,v())}),{destroy(){e.removeEventListener("wheel",c)},reset(){i=0,e.scrollLeft=0,v()}}}const o={activeTopic:null,isAnimating:!1,activePostId:null};let g=null,d=null;const u=document.getElementById("app"),f=document.createElement("header");f.className="header";f.innerHTML=`
  <h1 class="header__title">Sungho's Blog</h1>
  <p class="header__subtitle">생각을 펼치다</p>
`;const m=document.createElement("div");m.className="welcome";m.innerHTML=`
  <div class="welcome__icon">📜</div>
  <div class="welcome__text">아래 두루마리를 선택하여<br>이야기를 펼쳐보세요</div>
`;const h=document.createElement("div");h.className="hint";h.textContent="↕ 스크롤하여 글을 넘겨보세요";const p=$(),l=M(),b=C(A,F);u.appendChild(f);u.appendChild(m);u.appendChild(h);u.appendChild(p);u.appendChild(l);u.appendChild(b);async function F(e){if(o.isAnimating)return;const s=A.find(i=>i.id===e);if(!s)return;if(o.activeTopic===e){o.isAnimating=!0,W(p),h.classList.remove("visible"),f.classList.remove("hidden"),m.classList.remove("hidden"),w(),await S(l),o.activeTopic=null,o.activePostId=null,y(b,null),o.isAnimating=!1;return}o.activeTopic&&(o.isAnimating=!0,w(),await S(l),o.activeTopic=null),o.isAnimating=!0,o.activeTopic=e,y(b,e),f.classList.add("hidden"),m.classList.add("hidden"),N(l,s),H(p,s,i=>{O(l,i)}),await k(l),j(p);const n=R(l);g=D(n,{speed:2.5,onProgress:i=>{T(l,i)}}),n.scrollLeft=0,h.classList.add("visible"),setTimeout(()=>h.classList.remove("visible"),3e3),s.posts.length>0&&(o.activePostId=s.posts[0].id,P(p,s.posts[0].id)),setTimeout(()=>{U(n)},600),o.isAnimating=!1}function U(e,s){d&&d.disconnect(),d=new IntersectionObserver(n=>{let i=null;if(n.forEach(t=>{t.isIntersecting&&t.intersectionRatio>.2&&(!i||t.boundingClientRect.left<i.boundingClientRect.left)&&(i=t)}),i){const t=i.target.dataset.postId;t&&t!==o.activePostId&&(o.activePostId=t,P(p,t))}},{root:e,threshold:[.2,.5,.8]}),e.querySelectorAll(".post-card").forEach(n=>{d.observe(n)})}function w(){g&&(g.destroy(),g=null),d&&(d.disconnect(),d=null)}
