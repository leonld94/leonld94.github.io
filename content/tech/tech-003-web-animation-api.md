---
id: tech-003
title: Web Animation API 심화
date: 2025-12-10
topic: tech
---

## 브라우저 네이티브 애니메이션

Web Animations API는 CSS 애니메이션과 JavaScript 제어의 장점을 결합합니다. requestAnimationFrame보다 선언적이고, CSS보다 유연합니다.

### 기본 사용법

```javascript
element.animate([
  { transform: 'translateX(0)' },
  { transform: 'translateX(300px)' }
], {
  duration: 1000,
  easing: 'ease-out',
  fill: 'forwards'
});
```

### 타임라인 제어

Animation 객체의 `pause()`, `reverse()`, `playbackRate` 등을 통해 세밀한 제어가 가능합니다.
