const db = require("../models");
const Resume = db.resume;
const Skill = db.skill;
const Employment = db.employment;
const Education = db.education;
const Honor = db.honor;
const Project = db.project;
const { sequelize } = db;


const updateOrCreateItems = async (resume_id, dataItems, model, transaction) => {
    await model.destroy({ where: { resume_id: resume_id }, transaction });
    await Promise.all(dataItems.map(data => {
      data.resume_id = resume_id;
      const { skill_id ,employment_id, project_id, education_id, honor_id, ...new_data } = data;
      new_data.resume_id = resume_id;
      return model.create(new_data, { transaction });
    }));
  };
  

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { user_info,user_id, skills, employment, education, honors, projects } = req.body;

    const resume = await Resume.create({ user_id,
      email: user_info.email,
      first_name: user_info.first_name,
      last_name: user_info.last_name,
      phone_number: user_info.phone_number,
      address: user_info.address,
      linkedin_url: user_info.linkedin_url,
      portfolio: user_info.portfolio,
      professional_summary: user_info.professional_summary,
      mobile: user_info.mobile,
      ai_generated_url: "<filePath>"
    }, { transaction});

    await updateOrCreateItems(resume.resume_id, skills, Skill, transaction);
    await updateOrCreateItems(resume.resume_id, employment, Employment, transaction);
    await updateOrCreateItems(resume.resume_id, education, Education, transaction);
    await updateOrCreateItems(resume.resume_id, honors, Honor, transaction);
    await updateOrCreateItems(resume.resume_id, projects, Project, transaction);

    await transaction.commit();
    res.send({
        message:  "Resume Generated Successfully!",
        resume_id: resume.resume_id,
        ai_generated_url: resume.ai_generated_url
      });
  } catch (error) {
    console.log("error",error);
    await transaction.rollback();
    res.status(500).send({
      message: error.message || "Some error occurred while generating the Resume."
    });
  }
};

exports.findAll = async (req, res) => {  
    Resume.findAll({
        include: [
          { model: Skill, as: 'skills'},
          { model: Employment, as: 'employment' },
          { model: Education, as: 'education' },
          { model: Honor, as: 'honors' },
          { model: Project, as: 'projects' }
        ]
      }).then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Some error occurred while retrieving resumes.",
        });
      });
  };

exports.findByUserId = async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const resume = await Resume.findAll({
        where: { user_id: user_id },
        include: [
          { model: Skill, as: 'skills'},
          { model: Employment, as: 'employment' },
          { model: Education, as: 'education' },
          { model: Honor, as: 'honors' },
          { model: Project, as: 'projects' }
        ]
    });

    if (!resume) {
      return res.status(404).send({ message: "Resume not found" });
    }

    res.send(resume);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving the Resume."
    });
  }
};

exports.findAllUserResumesByCategory = async (req, res) => {
  try {
    const user_id = req.params.user_id; // Assuming user ID is available in the request object

    // Retrieve all resumes of the user
    const resumes = await Resume.findAll({
      where: { user_id: user_id },
      include: [
        { model: Education, as: 'education' },
        { model: Project, as: 'projects' },
        { model: Employment, as: 'employment' },
        { model: Honor, as: 'honors' },
        { model: Skill, as: 'skills' }
      ]
    });

    // Combine all educations, projects, employments, honors, and skills into arrays
    const combinedData = {
      education: [],
      projects: [],
      employment: [],
      honors: [],
      skills: []
    };

    resumes.forEach(resume => {
      combinedData.education.push(...resume.education);
      combinedData.projects.push(...resume.projects);
      combinedData.employment.push(...resume.employment);
      combinedData.honors.push(...resume.honors);
      combinedData.skills.push(...resume.skills);
    });

    // Send the combined data in the response
    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error retrieving user resumes:', error);
    res.status(500).json({ error: 'An error occurred while retrieving user resumes' });
  }
};

exports.findOne = async (req, res) => {
    const id = req.params.id;
  
    try {
      const resume = await Resume.findByPk(id, {
        include: [
          { model: Skill, as: 'skills'},
          { model: Employment, as: 'employment' },
          { model: Education, as: 'education' },
          { model: Honor, as: 'honors' },
          { model: Project, as: 'projects' }
        ]
      });
  
      if (!resume) {
        return res.status(404).send({ message: "Resume's not found" });
      }
  
      res.send(resume);
    } catch (error) {
      res.status(500).send({
        message: error.message || "Some error occurred while retrieving the Resume."
      });
    }
  };

exports.delete = async (req, res) => {
    const id = req.params.id;
    const transaction = await sequelize.transaction();
  
    try {
      const resume = await Resume.findByPk(id);
      if (!resume) {
        await transaction.rollback();
        return res.status(404).send({ message: `Cannot delete Resume with id=${id}. Resume was not found!` });
      }
  
      await Skill.destroy({ where: { resume_id: id }, transaction });
      await Employment.destroy({ where: { resume_id: id }, transaction });
      await Education.destroy({ where: { resume_id: id }, transaction });
      await Honor.destroy({ where: { resume_id: id }, transaction });
      await Project.destroy({ where: { resume_id: id }, transaction });
      await Resume.destroy({ where: { id: id }, transaction });
  
      await transaction.commit();
      res.send({ message: "Resume was deleted successfully!" });
    } catch (error) {
      await transaction.rollback();
      res.status(500).send({
        message: error.message || "Could not delete Resume with id=" + id
      });
    }
  };
  
  exports.deleteAll = async (req, res) => {
    const transaction = await sequelize.transaction();
  
    try {
      await Skill.destroy({ where: {}, transaction });
      await Employment.destroy({ where: {}, transaction });
      await Education.destroy({ where: {}, transaction });
      await Honor.destroy({ where: {}, transaction });
      await Project.destroy({ where: {}, transaction });
      await Resume.destroy({ where: {}, transaction });
      await transaction.commit();
      res.send({ message: "All Resumes were deleted successfully!" });
    } catch (error) {
      await transaction.rollback();
      res.status(500).send({
        message: error.message || "Some error occurred while removing all resumes."
      });
    }
  };

  exports.update = async (req, res) => {
    const id = req.params.id;
    const { user_info,user_id, skills, employment, education, honors, projects } = req.body;
    const transaction = await sequelize.transaction();
    try {
      const resume = await Resume.findByPk(id);
      if (!resume) {
        await transaction.rollback();
        return res.status(404).send({ message: `Cannot update Resume with id=${id}. Resume was not found!` });
      }
      await Resume.update({ user_id,
        email: user_info.email,
        first_name: user_info.first_name,
        last_name: user_info.last_name,
        phone_number: user_info.phone_number,
        address: user_info.address,
        linkedin_url: user_info.linkedin_url,
        portfolio: user_info.portfolio,
        professional_summary: user_info.professional_summary,
        mobile: user_info.mobile,
      },{
        where: { resume_id: id },
        transaction
      });
      await updateOrCreateItems(resume.resume_id, skills, Skill, transaction);
      await updateOrCreateItems(resume.resume_id, employment, Employment, transaction);
      await updateOrCreateItems(resume.resume_id, education, Education, transaction);
      await updateOrCreateItems(resume.resume_id, honors, Honor, transaction);
      await updateOrCreateItems(resume.resume_id, projects, Project, transaction);
  
      await transaction.commit();
      res.send({
          message:  "Resume Updated Successfully!",
          resume_id: resume.resume_id,
          ai_generated_url: resume.ai_generated_url
        });
    } catch (error) {
      console.log("error",error);
      await transaction.rollback();
      res.status(500).send({
        message: error.message || "Some error occurred while generating the Resume."
      });
    }
  };
