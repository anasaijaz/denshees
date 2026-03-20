import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import { config } from "dotenv";

// Determine the environment (default to development)
const env = process.env.NODE_ENV || "development";

// Load the correct .env file
config({ path: `.env.${env}` });

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
});

const redis = redisConnection;

export { Queue, Worker, redisConnection, redis };
