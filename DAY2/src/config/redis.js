const { createClient } = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-17350.c15.us-east-1-2.ec2.cloud.redislabs.com',
        port: 17350
    }
});

module.exports = redisClient;