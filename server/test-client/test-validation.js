// バリデーションエラーのテスト
import { io } from 'socket.io-client';

const serverUrl = 'http://localhost:3000';

console.log('Testing validation errors...\n');

const socket = io(serverUrl, {
  transports: ['websocket', 'polling']
});

const tests = [
  {
    name: '空文字のプレイヤー名',
    payload: { playerName: '' },
    expectedError: 'INVALID_PLAYER_NAME'
  },
  {
    name: 'プレイヤー名が長すぎる（21文字）',
    payload: { playerName: 'あ'.repeat(21) },
    expectedError: 'INVALID_PLAYER_NAME'
  },
  {
    name: 'プレイヤー名がnull',
    payload: { playerName: null },
    expectedError: 'INVALID_PLAYER_NAME'
  },
  {
    name: 'プレイヤー名がundefined',
    payload: {},
    expectedError: 'INVALID_PLAYER_NAME'
  }
];

let testIndex = 0;

socket.on('connect', () => {
  console.log('✅ Connected to server\n');
  runNextTest();
});

function runNextTest() {
  if (testIndex >= tests.length) {
    console.log('\n✅ All validation tests passed!');
    socket.disconnect();
    process.exit(0);
    return;
  }

  const test = tests[testIndex];
  console.log(`Test ${testIndex + 1}/${tests.length}: ${test.name}`);
  console.log('Payload:', JSON.stringify(test.payload));

  socket.emit('createRoom', test.payload, (response) => {
    if (response.code === test.expectedError) {
      console.log(`✅ Expected error received: ${response.code} - ${response.message}\n`);
    } else {
      console.error(`❌ Unexpected response:`, response);
      console.error(`   Expected error: ${test.expectedError}\n`);
      socket.disconnect();
      process.exit(1);
    }

    testIndex++;
    runNextTest();
  });
}

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// タイムアウト処理
setTimeout(() => {
  console.error('\n⏰ Timeout - tests did not complete');
  socket.disconnect();
  process.exit(1);
}, 15000);
