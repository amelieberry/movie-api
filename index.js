const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  uuid = require("uuid");

const { check, validationResult } = require("express-validator");
const app = express();
const mongoose = require("mongoose");
const Models = require("./models.js");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cors = require("cors");

// Allow access only to specific origins
let allowedOrigins = ['http://localhost:8080', 'http://localhost:4200', 'http://localhost:1234', 'https://trackm-client.netlify.app', 'https://main--trackm-client.netlify.app', 'https://amelieberry.github.io'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

const Movies = Models.Movie;
const Users = Models.User;

let auth = require("./auth")(app);

const passport = require("passport");
const { update } = require("lodash");
require("./passport");

//Allow mongoose to connect to database
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "trackmDB"
});

// Append Morgan logs to log.txt
const accessLogStream = fs.createWriteStream(path.join("/tmp/", "log.txt"), {
  flags: "a",
});

//set up the logger
app.use(morgan("combined", { stream: accessLogStream }));

// CREATE

/** 
 * POST new user upon registration if a matching user is not found.
 * Perform checks on Username, Password and Email fields +
 * Hash the user's password
 * @name registerUser
 * @kind function
 * @returns new user object
*/
app.post(
  "/users",
  // validation
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    //check validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(442).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password); // Hash any password entered by the user when registering before storing it in the MongoDB database
    Users.findOne({ Username: req.body.Username })
      // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          // If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + "already exists");
        } else {
          // create the new user if existing not found
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error:" + error);
      });
  }
);

/**
 * POST movie to user's list of favorites
 * Request: Bearer token
 * @name addFavorite
 * @kind function
 * @param {string} Username user's Username
 * @param {string} MovieID id of the movie
 * @requires passport
 * @returns the user object with the new favorite movie added to the FavoriteMovies array
 */
app.post(
  "/users/:Username/:movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }, //makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// READ

/** 
 * send index.html file at endpoint "/"
*/
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

/**
 * GET all Users
 * @requires passport
 */
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);


/**
 * GET a user by Username
 * request: bearer token
 * @name getUser
 * @kind function
 * @param {string} Username user's Username
 * @requires passport
 * @returns the user object
 */
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.status(201).json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * GET a list of all movies
 * request: bearer token
 * @name getMovies
 * @kind function
 * @requires passport
 * @returns the movies array of objects
 */
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * GET data about a single movie by title
 * @name getMovie
 * @kind function
 * @param {string} Title title of the movie
 * @requires passport
 * @returns the movie object
 */
app.get(
  "/movies/:Title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.status(200).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * GET data about a genre, including matching movies, by name
 * @name getGenre
 * @kind function
 * @param {string} Name the name of the genre
 * @requires passport
 * @returns A JSON object holding the name, description and movies of a genre
 */
app.get(
  "/movies/Genre/:Name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { Name } = req.params;
    try {
      const genre = await Movies.findOne(
        { "Genre.Name": Name },
        { Genre: true, _id: false }
      );
      const matchingMovies = await Movies.find({ "Genre.Name": Name });
      res.status(200).send({ genre, matchingMovies });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    }
  }
);

/**
 * GET data about a director, including matching movies, by name
 * @name getDirector
 * @kind function
 * @param {string} Name the name of the director
 * @requires passport
 * @returns A JSON object holding data about the specified director including their movies
 */
app.get(
  "/movies/Director/:Name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { Name } = req.params;
    try {
      const director = await Movies.findOne(
        { "Director.Name": Name },
        { Director: true, _id: false }
      );
      const matchingMovies = await Movies.find({ "Director.Name": Name });
      res.status(200).send({ director, matchingMovies });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    }
  }
);

// UPDATE

/**
 * PUT updated user info, by Username
 * Perform checks on Username, Password and Email fields
 * Hash the user's password
 * Reguest: Bearer token, user object
 * @name updateUser
 * @kind function
 * @param {string} Username user's Username
 * @requires passport
 * @returns A JSON object holding the updated user data, including their ID
 */
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  // validation
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    // check('Password', 'Password is required').not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    //check validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(442).json({ errors: errors.array() });
    }

    // look for matching user and update it
    const updateObject = {
      Username: req.body.Username,
      Email: req.body.Email,
      Birthday: req.body.Birthday,
    };
    if (req.body.Password) {
      let hashedPassword = Users.hashPassword(req.body.Password);
      updateObject.Password = hashedPassword;
    }

    Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $set: updateObject },
      { new: true }, // makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// DELETE

/**
 * DELETE a movie from user's list of favorites
 * requires bearer token
 * @name deleteFavorite
 * @kind function
 * @param {string} Username user's Username
 * @param {string} MovieID movie's ID
 * @requires passport
 * @returns a message to the user stating that the movie has been removed
 */
app.delete(
  "/users/:Username/:movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }, //makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * DELETE user
 * requires bearer token
 * @name deleteUser
 * @kind function
 * @param {string} Username user's Username
 * @requires passport
 * @returns A text message indicating whether the user was successfully deregistered 
 */
app.delete(
  "/users/:Username/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Serve the documentation.html file from the public folder
app.use(express.static("public"));

// handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Woops! Something broke.");
});

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Your app is running on Port" + port);
});

