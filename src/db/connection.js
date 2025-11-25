const mongoose = require('mongoose');

let connection = null;

async function connect(uri, options = {}) {
  if (connection) return connection;
  if (!uri) throw new Error('MONGO_URI environment variable is required to connect to MongoDB');
  const defaultOptions = { useNewUrlParser: true, useUnifiedTopology: true };
  connection = await mongoose.connect(uri, Object.assign(defaultOptions, options));
  return connection;
}

function getMongoose() {
  return mongoose;
}

module.exports = { connect, getMongoose };
