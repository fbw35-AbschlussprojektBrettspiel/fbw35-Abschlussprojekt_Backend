require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocketServer = require('websocket').server;

const corsMiddleware = require('./middleware/corsMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

// Routes importieren
const fragenRouter = require('./routes/fragen');
const aktionenRouter = require('./routes/aktionen');

const URI = process.env.DB || 'mongodb://localhost:27017/quizfragen';
const port = process.env.PORT || 3050;

mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', error => console.log(error));

db.once('open', () => console.log(`mit der Datenbank verbunden`));

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(corsMiddleware);

// static Ordner
app.use(express.static('public'));

// Routes
app.use('/fragen', fragenRouter);
app.use('/aktionen', aktionenRouter);

// Fehler-Middleware
app.use(errorMiddleware);

// Websocket
const server = http.createServer(app);
const websocket = new WebSocketServer({
  httpServer: server
});

websocket.on('request', request => {
  const connection = request.accept(null, request.origin);
  connection.on('close', () => console.log('Websocket Connection Closed!'));
  connection.on('message', message => {
    console.log(`Nachricht bekommen ${message.utf8Data}`);
  })
});

server.listen(port, () => console.log(`Server läuft. Ich lausche auf Port: ${port}`));