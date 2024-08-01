const db = require("../models");
const db_resume_comment = db.resume_comment;
const User = db.user;

// Create and Save a new Resume Commment
exports.create = (req, res) => {
  if (!req.body.message || !req.body.resume_id || !req.body.user_id) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  const resume_comment = {
    message: req.body.message,
    resume_id: req.body.resume_id,
    user_id: req.body.user_id,
  };

  db_resume_comment.create(resume_comment)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Resume Commment.",
      });
    });
};

// Retrieve all Resume Commments from the database.
exports.findAll = (req, res) => {
  db_resume_comment.findAll()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving resume comments.",
      });
    });
};

// Find a single Resume Commment with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  db_resume_comment.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Resume Commment with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Resume Commment with id=" + id,
      });
    });
};

exports.getAllCommentsOnResume = (req, res) => {
    const resume_id = req.params.resume_id;
  
    db_resume_comment.findAll({
      where: { resume_id: resume_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['first_name', 'last_name']
      }],
      order: [['id', 'ASC']]
    })
      .then(comments => {
        res.send(comments);
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving comments."
        });
      });
  };

// Update a Resume Commment by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  db_resume_comment.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        db_resume_comment.findByPk(id).then((data) => {
          res.send(data);
        });
      } else {
        res.send({
          message: `Cannot update Resume Commment with id=${id}. Maybe Resume Commment was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Resume Commment with id=" + id,
      });
    });
};

exports.delete = (req, res) => {
  const id = req.params.id;

  db_resume_comment.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Resume Commment was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Resume Commment with id=${id}. Maybe Resume Commment was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Resume Commment with id=" + id,
      });
    });
};

// Delete all Resume Commments from the database.
exports.deleteAll = (req, res) => {
  db_resume_comment.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Resume Commments were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all resume comments.",
      });
    });
};