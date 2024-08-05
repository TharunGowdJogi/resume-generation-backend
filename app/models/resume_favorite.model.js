module.exports = (sequelize, Sequelize) => {
    const resume_favorite = sequelize.define("resume_favorite", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      }
    });
  
    return resume_favorite;
  };
  