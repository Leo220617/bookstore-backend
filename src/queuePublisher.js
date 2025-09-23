import 'dotenv/config';
import amqplib from 'amqplib';

let connection;
let channel;

// Ensure single channel across calls
async function getChannel() {
  if (channel) return channel;
  const url = process.env.AMQP_URL;
  if (!url) throw new Error('AMQP_URL not set');
  connection = await amqplib.connect(url);
  channel = await connection.createChannel();
  return channel;
}

export async function publishMessage(queueName, message) {
  const ch = await getChannel();
  await ch.assertQueue(queueName, { durable: true });
  const payload = Buffer.from(JSON.stringify(message));
  const ok = ch.sendToQueue(queueName, payload, { persistent: true, contentType: 'application/json' });
  if (!ok) throw new Error('sendToQueue returned false');
}
