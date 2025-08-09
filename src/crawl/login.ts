import puppeteer from 'puppeteer';
import { WorkRecord, LoginResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function fetchWorkRecords(email: string, password: string): Promise<LoginResult> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // 로그인 페이지로 이동
    await page.goto('https://cowave.ncpworkplace.com/v/home/');
    await page.waitForSelector('#user_id');
    await page.type('#user_id', email);
    await page.click('#loginStart');

    // 비밀번호 입력
    await page.waitForSelector('#user_pwd', { visible: true });
    await page.type('#user_pwd', password);
    await page.click('#loginBtn');

    // 로그인 완료 대기
    try {
      await page.waitForNavigation({ timeout: 5000 });
    } catch {
      // 네비게이션 타임아웃 무시
    }

    // 출퇴근 기록 페이지로 이동
    const targetUrl = 'https://cowave.ncpworkplace.com/user/work-statistics';
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // 기간 선택 (1개월)
    await page.waitForSelector('button.form-control.dropdown-toggle', { visible: true });
    await page.click('button.form-control.dropdown-toggle');
    await page.waitForSelector('a.dropdown-item[value="1month"]', { visible: true });
    await page.click('a.dropdown-item[value="1month"]');

    // 검색 버튼 클릭
    await page.waitForSelector('#btn_search', { visible: true });
    await page.click('#btn_search');

    try {
      await page.waitForNavigation({ timeout: 3000 });
    } catch {
      // 네비게이션 타임아웃 무시
    }

    await page.waitForSelector('#bodyConts');

    // 데이터 추출
    const workRecords: WorkRecord[] = await page.$$eval('#bodyConts > tr', rows => {
      return rows.map(row => {
        const tds = row.querySelectorAll('td');

        const extractTime = (el: Element | null): string | null => {
          if (!el) return null;
          const text = el.textContent?.trim().replace(/\(.*\)/g, '') || '';
          return text || null;
        };

        const getText = (index: number): string => tds[index]?.textContent?.trim() || '';

        const totalTimeIdx = tds.length - 1;
        return {
          date: getText(0),
          totalTime: extractTime(tds[totalTimeIdx]) || '00:00',
        };
      });
    });

    logger.success(`로그인 및 데이터 수집 성공: ${workRecords.length}건`);
    return { success: true, records: workRecords };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    logger.error(`로그인 또는 데이터 수집 실패: ${errorMessage}`);
    return { success: false, error: errorMessage };
  } finally {
    await browser.close();
  }
}