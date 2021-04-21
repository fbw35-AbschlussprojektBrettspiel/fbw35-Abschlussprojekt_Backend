const express = require('express');
const router = express.Router();

const {
  getAlleAktionen,
  postAktion
} = require('../controller/aktion-controller');

router
  .route('/')
    .get(getAlleAktionen)
    .post(postAktion);

module.exports = router;