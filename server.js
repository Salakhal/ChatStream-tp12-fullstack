const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

// Configuration de l'application Express
const app = express();
const server = http.createServer(app);

// Configuration de Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Système';

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log(`Nouveau client connecté: ${socket.id}`);
  
  // Rejoindre un salon
  socket.on('joinRoom', ({ username, room }) => {
    // Créer l'utilisateur
    const user = userJoin(socket.id, username, room);
    
    // Rejoindre le salon spécifié
    socket.join(user.room);
    
    // Message de bienvenue à l'utilisateur qui se connecte
    socket.emit('message', formatMessage(botName, `Bienvenue dans le salon ${user.room} !`));
    
    // Diffuser à tous les autres utilisateurs du salon qu'un nouvel utilisateur a rejoint
    socket.broadcast
      .to(user.room)
      .emit('message', formatMessage(botName, `${user.username} a rejoint le salon`));
    
    // Envoyer les informations des utilisateurs et du salon
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });
  
  // Écouter les messages du chat
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    
    if (!user) return;
    
    // Vérifier si c'est un message privé (commence par @)
    if (msg.startsWith('@')) {
      // Format: @username message
      const parts = msg.substring(1).split(' ');
      const targetUsername = parts[0];
      const privateMessage = parts.slice(1).join(' ');
      
      // Trouver l'utilisateur cible dans le même salon
      const targetUser = getRoomUsers(user.room).find(
        u => u.username.toLowerCase() === targetUsername.toLowerCase()
      );
      
      if (targetUser) {
        // Envoyer au destinataire
        io.to(targetUser.id).emit(
          'message',
          formatMessage(user.username, `[Privé] ${privateMessage}`, true)
        );
        
        // Confirmer à l'expéditeur
        socket.emit(
          'message',
          formatMessage(user.username, `[Privé à ${targetUser.username}] ${privateMessage}`, true)
        );
      } else {
        // Utilisateur non trouvé
        socket.emit(
          'message',
          formatMessage(botName, `Utilisateur ${targetUsername} non trouvé dans ce salon.`)
        );
      }
    } else {
      // Message normal au salon
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    }
  });
  
  // Quitter le salon
  socket.on('leaveRoom', () => {
    const user = userLeave(socket.id);
    
    if (user) {
      // Informer les autres utilisateurs
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} a quitté le salon`)
      );
      
      // Mettre à jour la liste des utilisateurs
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
  
  // Déconnexion
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    
    if (user) {
      // Informer les autres utilisateurs
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} a quitté le salon`)
      );
      
      // Mettre à jour la liste des utilisateurs
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});