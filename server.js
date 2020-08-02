const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')


app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = { }

app.get('/', (req, res) => {
    res.render('index', { rooms: rooms })    
})

app.post('/room', (req, res) => {
    const name=req.body.room
    for (const [key, value] of Object.entries(rooms)) { 
        if(name==undefined || name==value.name){
            return res.redirect('/')
        }
    }
    const id=uuidV4()
    rooms[id] = { name:name,users: {} }
    res.redirect(id)
    // Send message that new room was created
    io.emit('room-created', {id: id ,name: rooms[id].name})
  })

app.get('/:room', (req, res) => {
    if (rooms[req.params.room] == null) {
        return res.redirect('/')
      }
  const id=req.params.room;
  res.render('room', { roomId: id ,roomName: rooms[id].name})
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    rooms[roomId].users[socket.id]=userId
    socket.to(roomId).broadcast.emit('user-connected', userId)
  })
  
  socket.on('send-chat-message', (roomId, message) => {
    socket.to(roomId).broadcast.emit('chat-message', { message: message, name: rooms[roomId].users[socket.id] })
  })

socket.on('disconnect', () => {
    getUserRooms(socket).forEach(roomId => {
        socket.to(roomId).broadcast.emit('user-disconnected', rooms[roomId].users[socket.id])
        delete rooms[roomId].users[socket.id]
      })
})
    
})

function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [userId, roomId]) => {
      if (roomId.users[socket.id] != null) names.push(userId)
      return names
    }, [])
 }

server.listen(3001)