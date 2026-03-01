---
id: eng_2
title: CSS Grid 완벽 가이드
date: 2026-01-20
topic: eng
---

## 2차원 레이아웃의 혁명

CSS Grid는 웹 레이아웃을 근본적으로 변화시켰습니다. Flexbox가 1차원 레이아웃에 특화되어 있다면, Grid는 행과 열을 동시에 제어할 수 있습니다.

### 기본 개념

`display: grid`를 선언하고, `grid-template-columns`와 `grid-template-rows`로 구조를 정의합니다.

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
```

### 실전 패턴

반응형 카드 레이아웃, 대시보드, 매거진 스타일 등 다양한 패턴을 Grid로 쉽게 구현할 수 있습니다. `auto-fill`과 `minmax()`를 조합하면 미디어 쿼리 없이도 반응형 디자인이 가능합니다.
