const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const fs = require("fs");
const https = require("https");
const dotenv = require("dotenv");
const crypto = require("crypto");
const database = require("./database");
dotenv.config();

const config = require("./config.json");
const adminUsers = require("./admin.json");

const app = express();
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

adminUsers.forEach(async (admin) => {
  const { username, password } = admin;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.get(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err, row) => {
      if (err) {
        console.error("Error retrieving admin user:", err);
      } else {
        if (row) {
          // Check if the password has changed
          const match = await bcrypt.compare(password, row.password);
          if (!match) {
            // Update the password in the database
            db.run(
              "UPDATE users SET password=? WHERE username=?",
              [hashedPassword, username],
              function (err) {
                if (err) {
                  console.error("Error updating admin password:", err);
                } else {
                  console.log("Admin password updated:", username);
                }
              }
            );
          }
        } else {
          // Insert the new admin user
          db.run(
            "INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 1)",
            [username, hashedPassword],
            function (err) {
              if (err) {
                console.error("Error inserting admin user:", err);
              } else {
                console.log("Admin user created:", username);
              }
            }
          );
        }
      }
    }
  );
});

// Helper function to authenticate admin
const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization");
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    db.get("SELECT * FROM users WHERE id=?", [decoded.id], (err, row) => {
      if (err || !row || !row.isAdmin) {
        res.status(403).send({ message: "Forbidden" });
      } else {
        req.user = row;
        next();
      }
    });
  } catch {
    res.status(401).send({ message: "Unauthorized" });
  }
};

// Account creation and login endpoints
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    "INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 0)",
    [username, hashedPassword],
    function (err) {
      if (err) {
        res.status(500).send({ message: "Error creating user" });
      } else {
        res.status(201).send({ message: "User created", userId: this.lastID });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err, row) => {
      if (err || !row) {
        res.status(404).send({ message: "User not found" });
      } else {
        const match = await bcrypt.compare(password, row.password);
        if (match) {
          const token = jwt.sign({ id: row.id }, process.env.SECRET_KEY);
          res.status(200).send({ message: "Logged in", token: token });
        } else {
          res.status(401).send({ message: "Invalid password" });
        }
      }
    }
  );
});

// Admin endpoints
app.post("/admin/generate", authenticateAdmin, (req, res) => {
  const licenseKey = crypto.randomBytes(16).toString("hex");
  const duration = req.body.duration;
  db.run(
    "INSERT INTO license_keys (key, duration) VALUES (?, ?)",
    [licenseKey, duration],
    function (err) {
      if (err) {
        res.status(500).send({ message: "Error generating license key" });
      } else {
        res
          .status(201)
          .send({ message: "License key generated", key: licenseKey });
      }
    }
  );
});

app.get("/admin/users", authenticateAdmin, (req, res) => {
  db.all(
    "SELECT id, username, expiration, isAdmin FROM users",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).send({ message: "Error fetching users" });
      } else {
        res.status(200).send(rows);
      }
    }
  );
});

// User endpoints
app.post("/activate", (req, res) => {
  const { key, token } = req.body;
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    db.get("SELECT * FROM license_keys WHERE key=?", [key], (err, row) => {
      if (err || !row) {
        res.status(404).send({ message: "License key not found" });
      } else {
        // Update the user's expiration time based on the license key duration
        db.run(
          "UPDATE users SET expiration = datetime(COALESCE(expiration, CURRENT_TIMESTAMP), ?) WHERE id = ?",
          [`+${row.duration} days`, decoded.id],
          function (err) {
            if (err) {
              res.status(500).send({ message: "Error activating license key" });
            } else {
              // Delete the used license key from the database
              db.run("DELETE FROM license_keys WHERE key = ?", [key], (err) => {
                if (err) {
                  console.error("Error deleting used license key:", err);
                }
              });
              res.status(200).send({ message: "License key activated" });
            }
          }
        );
      }
    });
  } catch {
    res.status(401).send({ message: "Unauthorized" });
  }
});

app.post("/authenticate", (req, res) => {
  const token = req.body.token;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    db.get("SELECT * FROM users WHERE id=?", [decoded.id], (err, row) => {
      if (err || !row) {
        res.status(404).send({ message: "User not found" });
      } else {
        const currentTime = new Date();
        const expirationTime = new Date(row.expiration);
        if (currentTime < expirationTime) {
          res.status(200).send({ message: "Authenticated", hasTimeLeft: true });
        } else {
          res
            .status(200)
            .send({ message: "Authenticated", hasTimeLeft: false });
        }
      }
    });
  } catch {
    res.status(401).send({ message: "Unauthorized" });
  }
});

const privateKey = fs.readFileSync(config.ssl.key, "utf8");
const certificate = fs.readFileSync(config.ssl.cert, "utf8");
const ca = fs.readFileSync(config.ssl.ca, "utf8");

const credentials = { key: privateKey, cert: certificate, ca: ca };

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(config.port, () => {
  console.log(`Server running on https://localhost:${config.port}`);
});
