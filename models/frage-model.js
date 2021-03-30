const mongoose = require('mongoose');
const { Schema } = mongoose;

const frageSchema = new Schema({
  thema: String,
  frage: String,
  // POST funktioniert nicht mit antworten als Array
  // antworten: [String],
  indexRichtigeAntwort: Number,
  // evtl. für Später der Schwierigkeitsgrad
  // level: Number,
});

module.exports = mongoose.model('frage', frageSchema, 'fragen');