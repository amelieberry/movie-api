const express = require('express'),
    app = express(),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

app.use(bodyParser.json());

// Append Morgan logs to log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined', {stream: accessLogStream}));

let users = [
    {
        id: 1,
        username: "Jane Doe",
        password: "greatPassword",
        email: "email@mail.com",
        dataOfBirth: "1/1/1995",
        favoriteMovies: []
    },
    {
        id: 2,
        username: "John Doe",
        password: "greatPassword2",
        email: "email2@mail.com",
        dataOfBirth: "2/1/1995",
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
        "Actors": ["Act Or", "Ac Tor"],
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
        "Actors": ["Act Or", "A C Tor"],
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
        "Actors": ["Actor", "Ac Tor"],
        "ImageURL": "https://url2.com",
        "Featured": false
    }
];

// GET requests
app.get('/', (req, res) => {
    res.send('test text');
});

// GET a list of all movies
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

// GET data about a single movie by title
app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.Title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('No such movie');
    }
});

// Get data about a genre
// Serve the documentation.html file from the public folder
app.use(express.static('public'));

// handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Woops! Something broke.');
});

// listen for requests
app.listen(8080, '0.0.0.0', () => {
    console.log('Your app is running on http://localhost:8080.');
});