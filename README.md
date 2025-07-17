# Polling Application Backend

A real-time polling application backend built with Node.js, Express, and Socket.io.

## Features

- **Real-time Polling**: Create polls and get instant results
- **Student Management**: Join sessions, vote on polls, and participate in chat
- **Teacher Controls**: Create polls, manage participants, kick users, and view poll history
- **Live Chat**: Real-time messaging between teachers and students
- **Poll History**: Track all previous polls and their results

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode
Run the server with auto-restart on file changes:
```bash
npm run dev
```

### Production Mode
Run the server normally:
```bash
npm start
```

The server will start on port 4000 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### HTTP Endpoints
- `GET /health` - Health check endpoint

### Socket.io Events

#### For Teachers
- `identify_user` - Identify as a teacher
- `create_poll` - Create a new poll
- `end_poll` - End the current poll
- `kick_user` - Kick a student from the session
- `send_message` - Send a message to the chat
- `get_participants` - Get list of participants
- `get_poll_history` - Get poll history

#### For Students
- `join_as_student` - Join the session with a name
- `submit_answer` - Submit vote for current poll
- `send_message` - Send a message to the chat

#### Server Events (Emitted to clients)
- `new_poll` - New poll created
- `poll_update` - Poll results updated
- `poll_ended` - Poll ended with final results
- `participants_update` - Participant list updated
- `new_message` - New chat message
- `kicked_out` - Student was kicked out
- `poll_history` - Poll history data

## Data Structure

### Poll Object
```javascript
{
  id: "uuid",
  question: "string",
  options: [
    {
      text: "string",
      votes: number,
      voters: ["string"]
    }
  ],
  createdAt: Date,
  isActive: boolean,
  totalVotes: number,
  endedAt: Date // (optional)
}
```

### Participant Object
```javascript
{
  id: "uuid",
  name: "string",
  socketId: "string",
  hasVoted: boolean,
  kickedOut: boolean
}
```

## CORS Configuration

The server is configured to accept connections from `http://localhost:5173` (Vite dev server default). Update the CORS configuration in `server.js` if your frontend runs on a different port.

## Environment Variables

- `PORT` - Server port (default: 4000) 