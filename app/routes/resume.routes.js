module.exports = (app) => {
    const Resume = require("../controllers/resume.controller.js");
    var router = require("express").Router();
  
    // Create a new resume
    router.post("/resume/", Resume.create);
  
    // Retrieve all resumes
    router.get("/resume/", Resume.findAll);

    // Retrieve a Resume by user ID
    router.get("/resume/user/:user_id", Resume.findByUserId);

    // Retrieve a Resume of user by categories
    router.get("/resume/allUserResumesByCategory/user/:user_id", Resume.findAllUserResumesByCategory);
  
    // Retrieve a single resume with id
    router.get("/resume/:id", Resume.findOne);

    // Delete a Resume with id
    router.delete("/resumes/:id", Resume.delete);

    // Update a Resume by id
    router.put("/resume/:id", Resume.update);
  
    // Delete all Resumes
    router.delete("/resumes/", Resume.deleteAll);
  
    app.use("/", router);
  };
  