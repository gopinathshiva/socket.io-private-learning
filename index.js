var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var connectedUsers = 0;
var disconnectedUsers = 0;
var sockets = {};
var users = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(process.env.PORT || 3000, function(){
  console.log('listening');
});

io.on('connection',function(socket){

    connectedUsers++;
    io.emit('user connected',connectedUsers);
    socket.on('disconnect',function(){
        connectedUsers--;
        io.emit('user connected',connectedUsers);
        if(sockets[socket.id]){
            io.sockets.in(sockets[socket.id].to).emit('receiver disconnected');
            var from = sockets[socket.id].from;
            users.splice(users.indexOf(from),1);
            delete(sockets[socket.id]);
        }
    });

    socket.on('user typing',function(data){
        io.sockets.in(data.to).emit('user typing',data.message);
    });

    socket.on('private message',function(data){
        io.sockets.in(data.to).emit('private message', data.message);
    });

    socket.on('join',function(data){
        if(!sockets[socket.id]){
            sockets[socket.id] = data;
        }

        if(users.indexOf(data.from)<0){
            users.push(data.from);
        }

        socket.join(data.from);
        if(users.length && users.indexOf(data.to)>=0){
            io.sockets.in(data.from).emit('receiver connected');
        }
        io.sockets.in(data.to).emit('receiver connected');
    });
});
