require('dotenv').config();

const mongoose = require('mongoose');
const http = require('http');
const WebSocketServer = require('websocket').server;

const {
  create,
  join,
  start,
  wuerfeln,
  klickeAntwort,
  macheZug,
  verschieben,
  naechsterZug,
  beenden,
  connect,
} = require('./websocketControllers.js');

const { clients, spiele } = require('./store.js');

const URI = process.env.DB || 'mongodb://localhost:27017/quizfragen';
const port = process.env.PORT || 3050;

mongoose.set('strictQuery', false);
mongoose
  .connect(URI)
  .then(() => console.log('Mit MongoDB verbunden.'))
  .catch((err) => console.log('Verbinden mit MongoDB fehlgeschlagen.', err));

mongoose.connection.on('error', console.log);

// HTTP-Server mit Websocket
const server = http.createServer();
server.listen(port, () =>
  console.log(`Server läuft. Ich lausche auf Port: ${port}`)
);

const websocket = new WebSocketServer({
  httpServer: server,
});

websocket.on('request', (request) => {
  const connection = request.accept(null, request.origin);
  // request; ein Nutzer stellt die Verbindung zum Websocket-Server her
  const clientId = connect(connection);
  connection.on('close', () => {
    console.log(`Websocket Connection from ID ${clientId} Closed!`);
    // dieser client wird aus der clients-Liste entfernt
    delete clients[clientId];
  });
  connection.on('message', (message) => {
    const result = JSON.parse(message.utf8Data);
    console.log(`Nachricht bekommen ${result.method}`);

    // Ein Nutzer möchte ein neues Spiel erstellen
    if (result.method === 'create') {
      create(result);
    }

    // Ein Nutzer möchte ein Spiel beitreten
    if (result.method === 'join') {
      join(result);
    }

    // Ein Nutzer möchte ein Spiel starten
    if (result.method === 'start') {
      start(result);
    }

    // Ein Nutzer möchte würfeln
    if (result.method === 'wuerfeln') {
      wuerfeln(result);
    }

    // Ein Nutzer klickt auf eine Antwort
    if (result.method === 'klickeAntwort') {
      klickeAntwort(result);
    }

    // Ein Nutzer möchte einen Zug machen
    if (result.method === 'macheZug') {
      macheZug(result);
    }

    // Ein Nutzer möchte die Spielfigur verschieben
    if (result.method === 'verschieben') {
      verschieben(result);
    }

    // Nächster Zug soll ausgeführt werden
    if (result.method === 'naechsterZug') {
      naechsterZug(result);
    }

    // Das Spiel soll beendet werden
    if (result.method === 'beenden') {
      beenden(result);
    }
  });
});
