import { Queue, redisConnection } from "../config/redis.js";

const authQueue = new Queue("authQueue", {
  connection: redisConnection,
});

export default authQueue;
