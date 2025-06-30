const socket = io();

const form = document.getElementById('chat-form');
const msgBox = document.getElementById('message');
const nameBox = document.getElementById('name');
const messages = document.getElementById('messages');
const typingEl = document.getElementById('typing');
const userList = document.getElementById('users');

let myName = "";

// 👇 New: If server remembers your IP and emits name
socket.on('new user', (name) => {
  nameBox.value = name;
  nameBox.disabled = true;
  myName = name;
});

socket.on('chat history', history => {                                                      messages.innerHTML = '';
  history.forEach(addMessage);                                                            });

socket.on('chat message', data => {
  addMessage(data);
});

socket.on('typing', name => {
  typingEl.innerText = name ? `${name} is typing...` : '';
});

socket.on('user list', names => {
  userList.innerHTML = names.map(n => `<li>${n}</li>`).join('');
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = nameBox.value.trim();
  const message = msgBox.value.trim();

  if (!myName) {
    myName = name;
    socket.emit('new user', name); // Only emit once
  }

  if (name && message) {
    const timestamp = new Date().toLocaleTimeString();
    socket.emit('chat message', { name, message, time: timestamp });
    msgBox.value = '';
    typingEl.innerText = '';
  }
});

msgBox.addEventListener('input', () => {
  socket.emit('typing', nameBox.value.trim());
  setTimeout(() => socket.emit('typing', ''), 2000);
});

function addMessage({ name, message, time }) {
  const div = document.createElement('div');
  const bubbleClass = name === myName ? 'msg sender' : 'msg receiver';
  const initial = name.charAt(0).toUpperCase();
  div.className = bubbleClass;
  div.innerHTML = `
    <div class="profile-icon">${initial}</div>
    <strong>${name}</strong>${message}
    <div class="timestamp">${time || ''}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}


