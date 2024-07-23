module.exports = (sequelize, Sequelize) => {
    const resume_honor = sequelize.define('resume_honor', {
      resume_honor_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      resume_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      honor_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false
    });
    return resume_honor;
  };
  