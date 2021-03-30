const mongoose = require('mongoose');
const { Schema } = mongoose;

const frageSchema = new Schema({
  thema: String,
  frage: String,
  // POST funktioniert nicht mit antworten als Array
  antworten: [String],
  indexRichtigeAntwort: Number,
  // evtl. für Später der Schwierigkeitsgrad
  // level: Number,
});

module.exports = mongoose.model('frage', frageSchema, 'fragen');

//um einen Array in Postman abzusetzen benutzt man mehrfach den selben Feldnamen, dann wird's
//ein Array sonst hält er es für einen langen einzelnen String, funktioniert!
//  https://stackoverflow.com/questions/39667294/how-to-post-string-array-using-postman/39667496