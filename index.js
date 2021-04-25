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

// hashmaps
const clients = {};
const spiele = {};

const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

websocket.on('request', request => {
  const connection = request.accept(null, request.origin);
  connection.on('close', () => console.log('Websocket Connection Closed!'));
  connection.on('message', message => {
    const result = JSON.parse(message.utf8Data);
    console.log(`Nachricht bekommen ${result}`);

    // Ein Nutzer möchte ein neues Spiel erstellen
    if (result.method === 'create') {
      const clientId = result.clientId;
      const spielId = getUniqueID();
      spiele[spielId] = {
        id: spielId,
        clients: []
      };

      const payload = {
        method: 'create',
        spiel: spiele[spielId]
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payload));
    }

    // Ein Nutzer möchte ein Spiel beitreten
    if (result.method === 'join') {
      const clientId = result.clientId;
      const spielId = result.spielId;
      const spiel = spiele[spielId];
      // maximale Spieler erst mal auf 2 gesetzt
      if (spiel.clients.length >= 2) {
        return; // später soll Antworten usw. geschrieben werden
      }
      const order = spiel.clients.length;
      spiel.clients.push({
        clientId,
        order
      });

      const payload = {
        method: 'join',
        spiel
      };

      // loope durch alle Spieler und sage ihnen, dass jemand dem Spiel beigetreten ist
      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      })
    }

    // Ein Nutzer möchte ein Spiel starten
    if (result.method === 'start') {
      const clientId = result.clientId;
      const spielId = result.spielId;
      const spiel = spiele[spielId];
      // evtl. hier eine Prüfung hinzufügen, ob der Nutzer dem Spiel beigetreten ist
      
      const payload = {
        method: 'start'
      };

      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    }

    // Ein Nutzer möchte würfeln
    if (result.method === 'wuerfeln') {
      const clientId = result.clientId;
      const spielId = result.spielId;
      const spiel = spiele[spielId];
      const gewuerfelteZahl = Math.floor((Math.random() * 6) + 1);

      const payload = {
        method: 'wuerfeln',
        gewuerfelteZahl
      };

      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    }

    // Ein Nutzer möchte einen Zug machen
    if (result.method === 'macheZug') {
      const clientId = result.clientId;
      const spielId = result.spielId;
      const spiel = spiele[spielId];
      const neuePosition = result.neuePosition;

      const payload = {
        method: 'macheZug',
        neuePosition
      };

      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    };

  });




  // generiert eine neue clientId
  const clientId = getUniqueID();

  clients[clientId] = {
    connection
  };

  console.log(Object.keys(clients));

  //send back the client connect
  const payload = {
    method: 'connect',
    clientId
  };

  connection.send(JSON.stringify(payload));

});

server.listen(port, () => console.log(`Server läuft. Ich lausche auf Port: ${port}`));