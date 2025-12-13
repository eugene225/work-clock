# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

이 디렉토리는 Workplace 근무시간 계산기 북마크릿(Bookmarklet)을 제공하는 단일 HTML 페이지입니다. 사용자는 이 페이지에서 북마크를 생성하여 Workplace 페이지에서 월별 근무 통계를 즉시 계산할 수 있습니다.

## 핵심 아키텍처

### 단일 파일 구조
- `auto-redirect.html`: 북마크릿 생성 페이지 + 북마크릿 실행 코드를 모두 포함한 자체 완결형 HTML

### 북마크릿 동작 원리

1. **페이지 검증 및 자동 이동** (lines 162-175)
   - Workplace 페이지가 아니면 `sessionStorage`에 플래그 저장 후 자동 이동
   - 북마크릿 제약: 페이지 이동 시 모든 JavaScript 실행 중단되므로 사용자가 2차 클릭 필요

2. **empId 관리** (lines 195-207)
   - `localStorage`에 empId 영구 저장
   - 없으면 prompt로 입력 받음 (자동 추출 불가)
   - empId 찾는 방법: F12 > Network > 검색 버튼 클릭 > `list?` API > Payload 탭

3. **API 호출 및 계산** (lines 210-271)
   - 대상 API: `https://workplace.worksmobile.com/my-space/work-statistics/list`
   - 파라미터: `fromDate`, `toDate`, `empId`, `chkWorkingDay=Y`
   - `dayTpCd === 'WORK'`인 레코드만 근무일로 계산
   - `sumWorkTime` 포맷: `HHMM` (예: `0830` = 8시간 30분)

4. **근무시간 계산 로직** (lines 273-287)
   - 기본 가정: 1일 8시간 근무
   - 총 근무일: `dayTpCd === 'WORK'`인 모든 날짜
   - 과거 근무일: 오늘 포함 이전 날짜만
   - 초과/부족: `실제 근무시간 - (과거 근무일 × 8h)`
   - 앞으로 근무 필요: `(총 근무일 × 8h) - 실제 근무시간`

5. **UI 렌더링** (lines 294-343)
   - 모든 스타일이 인라인으로 작성됨 (북마크릿 제약)
   - empId 재설정 버튼: localStorage 초기화 후 재입력 유도

## 코드 수정 시 주의사항

### 북마크릿 코드 작성 규칙
- **읽기 쉬운 코드 작성** (lines 160-359): 템플릿 리터럴로 가독성 있게 작성
- **자동 인코딩** (line 362): `encodeURIComponent`로 자동 URL 인코딩
- **테스트 기능** (lines 366-370): 페이지에서 직접 클릭 시 `eval`로 실행 가능

### 브라우저 제약사항
- **빈 탭 제한**: `about:blank`, `chrome://newtab` 등에서 실행 불가 (브라우저 보안 정책)
- **페이지 이동 후 중단**: `window.location.href` 실행 시 모든 JavaScript 중단 (2차 클릭 필요)
- **인라인 스타일 필수**: 외부 CSS/JS 참조 불가, 모든 리소스가 북마크릿 코드 내 인라인으로 포함되어야 함

### Storage 사용
- **localStorage**: `work_clock_empId` (영구 저장)
- **sessionStorage**: `work_clock_autorun` (페이지 이동 감지용, 현재 사용하지만 완전 자동 실행은 불가능)

## 배포

정적 HTML 파일이므로 웹 서버에 업로드하면 즉시 사용 가능. 별도의 빌드나 의존성 설치 불필요.
