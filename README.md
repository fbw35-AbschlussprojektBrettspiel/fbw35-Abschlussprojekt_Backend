# fbw35-Abschlussprojekt_Backend

## loslegen!

npm install

## .env

.env im Rootverzeichnis anlegen

```
PORT=3050
DB=mongodb+srv://huang:d7A3eF@clusteryay.0lxey.mongodb.net/quizfragen?retryWrites=true&w=majority
```

DB ist der Atlas Cloud Datenbank auf Anton's Konto.

### `npm start`

startet den Server aufn Port 3050.
[http://localhost:3050/fragen](http://localhost:3050/fragen) ist die GET-Anfragen für alle Quizfragen.

### `npm run watch`

startet den Server mit nodemon