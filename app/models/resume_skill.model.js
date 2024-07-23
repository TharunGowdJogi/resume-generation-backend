module.exports = (sequelize, Sequelize) => {
    const resume_skill = sequelize.define('resume_skill', {
      resume_skill_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      resume_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      skill_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false
    });
    return resume_skill;
  };
  