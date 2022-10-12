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
        "ImageURL": "https://url3.com",
        "Featured": false
    }
];

//CREATE
// Allow new users to register
app.post('/users', (req, res) => {
    const newUser = req.body;

    if (newUser.username) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send('users need names');
    }
});

// Allow users to add a movie to their list of favorites
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array of favorite movies`);
    } else {
        res.status(400).send('No such user');
    } 
});

// READ
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

// GET data about a genre
app.get('/movies/genre/:genreName', (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('No such genre');
    }
});

// GET data about a director by name
app.get('/movies/directors/:directorName', (req, res) => {
    const { directorName } = req.params;
    const director = movies.find(movie => movie.Director === directorName).Director;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('No such director');
    }
});

// UPDATE
// Allow users to update their user info
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    let user = users.find(user => user.id == id);

    if (user) {
        user.username = updatedUser.username;
        res.status(200).json(user);
    } else {
        res.status(400).send('No such user')
    }
});

// DELETE
// Allow users to remove a movie from their list of favorites
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array of favorite movies`);
    } else {
        res.status(400).send('No such user');
    } 
});

// Allow existing users to deregister 
app.delete('/users/:id/', (req, res) => {
    const { id } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        users =  users.filter(user => user.id != id);
        res.status(200).send(`user ${id} has been deleted`);
    } else {
        res.status(400).send('No such user');
    } 
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
    console.log('Your app is running on http://localhost:8080.');
});