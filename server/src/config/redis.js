import logger from './logger.js';

// In-Memory Fallback Client for environments without a running Redis daemon
class MemoryRedisClient {
  constructor(name = 'InMemoryRedis') {
    this.name = name;
    this.store = new Map();
    this.ttls = new Map();
    this.streams = new Map();
    this.listeners = new Map();
    this.status = 'ready';
    logger.info(`Initialized ${this.name} (In-Memory Session & Cache Engine active)`);
  }

  async ping() {
    return 'PONG';
  }

  async info() {
    return '# Server\r\nredis_version:7.0.0\r\nredis_mode:standalone\r\n';
  }

  async set(key, val, mode, ttl) {
    this.store.set(key, String(val));
    if (mode === 'EX' && typeof ttl === 'number') {
      if (this.ttls.has(key)) clearTimeout(this.ttls.get(key));
      const timer = setTimeout(() => {
        this.store.delete(key);
        this.ttls.delete(key);
      }, ttl * 1000);
      
      // Call unref() so long TTL timers (e.g. 7 days) do not block Node's HTTP event loop
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
      this.ttls.set(key, timer);
    }
    return 'OK';
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async del(key) {
    const existed = this.store.has(key);
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async xadd(streamKey, id, ...fieldValues) {
    if (!this.streams.has(streamKey)) {
      this.streams.set(streamKey, []);
    }
    const stream = this.streams.get(streamKey);
    const entryId = `${Date.now()}-0`;
    stream.push({ id: entryId, fields: fieldValues });
    return entryId;
  }

  async xlen(streamKey) {
    const stream = this.streams.get(streamKey);
    return stream ? stream.length : 0;
  }

  async xgroup() {
    return 'OK';
  }

  async xreadgroup() {
    return null;
  }

  async xack() {
    return 1;
  }

  async hset(key, fieldOrObj, value) {
    if (!this.hashStore) this.hashStore = new Map();
    if (!this.hashStore.has(key)) this.hashStore.set(key, new Map());
    const hash = this.hashStore.get(key);
    if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
      for (const [k, v] of Object.entries(fieldOrObj)) {
        hash.set(k, String(v));
      }
    } else if (typeof fieldOrObj === 'string') {
      hash.set(fieldOrObj, String(value));
    }
    return 1;
  }

  async hget(key, field) {
    if (!this.hashStore || !this.hashStore.has(key)) return null;
    return this.hashStore.get(key).get(field) || null;
  }

  async hgetall(key) {
    if (!this.hashStore || !this.hashStore.has(key)) return {};
    const hash = this.hashStore.get(key);
    const result = {};
    for (const [k, v] of hash.entries()) {
      result[k] = v;
    }
    return result;
  }

  async eval() {
    return [];
  }

  async evalsha() {
    return [];
  }

  async moveStalledJobsToWait() {
    return [[], []];
  }

  async quit() {
    return 'OK';
  }

  setMaxListeners() {
    return this;
  }

  getMaxListeners() {
    return 100;
  }

  duplicate() {
    return this;
  }

  on(event, cb) {
    if (event === 'connect' || event === 'ready') {
      const t = setTimeout(() => cb(), 10);
      if (t && typeof t.unref === 'function') t.unref();
    }
    return this;
  }

  once(event, cb) {
    if (event === 'connect' || event === 'ready') {
      const t = setTimeout(() => cb(), 10);
      if (t && typeof t.unref === 'function') t.unref();
    }
    return this;
  }

  off() {
    return this;
  }

  removeListener() {
    return this;
  }
}

export const redisClient = new MemoryRedisClient('Redis-SessionCache');
export const redisQueueConnection = new MemoryRedisClient('Redis-QueueConnection');

export default {
  redisClient,
  redisQueueConnection,
};
