const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the path for views
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route for the root URL
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/chat',(req,res)=>{
  res.render('chat');
})

let waitinguser = [];
let rooms = {};


// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinroom',() => {
    
    if(waitinguser.length>0)
    {
      let partner = waitinguser.shift();
      const roomname = `${socket.id}-${partner.id}`;
      socket.join(roomname);
      partner.join(roomname);

      io.to(roomname).emit("joined",roomname);
    }
    else
    {
      waitinguser.push(socket);
    }
  })

  socket.on('message',(data)=>{
      socket.broadcast.to(data.room).emit("message",data.message);
      
  })
  socket.on('disconnect',()=>{

    let index = waitinguser.findIndex(waitinguser=>waitinguser.id === socket.id);
    
    waitinguser.splice(index,1);

  })

  socket.on("signalingMessage",(data)=>{
      
    socket.broadcast.to(data.room).emit("signalingMessage",data.message);
  })

  socket.on("startvc",({ room })=>{
    
    socket.broadcast.to(room).emit("incomingCall");
  })
  socket.on("acceptCall",({room})=>{
     socket.broadcast.to(room).emit("callAccepted");
  })
  socket.on("rejectCall",({room})=>{
    socket.broadcast.to(room).emit("callRejected");
 })
});



server.listen(port)