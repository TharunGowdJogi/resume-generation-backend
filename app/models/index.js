const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
  define: {
    timestamps: false
  }
});
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.session = require("./session.model.js")(sequelize, Sequelize);
db.user = require("./user.model.js")(sequelize, Sequelize);
db.resume = require("./resume.model.js")(sequelize, Sequelize);
db.education = require("./education.model.js")(sequelize, Sequelize);
db.employment = require("./employment.model.js")(sequelize, Sequelize);
db.honor = require("./honor.model.js")(sequelize, Sequelize);
db.project = require("./project.model.js")(sequelize, Sequelize);
db.skill = require("./skill.model.js")(sequelize, Sequelize);

// foreign key for session
db.user.hasMany(db.session,{ as: "session",foreignKey: "user_id" });
db.session.belongsTo(db.user,{ as: "user",foreignKey: "user_id" });

db.user.hasMany(db.resume, { as: "resumes", foreignKey: "user_id" });
db.resume.belongsTo(db.user, { as: "user", foreignKey: "user_id" });

db.resume.hasMany(db.education, { as: "educations", foreignKey: "resume_id" });
db.education.belongsTo(db.resume, { as: "resume", foreignKey: "resume_id" });

db.resume.hasMany(db.employment, { as: "employments", foreignKey: "resume_id" });
db.employment.belongsTo(db.resume, { as: "resume", foreignKey: "resume_id" });

db.resume.hasMany(db.honor, { as: "honors", foreignKey: "resume_id" });
db.honor.belongsTo(db.resume, { as: "resume", foreignKey: "resume_id" });

db.resume.hasMany(db.project, { as: "projects", foreignKey: "resume_id" });
db.project.belongsTo(db.resume, { as: "resume", foreignKey: "resume_id" });

db.resume.hasMany(db.skill, { as: "skills", foreignKey: "resume_id" });
db.skill.belongsTo(db.resume, { as: "resume", foreignKey: "resume_id" });

module.exports = db;
