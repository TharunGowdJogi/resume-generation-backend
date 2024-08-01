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
db.resume_education = require("./resume_education.model.js")(sequelize, Sequelize);
db.resume_employment = require("./resume_employment.model.js")(sequelize, Sequelize);
db.resume_honor = require("./resume_honor.model.js")(sequelize, Sequelize);
db.resume_project = require("./resume_project.model.js")(sequelize, Sequelize);
db.resume_skill = require("./resume_skill.model.js")(sequelize, Sequelize);
db.resume_comment = require("./resume_comment.model.js")(sequelize, Sequelize);

// foreign key for session
db.user.hasMany(db.session,{ as: "session",foreignKey: "user_id" });
db.session.belongsTo(db.user,{ as: "user",foreignKey: "user_id" });

db.user.hasMany(db.resume, { as: "resumes", foreignKey: "user_id" });
db.resume.belongsTo(db.user, { as: "user", foreignKey: "user_id" });

db.user.hasMany(db.education, { as: "education", foreignKey: "user_id" });
db.education.belongsTo(db.user, { as: "user", foreignKey: "user_id" });

db.user.hasMany(db.employment, { as: "employment", foreignKey: "user_id" });
db.employment.belongsTo(db.user, { as: "user", foreignKey: "user_id" });

db.user.hasMany(db.honor, { as: "honors", foreignKey: "user_id" });
db.honor.belongsTo(db.user, { as: "user", foreignKey: "user_id" });

db.user.hasMany(db.project, { as: "projects", foreignKey: "user_id" });
db.project.belongsTo(db.user, { as: "user", foreignKey: "user_id" });

db.user.hasMany(db.skill, { as: "skills", foreignKey: "user_id" });
db.skill.belongsTo(db.user, { as: "user", foreignKey: "user_id" });

// Junction table relationships
db.resume.belongsToMany(db.education, { through: db.resume_education, foreignKey: "resume_id", otherKey: "education_id", as: "education" });
db.education.belongsToMany(db.resume, { through: db.resume_education, foreignKey: "education_id", otherKey: "resume_id", as: "resumes" });

db.resume.belongsToMany(db.employment, { through: db.resume_employment, foreignKey: "resume_id", otherKey: "employment_id", as: "employment" });
db.employment.belongsToMany(db.resume, { through: db.resume_employment, foreignKey: "employment_id", otherKey: "resume_id", as: "resumes" });

db.resume.belongsToMany(db.honor, { through: db.resume_honor, foreignKey: "resume_id", otherKey: "honor_id", as: "honors" });
db.honor.belongsToMany(db.resume, { through: db.resume_honor, foreignKey: "honor_id", otherKey: "resume_id", as: "resumes" });

db.resume.belongsToMany(db.project, { through: db.resume_project, foreignKey: "resume_id", otherKey: "project_id", as: "projects" });
db.project.belongsToMany(db.resume, { through: db.resume_project, foreignKey: "project_id", otherKey: "resume_id", as: "resumes" });

db.resume.belongsToMany(db.skill, { through: db.resume_skill, foreignKey: "resume_id", otherKey: "skill_id", as: "skills" });
db.skill.belongsToMany(db.resume, { through: db.resume_skill, foreignKey: "skill_id", otherKey: "resume_id", as: "resumes" });

db.resume.hasMany(db.resume_comment,{ as: "comments" , foreignKey: "resume_id" });
db.resume_comment.belongsTo(db.resume,{ as: "resume" , foreignKey: "resume_id" });

db.user.hasMany(db.resume_comment,{ as: "comments" , foreignKey: "user_id" });
db.resume_comment.belongsTo(db.user,{ as: "user" ,foreignKey: "user_id" });

module.exports = db;
