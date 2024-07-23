module.exports = (sequelize, Sequelize) => {
    const Employment = sequelize.define("employment", {
      employment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      organization: {
        type: Sequelize.STRING,
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
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
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
      }
    }, {
      hooks: {
        beforeCreate: (employment, options) => {
          if (!employment.to_year) {
            employment.to_year = null;
          }
        },
        beforeUpdate: (employment, options) => {
          if (!employment.to_year) {
            employment.to_year = null;
          }
        }
      }
      });
  
    return Employment;
  };
  