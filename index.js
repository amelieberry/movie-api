const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const Movies = Models.Movie;
const Users = Models.User;

//Allow mongoose to connect to database 
mongoose.connect('mongodb://192.168.2.163:27017/trackmDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Append Morgan logs to log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined', {stream: accessLogStream}));

//CREATE
// Allow new users to register
app.post('/users', (req, res) => {
  Users.findOne({Username: req.body.Username})
  .then((user) => {
    if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
    } else {
        Users
        .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        })
        .then((user) => {
            res.status(201).json(user)
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error:' + error)
  }); 
});

// Allow users to add a movie to their list of favorites
app.post('/users/:Username/:movies/:MovieID', (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, {
        $push: {FavoriteMovies: req.params.MovieID}
    },
    {new: true}, //makes sure that the updated document is returned
    (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// READ

// GET requests
app.get('/', (req, res) => {
    res.send('test text');
});

//GET all Users 
app.get('/users', (req, res) => {
    Users.find()
    .then((users) => {
        res.status(201).json(users);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    })
})

// GET a user by Username
app.get('/users/:Username', (req, res) => {
    Users.findOne({Username: req.params.Username})
    .then((user) => {
        res.status(201).json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET a list of all movies
app.get('/movies', (req, res) => {
    Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err)
    })
});

// GET data about a single movie by title
app.get('/movies/:Title', (req, res) => {
    Movies.findOne({Title: req.params.Title})
    .then((movie) => {
        res.status(200).json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET data about a genre
app.get('/movies/Genre/:genreName', (req, res) => {
    Movies.find({'Genre.Name': req.params.genreName})
    .then((movies) => {
        res.status(200).json(movies);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    })
});

// GET data about a director by name
app.get('/movies/Director/:directorName', (req, res) => {
    Movies.find({'Director.Name': req.params.directorName})
    .then((director) => {
        res.status(200).json(director);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    })       
});

// UPDATE
// Update user info, by Username
app.put('/users/:Username', (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, 
        {$set:
            {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
    },
    {new: true}, // makes sure that the updated document is returned
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// DELETE
// Allow users to remove a movie from their list of favorites
app.delete('/users/:Username/:movies/:MovieID', (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, {
        $pull: {FavoriteMovies: req.params.MovieID}
    },
    {new: true}, //makes sure that the updated document is returned
    (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error: " + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// Allow existing users to deregister 
app.delete('/users/:Username/', (req, res) => {
    Users.findOneAndRemove({Username: req.params.Username})
    .then((user) => {
        if (!user) {
            res.status(400).send(req.params.Username + ' was not found');
        } else {
            res.status(200).send(req.params.Username + ' was deleted');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
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