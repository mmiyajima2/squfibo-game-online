// Socket.IOイベントの汎用テストスクリプト
import { io } from 'socket.io-client';

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const eventName = process.argv[2];
const payloadJson = process.argv[3];

if (!eventName) {
  console.error('❌ Usage: node test-event-generic.js <eventName> <payloadJson>');
  console.error('\nExamples:');
  console.error('  node test-event-generic.js createRoom \'{"playerName":"ホスト"}\'');
  console.error('  node test-event-generic.js joinRoom \'{"roomId":"xxx","playerName":"ゲスト"}\'');
  process.exit(1);
}

let payload = {};
if (payloadJson) {
  try {
    payload = JSON.parse(payloadJson);
  } catch (error) {
    console.error('❌ Invalid JSON payload:', error.message);
    process.exit(1);
  }
}

console.log('='.repeat(60));
console.log('🎮 SquFibo Generic Event Test');
console.log('='.repeat(60));
console.log('Server URL:', serverUrl);
console.log('Event Name:', eventName);
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('='.repeat(60));

const socket = io(serverUrl, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('\n✅ Connected to server');
  console.log('Socket ID:', socket.id);

  console.log(`\n📤 Emitting event: ${eventName}`);
  socket.emit(eventName, payload, (response) => {
    console.log('\n📨 Callback Response:');
    console.log(JSON.stringify(response, null, 2));

    if (response && response.code) {
      console.error('\n❌ Error Response');
      console.error('Code:', response.code);
      console.error('Message:', response.message);
      if (response.details) {
        console.error('Details:', response.details);
      }
    } else if (response) {
      console.log('\n✅ Success Response');
    }

    // 少し待ってから切断（非同期イベントを受信するため）
    setTimeout(() => {
      console.log('\n🔌 Disconnecting...');
      socket.disconnect();
      process.exit(0);
    }, 1000);
  });
});

// 汎用イベントリスナー（よく使われるイベント）
const commonEvents = [
  'roomCreated',
  'roomJoined',
  'playerJoined',
  'playerLeft',
  'gameStarted',
  'gameStateUpdate',
  'error'
];

commonEvents.forEach(event => {
  socket.on(event, (data) => {
    console.log(`\n🔔 Event Received: ${event}`);
    console.log(JSON.stringify(data, null, 2));
  });
});

socket.on('connect_error', (error) => {
  console.error('\n❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('\n🔌 Disconnected from server');
});

// タイムアウト処理
setTimeout(() => {
  console.error('\n⏰ Timeout - no response from server');
  socket.disconnect();
  process.exit(1);
}, 10000);
