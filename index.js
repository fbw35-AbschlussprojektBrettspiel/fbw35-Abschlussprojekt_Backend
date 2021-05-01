require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocketServer = require('websocket').server;

const corsMiddleware = require('./middleware/corsMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const Frage = require('./models/frage-model');
const Aktion = require('./models/aktion-model');

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
  connection.on('close', () => {
    console.log(`Websocket Connection from ID ${clientId} Closed!`);
    // dieser client wird aus der clients-Liste entfernt
    delete clients[clientId];
  });
  connection.on('message', message => {
    const result = JSON.parse(message.utf8Data);
    console.log(`Nachricht bekommen ${result.method}`);

    // Ein Nutzer möchte ein neues Spiel erstellen
    if (result.method === 'create') {
      const clientId = result.clientId;
      const spielId = getUniqueID();
      // Spielfeld-Array. Die Elemente repräsentieren die Feldtypen
      const spielfeldArray = Array(60).fill(null).map((element, index) => index % 4 === 0 ? 'html' :
        index % 4 === 1 ? 'css' :
          index % 4 === 2 ? 'javascript' :
            'aktion');
      spiele[spielId] = {
        id: spielId,
        clients: [],
        spielfeldArray,
        fragen: [],
        aktionen: [],
        werIstDran: 0
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
      const spielerName = result.spielerName;
      const spiel = spiele[spielId];
      // maximale Spieler auf 4 gesetzt
      if (spiel.clients.length >= 4) {
        return; // später soll Antworten usw. geschrieben werden
      }
      const order = spiel.clients.length;
      spiel.clients.push({
        clientId,
        order,
        spielerName
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
      const initialPositionen = {};
      spiel.clients.forEach(client => initialPositionen[client.order] = 0);
      // evtl. hier eine Prüfung hinzufügen, ob der Nutzer dem Spiel beigetreten ist

      // Fragen und Aktionen werden beim Start eines Spiels aus DB geholt und im spiel-Objekt gespeichert,
      // aber nicht an clients geschickt
      Frage.find().lean()
        .then(result => {
          spiel.fragen = result;
          return Aktion.find().lean();
        })
        .then(result => {
          spiel.aktionen = result;

          const payload = {
            method: 'start',
            spielfeldArray: spiel.spielfeldArray,
            initialPositionen
          };

          spiel.clients.forEach(client => {
            clients[client.clientId].connection.send(JSON.stringify(payload));
          });
        })
        .catch(err => console.log(err));
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
      let neuePosition = result.neuePosition;
      const spiel = spiele[spielId];
      const werIstDran = spiel.werIstDran;
      const spielfeldArray = spiel.spielfeldArray;

      let payload = {};
      if (neuePosition >= spielfeldArray.length) {
        neuePosition = neuePosition % spielfeldArray.length;
        payload = {
          method: 'macheZug',
          neuePosition,
          werIstDran,
          ende: true
        }
      } else {
        // Thema anhand der Spielfigurposition ermitteln
        const thema = spielfeldArray[neuePosition];

        if (thema === 'aktion') {
          const aktionen = spiel.aktionen;
          const aktion = aktionen[Math.floor(Math.random() * aktionen.length)];
          payload = {
            method: 'macheZug',
            neuePosition,
            werIstDran,
            aktion
          };
        } else {
          const fragen = spiel.fragen;
          const fragenEinesThemas = fragen.filter(element => element.thema === thema);
          const frage = fragenEinesThemas[Math.floor(Math.random() * fragenEinesThemas.length)];
          payload = {
            method: 'macheZug',
            neuePosition,
            werIstDran,
            frage
          };
        }
      }

      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    };

    // Ein Nutzer möchte die Spielfigur verschieben
    if (result.method === 'verschieben') {
      const cliendId = result.clientId;
      const spielId = result.spielId;
      const neuePosition = result.neuePosition;
      const spiel = spiele[spielId];
      const werIstDran = spiel.werIstDran;

      const payload = {
        method: 'verschieben',
        neuePosition,
        werIstDran
      };

      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    }

    // Nächster Zug soll ausgeführt werden
    if (result.method === 'naechsterZug') {
      const clientId = result.clientId;
      const spielId = result.spielId;
      const spiel = spiele[spielId];
      spiel.werIstDran = spiel.werIstDran + 1 < spiel.clients.length ? spiel.werIstDran + 1 : 0;

      const payload = {
        method: 'naechsterZug',
        werIstDran: spiel.werIstDran
      };

      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    }

    // Das Spiel soll beendet werden
    if (result.method === 'beenden') {
      const clientId = result.clientId;
      const spielId = result.spielId;
      const spiel = spiele[spielId];
      // dieses Spiel wird aus der spiele-Liste entfernt
      delete spiele[spielId];

      const payload = {
        method: 'beenden'
      };

      spiel.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    }

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