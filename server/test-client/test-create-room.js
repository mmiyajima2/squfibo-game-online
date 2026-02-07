// Socket.IOクライアントで部屋作成をテストするスクリプト
import { io } from 'socket.io-client';

const serverUrl = 'http://localhost:3000';

console.log('Connecting to server:', serverUrl);

const socket = io(serverUrl, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);

  // 部屋作成をテスト
  console.log('\n📝 Creating room...');
  socket.emit('createRoom', { playerName: 'テストプレイヤー' }, (response) => {
    console.log('\n📨 Server response:');
    console.log(JSON.stringify(response, null, 2));

    if (response.code) {
      console.error('\n❌ Error:', response.message);
    } else {
      console.log('\n✅ Room created successfully!');
      console.log('Room ID:', response.roomId);
      console.log('Player ID:', response.playerId);
      console.log('Host URL:', response.hostUrl);
      console.log('Guest URL:', response.guestUrl);
      console.log('Expires At:', new Date(response.expiresAt).toLocaleString('ja-JP'));
    }

    // 切断
    console.log('\n🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  });
});

socket.on('roomCreated', (data) => {
  console.log('\n🎉 roomCreated event received:');
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
