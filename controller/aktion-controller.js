const Aktion = require('../models/aktion-model');
const createError = require('http-errors');

const getAlleAktionen = async (req, res, next) => {
  try {
    const aktionen = await Aktion.find().lean();
    res.status(200).send(aktionen);
  } catch (err) {
    const error = createError(500, 'Fehler beim GET auf /aktionen/ ' + err);
    next(error);
  }
};

const postAktion = async (req, res, next) => {
  try {
    const createdAktion = await Aktion.create(req.body);
    res.status(201).send(createdAktion);
  } catch (err) {
    const error = createError(500, 'Fehler beim POST auf /aktionen/ ' + err);
    next(error);
  }
};

module.exports = {
  getAlleAktionen,
  postAktion
};