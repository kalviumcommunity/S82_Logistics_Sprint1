import { Server } from 'socket.io';
import logger from './logger.js';

let io = null;

export function initSocket(server) {
  logger.info('Initializing Socket.io server with polling & websocket transport support...');
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id, transport: socket.conn.transport.name }, 'Socket.io client connected successfully.');

    // Join room if requested (e.g. admin or monitoring group)
    socket.on('join', (room) => {
      socket.join(room);
      logger.debug({ socketId: socket.id, room }, 'Socket joined room.');
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Socket.io client disconnected.');
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
}

/**
 * Broadcast event and data to all connected clients or a specific room
 */
export function broadcast(event, data, room = null) {
  if (!io) return;
  try {
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
  } catch (err) {
    logger.error({ err, event }, 'Error broadcasting socket event');
  }
}

export default {
  initSocket,
  getIO,
  broadcast,
};
