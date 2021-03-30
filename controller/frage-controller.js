const Frage = require('../models/frage-model');
const createError = require('http-errors');

const getAlleFragen = async (req, res, next) => {
  try {
    const fragen = await Frage.find().lean();
    res.status(200).send(fragen);
  } catch (err) {
    const error = createError(500, 'Fehler beim GET auf /fragen/ ' + err);
    next(error);
  }
};

const postFrage = async (req, res, next) => {
  try {
    const createdFrage = await Frage.create(req.body);
    res.status(201).send(createdFrage);
  } catch (err) {
    const error = createError(500, 'Fehler beim POST auf /fragen/ ' + err);
    next(error);
  }
};

module.exports = {
  getAlleFragen,
  postFrage
};