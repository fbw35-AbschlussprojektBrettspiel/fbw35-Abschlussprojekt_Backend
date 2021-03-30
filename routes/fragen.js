const express = require('express');
const router = express.Router();

const {
  getAlleFragen,
  postFrage
} = require('../controller/frage-controller');

router
  .route('/')
    .get(getAlleFragen)
    .post(postFrage);

module.exports = router;