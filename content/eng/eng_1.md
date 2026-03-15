---
id: eng_1
title: 엘렐레우
date: 2026-02-15
topic: eng
---

## 콜백에서 async/await까지

JavaScript의 비동기 처리는 웹 개발의 핵심입니다. 초기에는 콜백 함수를 사용했지만, 콜백 지옥이라는 문제가 발생했습니다.

### Promise의 등장

ES6에서 도입된 Promise는 비동기 작업을 체이닝할 수 있게 해주었습니다. `.then()`과 `.catch()`를 통해 성공과 실패를 깔끔하게 처리할 수 있습니다.

### async/await

ES2017에서 도입된 async/await는 비동기 코드를 동기 코드처럼 작성할 수 있게 해줍니다. 가독성이 크게 향상되며, try-catch로 에러 처리가 가능합니다.

```javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

현대 JavaScript 개발에서는 async/await가 표준적인 비동기 처리 방식이 되었습니다.

관련 글: [수학 두루마리의 첫 글](post://math_1) | [공학 두 번째 글](post://eng_2)
