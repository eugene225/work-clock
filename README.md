# Work Clock

Slack 봇을 통해 근무 시간을 조회하고 관리하는 애플리케이션입니다.

## 기능

- Slack 슬래시 명령어를 통한 근무 시간 조회
- 웹 크롤링을 통한 자동 출퇴근 기록 수집
- 월별 근무 시간 계산 및 누락 기록 확인

## 프로젝트 구조

```
src/
├── app.ts                 # 메인 애플리케이션 진입점
├── types/
│   └── index.ts          # 타입 정의
├── crawl/
│   └── login.ts          # 웹 크롤링 및 로그인 처리
├── service/
│   └── calculateWorkTime.ts # 근무 시간 계산 로직
├── slack/
│   └── sendToSlack.ts    # Slack 메시지 전송
└── utils/
    ├── logger.ts         # 로깅 유틸리티
    └── validation.ts     # 검증 유틸리티
```

## 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 환경 변수 설정 (.env 파일)
```
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=your_slack_bot_token
PORT=3000
```

3. 개발 모드 실행
```bash
npm run dev
```

4. 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```

## 사용법

1. Slack에서 `/time_info` 명령어 사용
2. 또는 Slack 앱에서 "근무 시간 조회" 단축키 사용
3. 이메일과 비밀번호 입력
4. 근무 시간 결과 확인

## 기술 스택

- TypeScript
- Node.js
- Slack Bolt Framework
- Puppeteer (웹 크롤링)
- Axios (HTTP 클라이언트)

## 라이선스

ISC