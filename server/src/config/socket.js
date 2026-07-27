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

    // Join room if requested (e.g. room:operations, room:shipment:${id}, or legacy room names)
    socket.on('join', (room) => {
      if (room) {
        socket.join(room);
        logger.info({ socketId: socket.id, room }, `[WEBSOCKET] Socket joined room: ${room}`);
      }
    });

    socket.on('join_room', (room) => {
      if (room) {
        socket.join(room);
        logger.info({ socketId: socket.id, room }, `[WEBSOCKET] Socket joined room: ${room}`);
      }
    });

    socket.on('leave_room', (room) => {
      if (room) {
        socket.leave(room);
        logger.info({ socketId: socket.id, room }, `[WEBSOCKET] Socket left room: ${room}`);
      }
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

export { io };

export default {
  initSocket,
  getIO,
  broadcast,
};
