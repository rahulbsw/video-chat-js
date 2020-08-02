const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')


const myPeer = new Peer(undefined, {
  host: '/',
  port: '3002'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
    appendMessage(`${userId} connected`)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
  appendMessage(`${userId} disconnected`)

})

socket.on('room-created', room => {
  if(roomContainer!=null && roomContainer!=undefined)
  {
  const roomElement = document.createElement('div')
  roomElement.innerText = room.name
  const roomLink = document.createElement('a')
  roomLink.href = `/${room.id}`
  roomLink.innerText = 'join'
  //roomElement.
  roomContainer.append(roomElement)
  roomContainer.append(roomLink)
}
})

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
  if(messageForm != null) {
    socket.emit('new-user', ROOM_ID, id)
    
    messageForm.addEventListener('submit', e => {
      e.preventDefault()
      const message = messageInput.value
      appendMessage(`You: ${message}`)
      socket.emit('send-chat-message', ROOM_ID, message)
      messageInput.value = ''
    })
  }
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}