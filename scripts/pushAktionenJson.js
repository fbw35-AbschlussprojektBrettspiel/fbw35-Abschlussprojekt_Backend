require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const Aktion = require('../models/aktion-model');
const meineArgs = process.argv.slice(2);
const dateiName = meineArgs[0];

if (!dateiName) {
  throw new Error(
    'Bitte gib den Namen der json-Datei, die im Ordner public liegen soll, als Argument an.'
  );
}

const URI = process.env.DB || 'mongodb://localhost:27017/quizfragen';

mongoose.set('strictQuery', false);
mongoose
  .connect(URI)
  .then(() => console.log('Mit MongoDB verbunden.'))
  .catch((err) => console.log('Verbinden mit MongoDB fehlgeschlagen.', err));

mongoose.connection.on('error', console.log);

pushAktionen();

async function pushAktionen() {
  try {
    const data = await fs.promises.readFile('./public/' + dateiName);
    const aktionenArray = JSON.parse(data);
    const values = await Aktion.insertMany(aktionenArray);
    console.log('erfolgreich auf die Datenbank gepusht.', values);
  } catch (err) {
    console.log(err);
  } finally {
    mongoose.disconnect();
  }
}
