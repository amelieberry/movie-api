const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const { check, validationResult } = require('express-validator');
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const Movies = Models.Movie;
const Users = Models.User;

const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

//Allow mongoose to connect to database 
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Append Morgan logs to log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined', {stream: accessLogStream}));

//CREATE
// Allow new users to register
app.post('/users', 
// validation
[
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
    //check validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(442).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password); // Hash any password entered by the user when registering before storing it in the MongoDB database 
    Users.findOne({Username: req.body.Username})
    // Search to see if a user with the requested username already exists
    .then((user) => {
        if (user) {
            // If the user is found, send a response that it already exists
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
            // create the new user if existing not found
            Users
            .create({
                Username: req.body.Username,
                Password: hashedPassword,
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
app.post('/users/:Username/:movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
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
    res.send('Welcome to Track\'M');
});

//GET all Users 
app.get('/users', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.get('/users/:Username', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.get('/movies', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.get('/movies/:Title', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({Title: req.params.Title})
    .then((movie) => {
        res.status(200).json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET data about a genre, including matching movies, by name
app.get('/movies/Genre/:Name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const { Name } = req.params
    try {
        const genre = await Movies.findOne({'Genre.Name': Name}, {'Genre': true, '_id': false})
        const matchingMovies = await Movies.find({'Genre.Name': Name})
        res.status(200).send({genre, matchingMovies});
    }    
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// GET data about a director, including matching movies, by name
app.get('/movies/Director/:Name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const { Name } = req.params
    try {
        const director = await Movies.findOne({'Director.Name': Name}, {'Director': true, '_id': false})
        const matchingMovies = await Movies.find({'Director.Name': Name})
        res.status(200).send({director, matchingMovies});
    } 
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }     
});

// UPDATE
// Update user info, by Username
app.put('/users/:Username', passport.authenticate('jwt', {session: false}), 
// validation
[
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => {
    //check validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(442).json({ errors: errors.array() });
    }

    // look for matching user and update it
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({Username: req.params.Username}, 
        {$set:
            {
                Username: req.body.Username,
                Password: hashedPassword,
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
app.delete('/users/:Username/:movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.delete('/users/:Username/', passport.authenticate('jwt', {session: false}), (req, res) => {
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
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Your app is running on Port' + port);
});