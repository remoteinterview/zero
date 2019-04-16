const path = require("path");
const SESSION_TTL = parseInt(process.env.SESSION_TTL);

module.exports = session => {
  // check if redis creds are provided.
  if (process.env.SESSION_REDIS_HOST || process.env.SESSION_REDIS_URL) {
    const RedisStore = require("connect-redis")(session);
    if (process.env.SESSION_REDIS_URL) {
      return new RedisStore({
        ttl: SESSION_TTL,
        url: process.env.SESSION_REDIS_URL
      });
    } else {
      return new RedisStore({
        ttl: SESSION_TTL,
        host: process.env.SESSION_REDIS_HOST,
        port: process.env.SESSION_REDIS_PORT || 6379,
        pass: process.env.SESSION_REDIS_PASSWORD || false,
        prefix: process.env.SESSION_REDIS_PREFIX || "sess:"
      });
    }
  }
  // check if mongodb creds are provided.
  else if (process.env.SESSION_MONGODB_URL) {
    const MongoStore = require("connect-mongo")(session);
    return new MongoStore({
      ttl: SESSION_TTL,
      url: process.env.SESSION_MONGODB_URL
    });
  }
  // check if AWS+Dynamodb creds are provided
  else if (process.env.SESSION_DYNAMODB_TABLE) {
    const DynamoDBStore = require("connect-dynamodb")({ session: session });
    var config = {
      table: process.env.SESSION_DYNAMODB_TABLE,
      AWSConfigJSON: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ID,
        secretAccessKey:
          process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
        region: process.env.AWS_REGION || "us-east-1"
      }
    };

    return new DynamoDBStore(config);
  }
  // fallback to filestore, best for local dev.
  else {
    const FileStore = require("session-file-store")(session);
    return new FileStore({
      path: path.join(require("os").tmpdir(), "zero-sessions"),
      ttl: SESSION_TTL
    });
  }
};
