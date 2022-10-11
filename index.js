const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path');

const app = express();

// Append Morgan logs to log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined', {stream: accessLogStream}));

let users = [
    {
        id: 1,
        username: "Jane Doe",
        favoriteMovies: []
    },
    {
        id: 2,
        username: "John Doe",
        favoriteMovies: ["Movie One"]
    }
];

let movies = [
    {
        "Title": "Movie One",
        "Description": "That's a description",
        "Genre": {
            "Name": "Comedy",
            "Description": "Comedy is funny stuff"
        },
        "Director": {
            "Name": "Dir Ector",
            "Bio": "About Dir Ector",
            "Birth": 1988
        },
        "ImageURL": "https://url.com",
        "Featured": false
    },
    {
        "Title": "Movie Two",
        "Description": "That's a description",
        "Genre": {
            "Name": "Action",
            "Description": "Action is less talking more acting"
        },
        "Director": {
            "Name": "Direc Tor",
            "Bio": "About Direc Tor",
            "Birth": 1950
        },
        "ImageURL": "https://url2.com",
        "Featured": false
    },
    {
        "Title": "Movie Three",
        "Description": "That's a description",
        "Genre": {
            "Name": "Sci-Fi",
            "Description": "Sci-Fi is a bunch of crazy stuff happening"
        },
        "Director": {
            "Name": "Di Rector",
            "Bio": "About Di Rector",
            "Birth": 1976
        },
        "ImageURL": "https://url2.com",
        "Featured": false
    }
];

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