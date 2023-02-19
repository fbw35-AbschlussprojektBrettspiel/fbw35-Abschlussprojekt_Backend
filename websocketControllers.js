const { clients, spiele } = require('./store.js');
const { standardLayout, demoLayout } = require('./spielfeldLayouts.js');
// Mongoose Models
const Frage = require('./models/frage-model');
const Aktion = require('./models/aktion-model');

const create = ({ clientId }, spielId) => {
  // standardLayout für gleichmäßige Verteilung, demoLayout um Aktionen sicher zeigen zu können
  const spielfeldArray = demoLayout;
  spiele[spielId] = {
    id: spielId,
    clients: [],
    spielfeldArray,
    fragen: [],
    aktionen: [],
    werIstDran: 0,
  };
  const mitteilung = `Ein Spiel mit der ID ${spielId} erfolgreich hergestellt. Du kannst jetzt dem Spiel beitreten und die ID an deine Mitspieler weitergeben.`;

  const payload = {
    method: 'create',
    spiel: spiele[spielId],
    mitteilung,
  };

  const con = clients[clientId].connection;
  con.send(JSON.stringify(payload));
};

const join = ({ clientId, spielId, spielerName }) => {
  // Wenn keine spielId angegeben wurde
  if (!spielId) {
    const mitteilung =
      'Keine Spiel-ID vorhanden. Bitte gib eine an, bevor du dem Spiel beitrittst.';

    const payload = {
      method: 'startseiteWarnung',
      mitteilung,
    };

    clients[clientId].connection.send(JSON.stringify(payload));
  } else {
    const spiel = spiele[spielId];

    // Wenn die spielId ungültig ist
    if (!spiel) {
      const mitteilung = `Ungültige Spiel-ID ${spielId}`;

      const payload = {
        method: 'startseiteWarnung',
        mitteilung,
      };

      clients[clientId].connection.send(JSON.stringify(payload));

      // maximale Spieler auf 4 gesetzt; wenn bereits die maximale Anzahl an Spieler dem Spiel beigetreten ist
    } else if (spiel.clients.length >= 4) {
      const mitteilung = `Das Spiel mit der ID ${spielId} hat leider bereits die maximale Teilnehmerzahl von Vier. Du kannst dem nicht mehr beitreten.`;

      const payload = {
        method: 'startseiteWarnung',
        mitteilung,
      };

      clients[clientId].connection.send(JSON.stringify(payload));

      // falls sich ein Spieler mehrmals (mit derselben clientId) einem Spiel beitreten möchte
    } else if (spiel.clients.find((client) => client.clientId === clientId)) {
      const mitteilung = `Du bist bereits dem Spiel mit der ID ${spielId} beigetreten, du kannst dem nicht noch einmal beitreten.`;

      const payload = {
        method: 'startseiteWarnung',
        mitteilung,
      };

      clients[clientId].connection.send(JSON.stringify(payload));
    } else {
      const order = spiel.clients.length;
      const mitteilung = `${
        spielerName ? spielerName : 'Ein neuer Spieler'
      } ist erfolgreich dem Spiel mit der ID ${spielId} beigetreten.`;
      spiel.clients.push({
        clientId,
        order,
        spielerName,
      });

      const payload = {
        method: 'join',
        spiel,
        mitteilung,
      };

      // loope durch alle Spieler und sage ihnen, dass jemand dem Spiel beigetreten ist
      spiel.clients.forEach((client) => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
      });
    }
  }
};

const start = ({ clientId, spielId }) => {
  // Wenn kein spielId vorhanden
  if (!spielId) {
    const mitteilung =
      'Du bist keinem Spiel beigetreten. Bitte trete einem Spiel bei bevor du ein Spiel startest.';

    const payload = {
      method: 'startseiteWarnung',
      mitteilung,
    };

    clients[clientId].connection.send(JSON.stringify(payload));
  } else {
    const spiel = spiele[spielId];

    // Wenn zwar spielId vorhanden, der Client dem Spiel aber (noch) nicht beigetreten ist
    if (!spiel.clients.find((client) => client.clientId === clientId)) {
      const mitteilung = `Du bist dem Spiel mit der ID ${spielId} nicht beigetreten. Bitte trete dem zuerst bei, bevor du das Spiel startest.`;

      const payload = {
        method: 'startseiteWarnung',
        mitteilung,
      };

      clients[clientId].connection.send(JSON.stringify(payload));
    } else {
      const initialPositionen = {};
      spiel.clients.forEach((client) => (initialPositionen[client.order] = 0));

      // Fragen und Aktionen werden beim Start eines Spiels aus DB geholt und im spiel-Objekt gespeichert,
      // aber nicht an clients geschickt
      Frage.find()
        .lean()
        .then((result) => {
          spiel.fragen = result;
          return Aktion.find().lean();
        })
        .then((result) => {
          spiel.aktionen = result;

          const payload = {
            method: 'start',
            spielfeldArray: spiel.spielfeldArray,
            initialPositionen,
          };

          spiel.clients.forEach((client) => {
            clients[client.clientId].connection.send(JSON.stringify(payload));
          });
        })
        .catch((err) => console.log(err));
    }
  }
};

const wuerfeln = ({ spielId }) => {
  const spiel = spiele[spielId];
  const gewuerfelteZahl = Math.floor(Math.random() * 6 + 1);

  const payload = {
    method: 'wuerfeln',
    gewuerfelteZahl,
  };

  spiel.clients.forEach((client) => {
    clients[client.clientId].connection.send(JSON.stringify(payload));
  });
};

const klickeAntwort = ({ spielId, indexAntwort, istKorrekt }) => {
  const spiel = spiele[spielId];

  const antwortFeedback = [indexAntwort, istKorrekt];

  const payload = {
    method: 'klickeAntwort',
    antwortFeedback,
  };

  spiel.clients.forEach((client) => {
    clients[client.clientId].connection.send(JSON.stringify(payload));
  });
};

const macheZug = ({ spielId, neuePosition }) => {
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
      ende: true,
    };
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
        aktion,
      };
    } else {
      const fragen = spiel.fragen;
      const fragenEinesThemas = fragen.filter(
        (element) => element.thema === thema
      );
      const frage =
        fragenEinesThemas[Math.floor(Math.random() * fragenEinesThemas.length)];
      payload = {
        method: 'macheZug',
        neuePosition,
        werIstDran,
        frage,
      };
    }
  }

  spiel.clients.forEach((client) => {
    clients[client.clientId].connection.send(JSON.stringify(payload));
  });
};

const verschieben = ({ spielId, neuePosition }) => {
  const spiel = spiele[spielId];
  const werIstDran = spiel.werIstDran;

  const payload = {
    method: 'verschieben',
    neuePosition,
    werIstDran,
  };

  spiel.clients.forEach((client) => {
    clients[client.clientId].connection.send(JSON.stringify(payload));
  });
};

const naechsterZug = ({ spielId }) => {
  const spiel = spiele[spielId];
  spiel.werIstDran =
    spiel.werIstDran + 1 < spiel.clients.length ? spiel.werIstDran + 1 : 0;

  const payload = {
    method: 'naechsterZug',
    werIstDran: spiel.werIstDran,
  };

  spiel.clients.forEach((client) => {
    clients[client.clientId].connection.send(JSON.stringify(payload));
  });
};

const beenden = ({ spielId }) => {
  const spiel = spiele[spielId];
  // dieses Spiel wird aus der spiele-Liste entfernt
  delete spiele[spielId];

  const payload = {
    method: 'beenden',
  };

  spiel.clients.forEach((client) => {
    clients[client.clientId].connection.send(JSON.stringify(payload));
  });
};

module.exports = {
  create,
  join,
  start,
  wuerfeln,
  klickeAntwort,
  macheZug,
  verschieben,
  naechsterZug,
  beenden,
};
