// Socket.IOクライアントで部屋参加をテストするスクリプト
import { io } from 'socket.io-client';

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const roomId = process.argv[2];
const playerName = process.argv[3] || 'ゲストプレイヤー';

if (!roomId) {
  console.error('❌ Usage: node test-join-room.js <roomId> [playerName]');
  console.error('   Example: node test-join-room.js "550e8400-e29b-41d4-a716-446655440000" "ゲスト"');
  process.exit(1);
}

console.log('Connecting to server:', serverUrl);
console.log('Room ID:', roomId);
console.log('Player Name:', playerName);

const socket = io(serverUrl, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('\n✅ Connected to server');
  console.log('Socket ID:', socket.id);

  // 部屋参加をテスト
  console.log('\n📝 Joining room...');
  socket.emit('joinRoom', { roomId, playerName }, (response) => {
    console.log('\n📨 Server response:');
    console.log(JSON.stringify(response, null, 2));

    if (response.code) {
      console.error('\n❌ Error:', response.message);
      console.error('Error code:', response.code);
    } else {
      console.log('\n✅ Room joined successfully!');
      console.log('Room ID:', response.roomId);
      console.log('Player ID:', response.playerId);
      console.log('Role:', response.role);
      console.log('Room Info:', JSON.stringify(response.roomInfo, null, 2));
    }

    // 切断
    console.log('\n🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  });
});

socket.on('roomJoined', (data) => {
  console.log('\n🎉 roomJoined event received:');
  console.log(JSON.stringify(data, null, 2));
});

socket.on('playerJoined', (data) => {
  console.log('\n👤 playerJoined event received:');
  console.log(JSON.stringify(data, null, 2));
});

socket.on('error', (error) => {
  console.error('\n❌ Server error event:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
});

// タイムアウト処理
setTimeout(() => {
  console.error('\n⏰ Timeout - no response from server');
  socket.disconnect();
  process.exit(1);
}, 10000);
