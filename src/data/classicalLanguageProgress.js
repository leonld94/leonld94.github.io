export const classicalLanguageStages = [
  {
    level: 0,
    title: '미학습',
    criterion: '문자·기본 문법도 아직 배우지 않음',
  },
  {
    level: 1,
    title: '문법 입문',
    criterion: '기본적인 형태론과 가장 단순한 문장을 배움',
  },
  {
    level: 2,
    title: '기초문법 진행',
    criterion: '주요 굴절·통사론을 상당 부분 배웠으나 문법 과정이 아직 끝나지 않음',
  },
  {
    level: 3,
    title: '기초문법 완료',
    criterion: '표준 입문서의 핵심 문법을 한 번 모두 배움',
  },
  {
    level: 4,
    title: '초급 강독',
    criterion: '사전·문법서·주석을 많이 참고하면서 실제 원전을 읽음',
  },
  {
    level: 5,
    title: '고급 강독',
    criterion: '원전의 문장 구조를 대체로 스스로 분석하며 읽되 사전·주석 의존이 여전히 큼',
  },
  {
    level: 6,
    title: '독립 독해',
    criterion: '일반적인 원전을 주석 없이도 읽을 수 있고, 주된 장애가 어휘·개별 난문 정도임',
  },
  {
    level: 7,
    title: '숙련 독해',
    criterion: '다양한 저자·시대·장르의 원전을 비교적 안정적으로 독립해서 읽음',
  },
];

// level에 0–7을 입력하면 해당 단계까지 막대가 채워집니다. null은 단계 미설정입니다.
// note는 각 고전어 행의 '설명 보기'를 누르면 나타나는 학습 메모에 표시됩니다.
export const classicalLanguageProgress = [
  {
    id: 'ancient-greek',
    name: '희랍어',
    level: 4,
    note: '서울대에서 세 학기 청강, 정암학당에서 강좌 수강, 강독 경험 1회',
  },
  {
    id: 'latin',
    name: '라티움어',
    level: 1,
    note: '2개월 독학',
  },
  {
    id: 'akkadian',
    name: '악카드어',
    level: 3,
    note: '한국고대근동학회에서 중급 과정 수료',
  },
];
