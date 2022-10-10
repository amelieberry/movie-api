// imports the express module locally
const express = require('express');
// declares a variable that encapsulates Express’s functionality to configure the web server
const app = express();

let movies = [];

// GET requests
app.get('/', (req, res) => {
    res.send('test text');
});

app.get('/movies', (req, res) => {
    res.json(movies);
});

// listen for requests
app.listen((8080, '0.0.0.0'), () => {
    console.log('Your app is listening on port 8080.');
});