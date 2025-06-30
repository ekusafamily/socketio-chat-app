
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chatFile = './chat.json';
let messages = [];

// Load chat history from file if it exists
if (fs.existsSync(chatFile)) {
  try {
    const data = fs.readFileSync(chatFile, 'utf8');
    messages = JSON.parse(data);
  } catch (err) {
    console.error('Failed to read chat history:', err);
  }
}

const users = new Map();         // socket.id => name
const ipToName = new Map();      // ip => name (new from Mark 3)

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  const ip = socket.handshake.address;

  // Send chat history
  socket.emit('chat history', messages.slice(-50));

  // If IP already has a name, auto-set it
  if (ipToName.has(ip)) {
    socket.emit('new user', ipToName.get(ip));
  }

  socket.on('new user', name => {
    users.set(socket.id, name);
    ipToName.set(ip, name); // store IP -> name
    io.emit('user list', Array.from(users.values()));
  });

  socket.on('typing', name => {
    socket.broadcast.emit('typing', name);
  });

  socket.on('chat message', data => {
    const message = {
      ...data,
      ip,
    };

    messages.push(message);
    if (messages.length > 500) messages.shift();

    fs.writeFile(chatFile, JSON.stringify(messages, null, 2), err => {
      if (err) console.error('Error saving chat:', err);
    });

    io.emit('chat message', message);
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('user list', Array.from(users.values()));
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Chat running at http://<your-ip>:${PORT}`);
});


