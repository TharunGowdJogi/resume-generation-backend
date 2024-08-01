module.exports = (app) => {
    const resume_comments = require("../controllers/resume_comment.controller.js");
    var router = require("express").Router();

    // Create a new resume_comment
    router.post("/resume_comments/", resume_comments.create);
  
    // Retrieve all resume_comments
    router.get("/resume_comments/", resume_comments.findAll);

    router.get("/resume_comments/resume/:resume_id", resume_comments.getAllCommentsOnResume);

    // Retrieve a single resume_comment with id
    router.get("/resume_comments/:id", resume_comments.findOne);
  
    // Update a resume_comment with id
    router.put("/resume_comments/:id", resume_comments.update);
  
    // Delete a resume_comment with id
    router.delete("/resume_comments/:id", resume_comments.delete);
  
    // Delete all resume_comments
    router.delete("/resume_comments/", resume_comments.deleteAll);
  
    app.use("/", router);
  };
  