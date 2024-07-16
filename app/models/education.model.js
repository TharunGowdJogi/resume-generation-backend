module.exports = (sequelize, Sequelize) => {
  const Education = sequelize.define("education", {
    education_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    resume_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    from_year: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    to_year: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    organization: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    course_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    gpa: {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
    },
    state: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    city: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    country: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    details: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  }, {
    hooks: {
      beforeCreate: (education, options) => {
        if (!education.to_year) {
          education.to_year = null;
        }
      },
      beforeUpdate: (education, options) => {
        if (!education.to_year) {
          education.to_year = null;
        }
      }
    }
    });

  return Education;
};
