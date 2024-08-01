module.exports = (sequelize, Sequelize) => {
    const resume_comment = sequelize.define("resume_comment", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      }
    });
  
    return resume_comment;
  };
  