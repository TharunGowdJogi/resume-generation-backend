module.exports = (sequelize, Sequelize) => {
    const Skill = sequelize.define("skill", {
      skill_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      resume_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      skill_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  
    return Skill;
  };
  