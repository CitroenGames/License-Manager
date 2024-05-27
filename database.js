const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("database.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the database.");
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        token TEXT,
        expiration TIMESTAMP,
        isAdmin INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS license_keys (
        id INTEGER PRIMARY KEY,
        key TEXT UNIQUE,
        duration INTEGER
    )`);
  }
});

// export db variable using export module
module.exports = db;
