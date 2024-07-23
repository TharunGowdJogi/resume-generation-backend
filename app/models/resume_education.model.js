module.exports = (sequelize, Sequelize) => {
    const resume_education = sequelize.define('resume_education', {
      resume_education_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      resume_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      education_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false
    });
    return resume_education;
  };
  