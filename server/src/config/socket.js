import { Server } from 'socket.io';
import logger from './logger.js';

let io = null;

export function initSocket(server) {
  logger.info('Initializing Socket.io server...');
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket.io client connected.');

    // Join room if requested (e.g. admin or monitoring group)
    socket.on('join', (room) => {
      socket.join(room);
      logger.debug({ socketId: socket.id, room }, 'Socket joined room.');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket.io client disconnected.');
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
