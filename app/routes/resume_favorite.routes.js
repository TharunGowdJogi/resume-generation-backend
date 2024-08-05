module.exports = app => {
    const favorites = require("../controllers/resume_favorite.controller.js");
    const router = require("express").Router();
  
    // Create a new Favorite
    router.post("/", favorites.create);
  
    // Retrieve all Favorites
    router.get("/", favorites.findAll);
  
    // Retrieve a single Favorite with id
    router.get("/:id", favorites.findOne);
  
    // Update a Favorite with id
    router.put("/:id", favorites.update);
  
    // Delete a Favorite with id
    router.delete("/:id", favorites.delete);
  
    // Delete all Favorites
    router.delete("/", favorites.deleteAll);
  
    // Delete all Favorites for a specific user
    router.delete("/user/:userId", favorites.deleteByUserId);
    
    // Store favorites on logout
    router.post("/storeFavoritesOnLogout", favorites.storeFavoritesOnLogout);

    // Retrieve favorites on login
    router.get("/getFavoritesOnLogin/:userId", favorites.getFavoritesOnLogin);
    
  
    app.use('/resume_favorites', router);
  };
  