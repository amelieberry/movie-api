const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path');

const app = express();

// Append Morgan logs to log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined', {stream: accessLogStream}));

let movies = [];

// GET requests
app.get('/', (req, res) => {
    res.send('test text');
});

app.get('/movies', (req, res) => {
    res.json(movies);
});

// Serve the documentation.html file from the public folder
app.use(express.static('public'));

// handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Woops! Something broke.');
});

// listen for requests
app.listen(8080, '0.0.0.0', () => {
    console.log('Your app is listening on port 8080.');
});