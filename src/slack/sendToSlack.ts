import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export async function sendToSlack(message: string) {
  await axios.post(process.env.SLACK_WEBHOOK_URL!, { text: message });
}