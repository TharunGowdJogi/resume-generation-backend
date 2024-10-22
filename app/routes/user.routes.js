module.exports = (app) => {
  const User = require("../controllers/user.controller.js");
  var router = require("express").Router();

  // Create a new User
  router.post("/users/", User.create);

  // Retrieve all Users
  router.get("/users/", User.findAll);

  // Retrieve a single User with id
  router.get("/users/:id", User.findOne);

  // Update a User with id
  router.put("/users/:id", User.update);

  // Delete a User with id
  router.delete("/users/:id", User.delete);

  // Delete all User
  router.delete("/users/", User.deleteAll);

  app.use("/", router);
};
