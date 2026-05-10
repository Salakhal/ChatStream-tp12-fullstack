// Connexion au serveur Socket.IO
const socket = io();

// Éléments du DOM
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const joinForm = document.getElementById('join-form');
const joinContainer = document.getElementById('join-container');
const chatContainer = document.querySelector('.chat-container');
const leaveBtn = document.getElementById('leave-btn');

// Variables pour stocker les informations de l'utilisateur
let username = '';
let room = '';

// Gestion du formulaire de connexion
joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Récupération des valeurs du formulaire
  username = e.target.elements.username.value.trim();
  room = e.target.elements.room.value;
  
  if (!username) return;
  
  // Afficher l'interface de chat et masquer le formulaire de connexion
  joinContainer.style.display = 'none';
  chatContainer.style.display = 'block';
  
  // Émettre l'événement de connexion au salon
  socket.emit('joinRoom', { username, room });
});

// Gestion du bouton de déconnexion
leaveBtn.addEventListener('click', () => {
  // Émettre l'événement de déconnexion
  socket.emit('leaveRoom');
  
  // Revenir à l'écran de connexion
  chatContainer.style.display = 'none';
  joinContainer.style.display = 'block';
  
  // Vider les messages
  chatMessages.innerHTML = '';
});

// Gestion de l'envoi de messages
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Récupérer le message
  const msg = e.target.elements.msg.value.trim();
  
  if (!msg) return;
  
  // Émettre le message au serveur
  socket.emit('chatMessage', msg);
  
  // Vider l'input et lui redonner le focus
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Fonction pour ajouter un message au DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  
  // Ajouter une classe spéciale pour les messages privés ou système
  if (message.isPrivate) {
    div.classList.add('private-message');
  } else if (message.username === 'Système') {
    div.classList.add('system-message');
  }
  
  div.innerHTML = `
    <p class="meta">${message.username} ${message.time}</p>
    <p class="text">${message.text}</p>
  `;
  chatMessages.appendChild(div);
  
  // Scroll automatique vers le bas
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fonction pour mettre à jour le nom du salon
function updateRoomName(room) {
  roomName.innerText = room;
}

// Fonction pour mettre à jour la liste des utilisateurs
function updateUserList(users) {
  userList.innerHTML = users.map(user => `<li>${user.username}</li>`).join('');
}

// Écouteurs d'événements Socket.IO

// Réception d'un message
socket.on('message', (message) => {
  outputMessage(message);
});

// Mise à jour des informations du salon
socket.on('roomUsers', ({ room, users }) => {
  updateRoomName(room);
  updateUserList(users);
});

// Gestion des erreurs de connexion
socket.on('connect_error', (error) => {
  console.error('Erreur de connexion:', error);
  alert('Erreur de connexion au serveur. Veuillez réessayer.');
});