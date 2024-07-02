module.exports = (sequelize, Sequelize) => {
    const Resume = sequelize.define("resume", {
      resume_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ai_generated_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  
    return Resume;
  };
  