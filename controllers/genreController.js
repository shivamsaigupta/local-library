var Genre = require("../models/genre");
var Book = require("../models/book");
var async = require("async");
const validator = require("express-validator");

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
  Genre.find()
    .sort([["name", "ascending"]])
    .exec(function(err, list_genre) {
      if (err) {
        return next(err);
      }
      res.render("genre_list", { title: "Genre List", genre_list: list_genre });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
  async.parallel(
    {
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        var err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }

      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
  res.render("genre_form", { title: "Create Genre" });
};

// Instead of being a single middleware function the genre_create_post controller specifies
// an array of middleware functions. The array is passed
// to the router function and each method is called in order.

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate that the name field is not empty
  validator
    .body("name", "Genre name required")
    .isLength({ min: 1 })
    .trim(),

  //Sanitize (escape) the name field.
  validator.sanitizeBody("name").escape(),

  // Process request after validation and sanitization.
  function(req, res, next) {
    // Extract the validation errors from a request
    const errors = validator.validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre({
      name: req.body.name
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array()
      });
      return;
    } else {
      // Data from form is valid
      // Check if Genre with same name already exists..
      Genre.findOne({ name: req.body.name }).exec(function(err, found_genre) {
        if (err) {
          return next(err);
        }
        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          genre.save(function(err) {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
  async.parallel(
    {
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        res.redirect("/catalog/genres");
      }
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
  async.parallel(
    {
      genre: function(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genre_books: function(callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        res.redirect("/catalog/genres");
      }
      if (results.genre_books.length > 0) {
        // Same as GET because genre has depended books
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books
        });
      }
      // OK to delete
      Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
        if (err) {
          return next(err);
        }
        res.redirect("/catalog/genres");
      });
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
  Genre.findById(req.params.id).exec(function(err, genre) {
    if (err) {
      return next(err);
    }
    res.render("genre_form", {
      title: "Update Genre",
      genre: genre
    });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate
  validator
    .body("name", "Genre name is required")
    .isLength({ min: 1 })
    .trim(),

  // Sanitize
  validator.sanitizeBody("body").escape(),

  // Process request with validated and sanitized values
  (req, res, next) => {
    let errors = validator.validationResult(req);
    // create new Genre with the sanitized values
    let genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    });
    if (!errors.isEmpty()) {
      // there are errors, re-render the page with the sanitized values
      res.render("genre_form", {
        genre: genre,
        title: "Update Genre"
      });
    }
    // Success - continue to update
    Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre) {
      if (err) {
        return next(err);
      }
      // success
      res.redirect(thegenre.url);
    });
  }
];
