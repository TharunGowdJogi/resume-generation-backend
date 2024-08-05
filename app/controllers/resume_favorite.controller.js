const db = require("../models");
const ResumeFavorite = db.resume_favorite;

// Create and Save a new Favorite
exports.create = async (req, res) => {
  try {
    const favorite = await ResumeFavorite.create({
      resume_id: req.body.resume_id,
      user_id: req.body.user_id
    });
    res.send(favorite);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Favorite."
    });
  }
};

// Retrieve all Favorites
exports.findAll = async (req, res) => {
  try {
    const favorites = await ResumeFavorite.findAll();
    res.send(favorites);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving favorites."
    });
  }
};

// Find a single Favorite with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;
  try {
    const favorite = await ResumeFavorite.findByPk(id);
    if (favorite) {
      res.send(favorite);
    } else {
      res.status(404).send({
        message: `Cannot find Favorite with id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error retrieving Favorite with id=" + id
    });
  }
};

// Update a Favorite by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await ResumeFavorite.update(req.body, {
      where: { id: id }
    });
    if (num == 1) {
      res.send({
        message: "Favorite was updated successfully."
      });
    } else {
      res.send({
        message: `Cannot update Favorite with id=${id}. Maybe Favorite was not found or req.body is empty!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Favorite with id=" + id
    });
  }
};

// Delete a Favorite with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await ResumeFavorite.destroy({
      where: { id: id }
    });
    if (num == 1) {
      res.send({
        message: "Favorite was deleted successfully!"
      });
    } else {
      res.send({
        message: `Cannot delete Favorite with id=${id}. Maybe Favorite was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Favorite with id=" + id
    });
  }
};

// Delete all Favorites from the database.
exports.deleteAll = async (req, res) => {
  try {
    const nums = await ResumeFavorite.destroy({
      where: {},
      truncate: false
    });
    res.send({ message: `${nums} Favorites were deleted successfully!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all favorites."
    });
  }
};

// Delete all Favorites for a specific user
exports.deleteByUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const nums = await ResumeFavorite.destroy({
      where: { user_id: userId }
    });
    res.send({ message: `${nums} Favorites were deleted successfully for user ${userId}!` });
  } catch (err) {
    res.status(500).send({
      message: err.message || `Some error occurred while removing favorites for user ${userId}.`
    });
  }
};

// Store favorites when user logs out
exports.storeFavoritesOnLogout = async (req, res) => {
    const { userId, favorites } = req.body;
    try {
      // Delete all previous favorites for the user
      await ResumeFavorite.destroy({
        where: { user_id: userId }
      });
  
      // Insert new favorites
      const favoriteEntries = favorites.map(fav => ({
        resume_id: fav,
        user_id: userId
      }));
      await ResumeFavorite.bulkCreate(favoriteEntries);
  
      res.send({ message: "Favorites stored successfully!" });
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while storing the favorites."
      });
    }
  };
  
  // Retrieve favorites when user logs in
  exports.getFavoritesOnLogin = async (req, res) => {
    const userId = req.params.userId;
    try {
      const favorites = await ResumeFavorite.findAll({
        where: { user_id: userId }
      });
      res.send(favorites.map(fav => fav.resume_id));
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving the favorites."
      });
    }
  };
