var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var i;

app.use('/', express.static(__dirname + '/public'));

var users = [];

var messages = [];

var typingUsers = [];

io.on('connection', function (socket) {

  var loggedUser;

  for (i = 0; i < users.length; i++) {
    socket.emit('user-login', users[i]);
  }

  for (i = 0; i < messages.length; i++) {
    if (messages[i].username !== undefined) {
      socket.emit('chat-message', messages[i]);
    } else {
      socket.emit('service-message', messages[i]);
    }
  }


  socket.on('disconnect', function () {
    if (loggedUser !== undefined) {
      var serviceMessage = {
        text: 'Notre ami "' + loggedUser.username + '" est parti :-(',
        type: 'logout'
      };
      socket.broadcast.emit('service-message', serviceMessage);
      var userIndex = users.indexOf(loggedUser);
      if (userIndex !== -1) {
        users.splice(userIndex, 1);
      }
      messages.push(serviceMessage);
      io.emit('user-logout', loggedUser);
      var typingUserIndex = typingUsers.indexOf(loggedUser);
      if (typingUserIndex !== -1) {
        typingUsers.splice(typingUserIndex, 1);
      }
    }
  });
  socket.on('user-login', function (user, callback) {
    var userIndex = -1;
    for (i = 0; i < users.length; i++) {
      if (users[i].username === user.username) {
        userIndex = i;
      }
    }
    if (user !== undefined && userIndex === -1) { 
      loggedUser = user;
      users.push(loggedUser);
      var userServiceMessage = {
        text: 'Vous êtes connecté en tant que "' + loggedUser.username + '"',
        type: 'login'
      };
      var broadcastedServiceMessage = {
        text: 'Bienvenue "' + loggedUser.username + '"',
        type: 'login'
      };
      socket.emit('service-message', userServiceMessage);
      socket.broadcast.emit('service-message', broadcastedServiceMessage);
      messages.push(broadcastedServiceMessage);
      io.emit('user-login', loggedUser);
      callback(true);
    } else {
      callback(false);
    }
  });

  socket.on('chat-message', function (message) {
    message.username = loggedUser.username;
    io.emit('chat-message', message);
    messages.push(message);
    if (messages.length > 150) {
      messages.splice(0, 1);
    }
  });

  socket.on('start-typing', function () {
    if (typingUsers.indexOf(loggedUser) === -1) {
      typingUsers.push(loggedUser);
    }
    io.emit('update-typing', typingUsers);
  });

  socket.on('stop-typing', function () {
    var typingUserIndex = typingUsers.indexOf(loggedUser);
    if (typingUserIndex !== -1) {
      typingUsers.splice(typingUserIndex, 1);
    }
    io.emit('update-typing', typingUsers);
  });
});

http.listen(1337, function () {
  console.log('Server is listening on *:1337');
});