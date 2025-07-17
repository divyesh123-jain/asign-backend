const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "https://align-frontend-cyan.vercel.app"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let currentPoll = null;
let participants = [];
let messages = [];
let pollHistory = [];
let chatMessages = [];
let chatEnabled = true;

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

io.on('connection', (socket) => {
  socket.emit('existingMessages', chatMessages);
  socket.emit('chatPermission', chatEnabled);

  const participantNames = participants.map(p => p.name);
  socket.emit('participants_updated', participantNames);

  socket.on('identify_user', (userType) => {
    socket.userType = userType;
  });

  socket.on('sendChatMessage', (messageData) => {
    if (socket.userType === 'teacher' || chatEnabled) {
      const message = {
        id: uuidv4(),
        message: messageData.message,
        sender: messageData.sender,
        timestamp: messageData.timestamp,
        senderType: socket.userType
      };
      
      chatMessages.push(message);
      io.emit('chatMessage', message);
    }
  });

  socket.on('toggleChatPermission', () => {
    if (socket.userType === 'teacher') {
      chatEnabled = !chatEnabled;
      io.emit('chatPermission', chatEnabled);
    }
  });

  socket.on('join_as_student', (name) => {
    socket.studentName = name;
    socket.userId = uuidv4();
    
    const existingParticipant = participants.find(p => p.name === name);
    if (!existingParticipant) {
      participants.push({
        id: socket.userId,
        name: name,
        socketId: socket.id,
        hasVoted: false,
        kickedOut: false
      });
    } else {
      existingParticipant.socketId = socket.id;
      existingParticipant.kickedOut = false;
      socket.userId = existingParticipant.id;
    }
    
    if (currentPoll) {
      socket.emit('poll_started', currentPoll);
    }
    
    const participantNames = participants.map(p => p.name);
    io.emit('participants_updated', participantNames);
  });

  socket.on('create_poll', (pollData) => {
    currentPoll = {
      id: uuidv4(),
      question: pollData.question,
      options: pollData.options,
      correctAnswers: pollData.correctAnswers,
      duration: pollData.duration,
      startTime: Date.now(),
      endTime: Date.now() + (pollData.duration * 1000)
    };
    
    participants.forEach(p => {
      p.hasVoted = false;
    });
    
    io.emit('poll_started', currentPoll);
    const participantNames = participants.map(p => p.name);
    io.emit('participants_updated', participantNames);
  });

  socket.on('submit_vote', (voteData) => {
    if (!currentPoll) return;
    
    const participant = participants.find(p => p.socketId === socket.id);
    if (!participant || participant.hasVoted) return;
    
    if (currentPoll.options[voteData.optionIndex]) {
      currentPoll.options[voteData.optionIndex].votes++;
    }
    
    participant.hasVoted = true;
    
    io.emit('poll_results', currentPoll);
    const participantNames = participants.map(p => p.name);
    io.emit('participants_updated', participantNames);
  });

  socket.on('end_poll', () => {
    if (currentPoll) {
      pollHistory.push({
        ...currentPoll,
        endedAt: Date.now()
      });
      
      io.emit('poll_ended', currentPoll);
      currentPoll = null;
    }
  });

  socket.on('kick_participant', (participantName) => {
    const participantIndex = participants.findIndex(p => p.name === participantName);
    if (participantIndex !== -1) {
      const participant = participants[participantIndex];
      
      const targetSocket = [...io.sockets.sockets.values()].find(s => s.id === participant.socketId);
      if (targetSocket) {
        targetSocket.emit('kicked_out');
      }
      
      participants.splice(participantIndex, 1);
      
      const participantNames = participants.map(p => p.name);
      io.emit('participants_updated', participantNames);
    }
  });

  socket.on('get_poll_history', () => {
    socket.emit('poll_history', pollHistory);
  });

  socket.on('disconnect', () => {
    const participantIndex = participants.findIndex(p => p.socketId === socket.id);
    if (participantIndex !== -1) {
      participants.splice(participantIndex, 1);
      const participantNames = participants.map(p => p.name);
      io.emit('participants_updated', participantNames);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});