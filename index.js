require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const corsMiddleware = require('./middleware/corsMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

// Routes importieren
const fragenRouter = require('./routes/fragen');

const URI = process.env.DB ?? 'mongodb://localhost:27017/quizfragen';
const port = process.env.PORT ?? 3050;

mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', error => console.log(error));

db.once('open', () => console.log(`mit der Datenbank auf ${URI} verbunden`));

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(corsMiddleware);

// static Ordner
app.use(express.static('public'));

// Routes
app.use('/fragen', fragenRouter);

// Fehler-Middleware
app.use(errorMiddleware);

app.listen(port, () => console.log(`Server läuft. Ich lausche auf Port: ${port}`));