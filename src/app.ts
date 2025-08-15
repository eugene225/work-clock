import pkg from '@slack/bolt';
import * as dotenv from 'dotenv';
import { fetchWorkRecords } from './crawl/login.js';
import { calculateMonthlyWorkTime } from './service/calculateWorkTime.js';
import { validateEnvVars, validateEmail, validatePassword } from './utils/validation.js';
import { logger } from './utils/logger.js';

dotenv.config({ path: '../.env' });

// 환경 변수 검증
const requiredEnvVars = validateEnvVars({
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
});

const { App } = pkg;

const app = new App({
  signingSecret: requiredEnvVars.SLACK_SIGNING_SECRET!,
  token: requiredEnvVars.SLACK_BOT_TOKEN!,
});

// 로그인 모달 열기
app.shortcut('time_info', async ({ ack, body, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'login_form',
      title: { type: 'plain_text', text: '근무 기록 로그인' },
      submit: { type: 'plain_text', text: '로그인' },
      blocks: [
        {
          type: 'input', 
          block_id: 'email_input',
          label: { type: 'plain_text', text: '이메일' },
          element: { type: 'plain_text_input', action_id: 'email' }
        },
        {
          type: 'input', 
          block_id: 'password_input',
          label: { type: 'plain_text', text: '비밀번호' },
          element: { type: 'plain_text_input', action_id: 'password' }
        }
      ]
    }
  });
});

// 로그인 폼 처리
app.view('login_form', async ({ ack, view, client, body }) => {
  await ack();
  
  const email = view.state.values.email_input.email.value || '';
  const password = view.state.values.password_input.password.value || '';

  if (!email || !password) {
    await client.chat.postMessage({
      channel: body.user.id,
      text: '❌ 이메일과 비밀번호를 모두 입력해주세요.'
    });
    return;
  }

  if (!validateEmail(email)) {
    await client.chat.postMessage({
      channel: body.user.id,
      text: '❌ 올바른 이메일 형식을 입력해주세요.'
    });
    return;
  }

  if (!validatePassword(password)) {
    await client.chat.postMessage({
      channel: body.user.id,
      text: '❌ 비밀번호를 입력해주세요.'
    });
    return;
  }

  const { success, records, error } = await fetchWorkRecords(email, password);

  await client.chat.postMessage({
    channel: body.user.id,
    text: success
      ? `✅ ${email}님 로그인 성공!`
      : `❌ 로그인 실패! ${error ? `(${error})` : '다시 시도해주세요.'}`
  });

  if (success && records) {
    const result = calculateMonthlyWorkTime(records);
    const differenceText = result.isOverTime 
      ? `+${result.differenceHours}시간 ${result.differenceMinutes}분 초과`
      : `${Math.abs(result.differenceHours)}시간 ${Math.abs(result.differenceMinutes)}분 부족`;
    
    await client.chat.postMessage({
      channel: body.user.id,
      text: `🕒 이번 달 근무 현황:\n• 총 근무 시간: ${result.totalHours}시간 ${result.remainingMinutes}분\n• 필요 근무 시간: ${result.requiredHours}시간 ${result.requiredMinutes}분\n• 차이: ${differenceText}`
    });
  }
});

// 앱 시작
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  logger.success(`Slack bot is running on port ${port}!`);
})();