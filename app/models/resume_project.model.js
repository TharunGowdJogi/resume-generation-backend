module.exports = (sequelize, Sequelize) => {
    const resume_project = sequelize.define('resume_project', {
      resume_project_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      resume_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false
    });
    return resume_project;
  };
  