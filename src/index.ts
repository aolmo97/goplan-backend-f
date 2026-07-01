import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initSocketServer } from './socket/socket.server';
import { setSocketServer as setMatchesSocket } from './services/matches.service';
import { setSocketServer as setChatsSocket } from './services/chats.service';

const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

setMatchesSocket(io);
setChatsSocket(io);
initSocketServer(io);

httpServer.listen(PORT, () => {
  console.log(`PlanMate API running on http://localhost:${PORT}`);
});
