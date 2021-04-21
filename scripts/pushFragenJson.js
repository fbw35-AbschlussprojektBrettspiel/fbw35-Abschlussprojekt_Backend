require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const Frage = require('../models/frage-model');
const meineArgs = process.argv.slice(2);
const dateiName = meineArgs[0];

if (!dateiName) {
  throw new Error('Bitte gib den Namen der json-Datei, die im Ordner public liegen soll, als Argument an.');
}

const URI = process.env.DB || 'mongodb://localhost:27017/quizfragen';

mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', error => console.error(error));

db.once('open', async () => {
  console.log('Mit der Datenbank verbunden');

  try {
    const data = await fs.promises.readFile('./public/' + dateiName);
    const fragenArray = JSON.parse(data);
    const values = await Frage.insertMany(fragenArray);
    console.log("erfolgreich auf die Datenbank gepusht.", values);
    db.close();
  } catch (err) {
    console.log(err);
    db.close();
  }
});