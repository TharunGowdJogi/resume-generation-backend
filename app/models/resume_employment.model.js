module.exports = (sequelize, Sequelize) => {
    const resume_employment = sequelize.define('resume_employment', {
      resume_employment_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      resume_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      employment_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false
    });
    return resume_employment;
  };
  