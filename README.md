# 아선대너무좋아의 블로그

공학, 언어, 수학, 철학에 관한 글과 행별 음성 콘텐츠를 제공하는 Vite 기반 정적 블로그입니다.

## 실행

```bash
npm install
npm run dev
```

프로덕션 결과는 `npm run build`로 생성합니다.

## 글 콘텐츠 추가

`content/eng`, `content/lang`, `content/math`, `content/philosophy` 중 알맞은 폴더에 Markdown 파일을 추가합니다. 별도의 JavaScript 수정은 필요하지 않습니다.

```markdown
---
id: eng_3
title: 새 글 제목
date: 2026-09-01
topic: eng
---

Markdown으로 본문을 작성합니다.
```

- `id`: 전체 블로그에서 중복되지 않는 글 식별자
- `topic`: `eng`, `lang`, `math`, `phil` 중 하나
- 다른 글로 연결할 때는 `[링크 이름](post://eng_3)` 형식을 사용
- 같은 분류 안에서는 `date`가 최신인 글부터 표시

새 분류를 만들려면 `vite-plugin-markdown-posts.js`의 `TOPIC_META`와 `TOPIC_ORDER`에 한 번 등록한 뒤 같은 이름의 콘텐츠 폴더를 만듭니다.

## 음성 콘텐츠 추가

음성 작품 하나는 `content/voice`의 JSON 파일 하나로 관리합니다. 기존 파일을 복사한 뒤 식별자와 제목, 행만 수정하면 메뉴와 상세 화면에 자동으로 추가됩니다.

```json
{
  "id": "new-work",
  "order": 3,
  "titles": {
    "greek": "원어 제목",
    "english": "English title",
    "korean": "한국어 제목"
  },
  "book": "I",
  "lines": [
    {
      "number": 1,
      "text": "첫 번째 행",
      "audio": "/audio/voice/new-work/line-001.wav",
      "note": "음성 있음"
    },
    {
      "number": 2,
      "text": "두 번째 행"
    }
  ]
}
```

1. 음성 파일을 `public/audio/voice/<작품 ID>` 아래에 저장합니다.
2. JSON 행의 `audio`에 `/audio/voice/...`로 시작하는 공개 경로를 적습니다.
3. 음성이 아직 없는 행은 `audio`와 `note`를 생략합니다.

음성이 있는 행의 재생이 끝나면 바로 다음 행에 음성이 있을 때만 연속 재생합니다. 중간에 음성이 없는 행을 만나면 자동으로 멈춥니다.

현재 테스트용 도레미파솔라시도 WAV 파일은 다음 명령으로 다시 생성할 수 있습니다.

```bash
node scripts/generate-tone-audio.mjs
```

## 자동 처리

`vite-plugin-markdown-posts.js`가 다음 파일을 빌드 시 자동으로 읽습니다.

- `content/**/*.md` → 글과 분류 데이터
- `content/voice/*.json` → 음성 작품과 행 데이터

콘텐츠 파일이 잘못된 JSON이거나 필수 3개국어 제목·행 텍스트가 없고, ID가 중복되거나 지정한 로컬 음성 파일이 존재하지 않으면 빌드 단계에서 파일명과 행을 포함한 오류를 표시합니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 `npm ci`, `npm run build`를 실행하고 결과를 GitHub Pages에 배포합니다.
