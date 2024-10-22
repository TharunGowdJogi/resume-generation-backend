const db = require("../models");
const User = db.user;
const Session = db.session;
const Op = db.Sequelize.Op;
const { encrypt, getSalt, hashPassword } = require("../authentication/crypto");

// Create and Save a new User
exports.create = async (req, res) => {
  try {
    // Validate request
    const {
      first_name,
      last_name,
      mobile,
      address,
      email,
      linkedin_url,
      website_url,
      password,
      summary,
      is_admin
    } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).send({
        message: "First name, last name, email, and password are required!",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send({ message: "This email is already in use." });
    }

    // Generate salt and hash password
    const salt = await getSalt();
    const hash = await hashPassword(password, salt);

    // Create a User object
    const user = {
      first_name,
      last_name,
      mobile,
      address,
      email,
      linkedin_url,
      website_url,
      password: hash,
      salt,
      summary,
      is_admin
    };

    // Save User in the database
    const newUser = await User.create(user);

    // Create a Session for the new user
    const expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 1);

    const session = {
      email: newUser.email,
      userId: newUser.id,
      expirationDate: expireTime,
    };

    const newSession = await Session.create(session);

    const sessionId = newSession.id;
    const token = await encrypt(sessionId);

    const userInfo = {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      mobile: newUser.mobile,
      address: newUser.address,
      email: newUser.email,
      linkedin_url: newUser.linkedin_url,
      website_url: newUser.website_url,
      summary: newUser.summary,
      token: token,
      is_admin: newUser.is_admin
    };

    res.send(userInfo);
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.message || "Some error occurred while creating the User.",
    });
  }
};

// Retrieve all Users from the database.
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : null;

  User.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};

// Find a single User with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find User with id = ${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error retrieving User with id = " + id,
      });
    });
};

// Find a single User with an email
exports.findByEmail = (req, res) => {
  const email = req.params.email;

  User.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find User with email=${email}.`
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error retrieving User with email=" + email,
      });
    });
};

// Update a User by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  User.update(req.body, {
    where: { user_id: id },
  })
    .then((number) => {
      if (number == 1) {
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update User with id = ${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error updating User with id =" + id,
      });
    });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({
    where: { user_id: id },
  })
    .then((number) => {
      if (number == 1) {
        res.send({
          message: "User was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete User with id = ${id}. Maybe User was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Could not delete User with id = " + id,
      });
    });
};

// Delete all People from the database.
exports.deleteAll = (req, res) => {
  User.destroy({
    where: {},
    truncate: false,
  })
    .then((number) => {
      res.send({ message: `${number} People were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all people.",
      });
    });
};
