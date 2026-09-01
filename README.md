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

새 작품 골격은 작품 ID 하나로 생성합니다.

```bash
npm run voice:new -- plato-apology
```

명령을 실행하면 다음 구조가 만들어집니다.

```text
content/voice/plato-apology/
  work.json
  units/
    01.json
public/audio/voice/plato-apology/
  1/
```

`work.json`은 작품 제목, 탐색 용어, 출처, 음성 파일명 규칙과 단위 목록만 관리합니다. `권/행`뿐 아니라 `장/문장`, `Stephanus/구절`처럼 작품에 맞는 용어와 문자열 식별자를 사용할 수 있습니다.

```json
{
  "id": "plato-apology",
  "order": 3,
  "titles": {
    "greek": "Πλάτων – Ἀπολογία Σωκράτους",
    "english": "Plato – Apology",
    "korean": "플라톤 – 소크라테스의 변명"
  },
  "navigation": {
    "unit": { "label": "Stephanus", "singular": "SECTION", "plural": "SECTIONS" },
    "passage": { "label": "문장", "singular": "PASSAGE", "plural": "PASSAGES" }
  },
  "source": {
    "url": "https://example.com/source",
    "label": "원문 보기",
    "credit": "원문 제공자와 판본 정보"
  },
  "audio": {
    "basePath": "/audio/voice/plato-apology",
    "pattern": "{unit}/{passage}.wav"
  },
  "units": [
    {
      "id": "17a",
      "label": "17a",
      "order": 1,
      "file": "units/01.json"
    }
  ]
}
```

각 단위 파일은 구절만 담습니다. `id`와 `label`에는 `17a`, `chorus-1` 같은 문자열도 사용할 수 있습니다.

```json
{
  "passages": [
    {
      "id": "1",
      "label": "1",
      "speaker": {
        "greek": "ΣΩΚΡΑΤΗΣ",
        "korean": "소크라테스"
      },
      "greekText": "첫 번째 그리스어 문장",
      "koreanText": "첫 번째 문장의 한국어 번역",
      "paragraphStart": true
    },
    {
      "id": "2",
      "label": "2",
      "greekText": "두 번째 그리스어 문장"
    }
  ]
}
```

- `koreanText`를 생략하면 화면에 `(준비중입니다)`가 표시됩니다.
- 희극·비극의 화자는 `"speaker": "소크라테스"`처럼 간단히 쓰거나, 위 예시처럼 `greek`, `korean`, `english` 이름을 함께 적을 수 있습니다. `speaker`를 생략하거나 `null`로 두면 화자 영역은 표시되지 않습니다.
- `paragraphStart: true`인 구절 앞에는 원문의 단락 여백이 표시됩니다.
- `omitted: true`인 구절은 생략 안내와 취소선 스타일로 표시됩니다.
- 개별 구절에 `audio`를 직접 지정할 수도 있습니다.

### 음성 파일 자동 연결

위 예시의 `audio.pattern`이 `{unit}/{passage}.wav`이므로 `17a`의 `2`번 문장은 다음 파일이 존재할 때 자동으로 연결됩니다.

```text
public/audio/voice/plato-apology/17a/2.wav
```

따라서 JSON에 모든 음성 경로를 반복해서 적을 필요가 없습니다. 자동 경로와 다른 파일만 구절의 `audio`에 공개 경로를 직접 적습니다.

새 작품이나 수정된 작품은 전체 공통 검증 명령으로 확인합니다.

```bash
npm run voice:validate
```

작품 ID, 단위·구절 중복, 필수 원문, JSON 문법, 단위 파일 경로와 로컬 음성 파일 존재 여부를 모두 검사합니다. `npm run build`도 이 검증을 먼저 실행합니다.

일리아스 24권의 Perseus 원문을 다시 가져오려면 다음 명령을 실행합니다. 원문 XML의 행 번호와 단락 시작 표식을 유지하며, 접근할 수 없는 데이터는 결과에서 제외합니다.

```bash
npm run import:iliad
```

오뒷세이아 24권도 동일한 방식으로 다시 가져올 수 있습니다.

```bash
npm run import:odyssey
```

가져온 본문은 `content/voice/<작품 ID>/units`에 단위별로 완전히 저장됩니다. 블로그를 보거나 빌드할 때 Perseus 서버에 본문을 요청하지 않으며, `source.url`은 출처 링크로만 사용됩니다.

음성이 있는 행의 재생이 끝나면 바로 다음 행에 음성이 있을 때만 연속 재생합니다. 중간에 음성이 없는 행을 만나면 자동으로 멈춥니다.

현재 테스트용 도레미파솔라시도 WAV 파일은 다음 명령으로 다시 생성할 수 있습니다.

```bash
node scripts/generate-tone-audio.mjs
```

## 자동 처리

`vite-plugin-markdown-posts.js`가 다음 파일을 빌드 시 자동으로 읽습니다.

- `content/**/*.md` → 글과 분류 데이터
- `content/voice/*/work.json` → 음성 작품 목록과 메타데이터
- `content/voice/*/units/*.json` → 작품을 선택할 때 단위별로 지연 로딩되는 본문

콘텐츠 파일이 잘못된 JSON이거나 필수 3개국어 제목·그리스어 원문이 없고, ID가 중복되거나 지정한 로컬 음성 파일이 존재하지 않으면 빌드 단계에서 해당 파일과 구절을 포함한 오류를 표시합니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 `npm ci`, `npm run build`를 실행하고 결과를 GitHub Pages에 배포합니다.
