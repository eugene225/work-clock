(function() {
  'use strict';

  // 현재 페이지가 Workplace 페이지인지 확인
  const targetUrl = 'https://workplace.worksmobile.com/my-space/work-statistics';
  const isWorkplacePage = window.location.href.includes('workplace.worksmobile.com/my-space/work-statistics');

  // Workplace 페이지가 아니면 이동
  if (!isWorkplacePage) {
    const confirmMove = confirm('Workplace 페이지로 이동한 후\n북마크를 다시 클릭해주세요.\n\n이동하시겠습니까?');
    if (confirmMove) {
      // Shift 키 상태 저장
      if (window.event && window.event.shiftKey) {
        sessionStorage.setItem('workClockShiftKey', 'true');
      }
      // 페이지 이동
      window.location.href = targetUrl;
    }
    return;
  }

  // Workplace 페이지에서 자동 실행 확인
  const autoRun = sessionStorage.getItem('workClockAutoRun') === 'true';
  const shiftKeyPressed = sessionStorage.getItem('workClockShiftKey') === 'true';

  // 플래그 제거
  sessionStorage.removeItem('workClockAutoRun');
  sessionStorage.removeItem('workClockShiftKey');

  // 현재 월의 시작일과 종료일 계산
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const fromDate = `${year}${month}01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const toDate = `${year}${month}${String(lastDay).padStart(2, '0')}`;

  // Shift 키를 누르고 실행하면 empId 초기화
  if ((window.event && window.event.shiftKey) || shiftKeyPressed) {
    localStorage.removeItem('work_clock_empId');
    alert('✅ empId가 초기화되었습니다.\n새로운 empId를 입력해주세요.');
  }

  // URL에서 empId 추출 시도
  const urlParams = new URLSearchParams(window.location.search);
  let empId = urlParams.get('empId') || localStorage.getItem('work_clock_empId');

  // empId가 URL이나 localStorage에 없으면 페이지에서 찾기
  if (!empId) {
    // 페이지의 hidden input이나 data attribute에서 찾기 시도
    const empIdInput = document.querySelector('input[name="empId"]');
    if (empIdInput) {
      empId = empIdInput.value;
    }
  }

  // 여전히 없으면 사용자에게 물어보기
  if (!empId) {
    empId = prompt('📝 empId를 입력하세요\n\n💡 팁: Shift 키를 누르고 북마크릿을 클릭하면 empId를 변경할 수 있습니다.');
    if (!empId) {
      alert('❌ empId가 필요합니다.');
      return;
    }
  }

  // localStorage에 저장
  localStorage.setItem('work_clock_empId', empId);

  // API 호출
  const apiUrl = `https://workplace.worksmobile.com/my-space/work-statistics/list?fromDate=${fromDate}&toDate=${toDate}&empId=${empId}&chkWorkingDay=Y&_=${Date.now()}`;

  // 로딩 메시지 표시
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'work-clock-loading';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: sans-serif;
  `;
  loadingDiv.innerHTML = '<div style="text-align: center;">⏳ 근무 기록을 불러오는 중...</div>';
  document.body.appendChild(loadingDiv);

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('API Response:', data); // 디버깅용

      // API 응답 구조 확인
      if (!data.data || !data.data.list) {
        throw new Error('예상치 못한 응답 형식입니다.');
      }

      let records = data.data.list;
      console.log('Sample record:', records.find(r => r.sumWorkTime && r.sumWorkTime !== '0000')); // 근무 데이터가 있는 레코드 확인

      // 오늘 날짜 (시간 제거)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 근무 시간 계산
      let workedMinutes = 0; // 오늘까지 실제 근무한 시간
      let totalWorkDays = 0; // 전체 근무일 수
      let pastWorkDays = 0; // 오늘까지의 근무일 수
      let workedToday = false; // 오늘 근무 여부

      records.forEach(record => {
        // dayTpCd가 'WORK'인 것만 근무일로 카운트
        if (record.dayTpCd !== 'WORK') return;

        totalWorkDays++;

        // checkYmd 파싱 (YYYYMMDD 형식)
        const recordDate = new Date(
          record.checkYmd.substring(0, 4),
          parseInt(record.checkYmd.substring(4, 6)) - 1,
          parseInt(record.checkYmd.substring(6, 8))
        );

        // 오늘 이전이거나 오늘인 경우만 계산
        if (recordDate <= today) {
          pastWorkDays++;

          // sumWorkTime 사용 (HHMM 형식, 예: "1000" = 10시간 00분)
          const workTime = record.sumWorkTime;

          if (workTime && workTime !== '0000') {
            // HHMM 형식 파싱 (예: "1000" → 10시간 0분)
            const hours = parseInt(workTime.substring(0, 2), 10);
            const minutes = parseInt(workTime.substring(2, 4), 10);

            if (!isNaN(hours) && !isNaN(minutes)) {
              workedMinutes += hours * 60 + minutes;

              // 오늘 근무 여부 확인
              if (recordDate.getTime() === today.getTime()) {
                workedToday = true;
              }
            }
          }
        }
      });

      // 계산
      const shouldHaveWorked = pastWorkDays * 8 * 60; // 오늘까지 해야 했던 시간
      const totalRequiredMinutes = totalWorkDays * 8 * 60; // 총 필요 근무 시간
      const shouldWorkMore = totalRequiredMinutes - workedMinutes; // 앞으로 해야 할 시간 = 총 근무일×8 - 오늘까지 근무한 시간
      const differenceMinutes = workedMinutes - shouldHaveWorked; // 초과/부족
      const todayStatus = workedToday ? '오늘 포함' : '오늘 제외'; // 오늘 근무 상태
      const remainingWorkDays = totalWorkDays - pastWorkDays; // 남은 근무일

      // 시간 포맷팅
      const workedHours = Math.floor(workedMinutes / 60);
      const workedMins = workedMinutes % 60;

      const shouldWorkMoreHours = Math.floor(shouldWorkMore / 60);
      const shouldWorkMoreMins = shouldWorkMore % 60;

      const diffHours = Math.floor(Math.abs(differenceMinutes) / 60);
      const diffMins = Math.abs(differenceMinutes) % 60;
      const isOverTime = differenceMinutes > 0;

      const differenceText = isOverTime
        ? `<span style="color: #4CAF50; font-weight: bold;">+${diffHours}시간 ${diffMins}분 초과 ✨</span>`
        : `<span style="color: #f44336; font-weight: bold;">${diffHours}시간 ${diffMins}분 부족 ⚠️</span>`;

      // 결과 표시
      loadingDiv.innerHTML = `
        <div style="min-width: 350px;">
          <h2 style="margin: 0 0 20px 0; color: #333; text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
            🕒 ${year}년 ${month}월 근무 현황
          </h2>
          <div style="line-height: 2; color: #555;">
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
              <div style="font-size: 0.9em; color: #999; margin-bottom: 5px;">📅 총 근무일</div>
              <div style="font-size: 1.2em;"><strong>${totalWorkDays}일</strong> (지난 ${pastWorkDays}일 + 남은 ${remainingWorkDays}일)</div>
            </div>

            <div style="background: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
              <div style="font-size: 0.9em; color: #1976D2; margin-bottom: 5px;">✅ 오늘까지 근무한 시간</div>
              <div style="font-size: 1.3em; color: #1976D2;"><strong>${workedHours}시간 ${workedMins}분</strong></div>
            </div>

            <div style="background: #fff3e0; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
              <div style="font-size: 0.9em; color: #e65100; margin-bottom: 5px;">📋 앞으로 근무해야 하는 시간</div>
              <div style="font-size: 1.3em; color: #e65100;"><strong>${shouldWorkMoreHours}시간 ${shouldWorkMoreMins}분</strong></div>
              <div style="font-size: 0.85em; color: #999; margin-top: 5px;">
                총 ${totalWorkDays}일 × 8h - 근무 ${workedHours}h ${workedMins}m<br>
                💡 ${todayStatus}
              </div>
            </div>

            <div style="background: ${isOverTime ? '#e8f5e9' : '#ffebee'}; padding: 15px; border-radius: 5px; border: 2px solid ${isOverTime ? '#4CAF50' : '#f44336'};">
              <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">⚖️ 현재 초과/부족</div>
              <div style="font-size: 1.4em;">${differenceText}</div>
              <div style="font-size: 0.85em; color: #999; margin-top: 5px;">
                근무 ${workedHours}h ${workedMins}m - 필요 ${Math.floor(shouldHaveWorked / 60)}h ${shouldHaveWorked % 60}m
              </div>
            </div>
          </div>
          <button id="work-clock-close" style="
            margin-top: 20px;
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">닫기</button>
        </div>
      `;

      document.getElementById('work-clock-close').addEventListener('click', () => {
        document.body.removeChild(loadingDiv);
      });

    })
    .catch(error => {
      console.error('Error:', error);
      loadingDiv.innerHTML = `
        <div style="color: red;">
          <h3>❌ 오류 발생</h3>
          <p>${error.message}</p>
          <p style="font-size: 0.9em; color: #666;">
            개발자 콘솔을 확인하세요.
          </p>
          <button onclick="this.parentElement.parentElement.remove()" style="
            margin-top: 10px;
            padding: 10px 20px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">닫기</button>
        </div>
      `;
    });
})();
