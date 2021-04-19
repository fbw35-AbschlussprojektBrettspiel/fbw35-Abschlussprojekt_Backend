const mongoose = require('mongoose');
const { Schema } = mongoose;

const aktionSchema = new Schema({
  beschreibung: String,
  positionsAenderung: Number,
});

module.exports = mongoose.model('aktion', aktionSchema, 'aktionen');