const db = require("../models");
const path = require('path');
const Resume = db.resume;
const Skill = db.skill;
const Employment = db.employment;
const Education = db.education;
const Honor = db.honor;
const Project = db.project;
const ResumeSkill = db.resume_skill;
const ResumeEmployment = db.resume_employment;
const ResumeEducation = db.resume_education;
const ResumeHonor = db.resume_honor;
const ResumeProject = db.resume_project;
const { sequelize } = db;
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { CohereClient } = require('cohere-ai');

require('dotenv').config();

const cohereKey = process.env.COHERE_KEY || "";

const cohere = new CohereClient({
  token: cohereKey,
})
const pdf = require('pdf-parse');

const findOrCreateItem = async (model, data, userId, transaction) => {
  const { skill_id, employment_id, project_id, education_id, honor_id, ...searchCriteria } = data;
  searchCriteria.user_id = userId;

  let existingItem = await model.findOne({ where: searchCriteria, transaction });
  if (existingItem) {
    return existingItem;
  } else {
    const { skill_id ,employment_id, project_id, education_id, honor_id, ...new_data } = data;
    return await model.create({ ...new_data, user_id: userId }, { transaction });
  }
};

// Helper functions
const includeModels = [
  { model: Skill, as: 'skills' },
  { model: Employment, as: 'employment' },
  { model: Education, as: 'education' },
  { model: Honor, as: 'honors' },
  { model: Project, as: 'projects' }
];

const cleanAndDeduplicate = (data, uniqueKeyName) => {
  const seen = new Set();
  return data.reduce((acc, item) => {
    const cleanItem = { ...item.get() };
    
    // Remove unwanted properties
    delete cleanItem.resume_employment;
    delete cleanItem.resume_skill;
    delete cleanItem.resume_honor;
    delete cleanItem.resume_project;
    delete cleanItem.resume_education;

    const uniqueId = cleanItem[uniqueKeyName];

    // Only add the item if we haven't seen it before
    if (!seen.has(uniqueId)) {
      seen.add(uniqueId);
      acc.push(cleanItem);
    }

    return acc;
  }, []);
};

const cleanResume = (resume) => {
  const cleanResume = { ...resume.get() };
  cleanResume.skills = cleanAndDeduplicate(resume.skills, 'skill_id');
  cleanResume.employment = cleanAndDeduplicate(resume.employment, 'employment_id');
  cleanResume.education = cleanAndDeduplicate(resume.education, 'education_id');
  cleanResume.honors = cleanAndDeduplicate(resume.honors, 'honor_id');
  cleanResume.projects = cleanAndDeduplicate(resume.projects, 'project_id');
  return cleanResume;
};

const handleError = (res, error, defaultMessage) => {
  console.error('Error:', error);
  res.status(500).send({
    message: error.message || defaultMessage,
  });
};

const updateOrCreateJunctionTable = async (resumeId, userId, dataItems, model, junctionModel, transaction) => {
  await junctionModel.destroy({ where: { resume_id: resumeId }, transaction });

  for (const data of dataItems) {
    console.log("data",data)
    const item = await findOrCreateItem(model, data, userId, transaction);
    const junctionData = { resume_id: resumeId };
    junctionData[`${model.name.toLowerCase()}_id`] = item[`${model.name.toLowerCase()}_id`];
    console.log("junction data",junctionData)
    console.log("item data",item)
    try {
    await junctionModel.create(junctionData, { transaction });
    }
    catch(e) {
      console.log("error",e);
    }
  }
};

function generateRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to convertTo PDF
const convertToPDF = (content, filePath) => {
  return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      doc.text(content);
      doc.end();

      stream.on('finish', () => {
          resolve(filePath);
      });

      stream.on('error', (err) => {
          reject(err);
      });
  });
};

const readFileAsync = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

const generateAndStoreResume = async (body) => {
  try {
    // Read the templates PDF file
    const templatesPath = path.join(__dirname, '../../generated_resumes/templates.pdf');
    const dataBuffer = await readFileAsync(templatesPath);
    const pdfData = await pdf(dataBuffer);

    // Extract text content from the templates
    const templateContent = pdfData.text;

    // Construct the prompt
    const prompt = `
      Using one of the following resume templates.
      
      Resume Templates:
      ${templateContent}
      
      Candidate Information:
      create a resume for, 
      ${JSON.stringify(body)}
      
      Please generate a professional resume using one of the above templates and the provided information.
    `;

    console.log("prompt",prompt)

    // Use Cohere AI tool to generate the resume content
    const response = await cohere.generate({
      model: "command",
      prompt: prompt,
      max_tokens: 10000, // Increased for longer resumes
      temperature: 0.8,
    });

    console.log("response", JSON.stringify(response));
    if (!response.generations || response.generations.length === 0) {
      throw new Error("Failed to generate resume content.");
    }

    const generatedText = response.generations[0].text;

    const randomNumber = generateRandomNumber(1, 1000);
    console.log("generated text:", generatedText);
    const filePath = path.join(__dirname, '../../generated_resumes', `resume_${randomNumber}.pdf`);

    // Generate and save PDF
    await convertToPDF(generatedText, filePath);

    console.log('PDF Generated:', filePath);
    return { url: `resume_${randomNumber}.pdf` };
  } catch (error) {
    console.error('Error generating resume:', error);
    throw error;
  }
};


exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { user_info, user_id, skills, employment, education, honors, projects } = req.body;
    const { url } = await generateAndStoreResume(req.body);
    const resume = await Resume.create({
      user_id,
      email: user_info.email,
      first_name: user_info.first_name,
      last_name: user_info.last_name,
      phone_number: user_info.phone_number,
      address: user_info.address,
      linkedin_url: user_info.linkedin_url,
      portfolio: user_info.portfolio,
      professional_summary: user_info.professional_summary,
      mobile: user_info.mobile,
      ai_generated_url: url
    }, { transaction });

    await updateOrCreateJunctionTable(resume.resume_id, user_id, skills, Skill, ResumeSkill, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, employment, Employment, ResumeEmployment, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, education, Education, ResumeEducation, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, honors, Honor, ResumeHonor, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, projects, Project, ResumeProject, transaction);

    await transaction.commit();
    res.send({
      message: "Resume Generated Successfully!",
      resume_id: resume.resume_id,
      ai_generated_url: resume.ai_generated_url
    });
  } catch (error) {
    console.log("error", error);
    await transaction.rollback();
    res.status(500).send({
      message: error.message || "Some error occurred while generating the Resume."
    });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const { user_info, user_id, skills, employment, education, honors, projects } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const resume = await Resume.findByPk(id);
    if (!resume) {
      await transaction.rollback();
      return res.status(404).send({ message: `Cannot update Resume with id=${id}. Resume was not found!` });
    }

    await Resume.update({
      user_id,
      email: user_info.email,
      first_name: user_info.first_name,
      last_name: user_info.last_name,
      phone_number: user_info.phone_number,
      address: user_info.address,
      linkedin_url: user_info.linkedin_url,
      portfolio: user_info.portfolio,
      professional_summary: user_info.professional_summary,
      mobile: user_info.mobile,
    }, {
      where: { resume_id: id },
      transaction
    });

    await updateOrCreateJunctionTable(resume.resume_id, user_id, skills, Skill, ResumeSkill, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, employment, Employment, ResumeEmployment, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, education, Education, ResumeEducation, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, honors, Honor, ResumeHonor, transaction);
    await updateOrCreateJunctionTable(resume.resume_id, user_id, projects, Project, ResumeProject, transaction);

    await transaction.commit();
    res.send({
      message: "Resume Updated Successfully!",
      resume_id: resume.resume_id,
      ai_generated_url: resume.ai_generated_url
    });
  } catch (error) {
    console.log("error", error);
    await transaction.rollback();
    res.status(500).send({
      message: error.message || "Some error occurred while updating the Resume."
    });
  }
};

// Main functions
exports.findAll = async (req, res) => {
  try {
    const data = await Resume.findAll({ include: includeModels });
    const cleanedData = data.map(cleanResume);
    res.send(cleanedData);
  } catch (err) {
    handleError(res, err, "Some error occurred while retrieving resumes.");
  }
};

exports.findByUserId = async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const resumes = await Resume.findAll({
      where: { user_id: user_id },
      include: includeModels
    });

    if (resumes.length === 0) {
      return res.status(404).send({ message: "No resumes found for this user" });
    }

    const cleanedResumes = resumes.map(cleanResume);
    res.send(cleanedResumes);
  } catch (error) {
    handleError(res, error, "Some error occurred while retrieving the Resume.");
  }
};

exports.findAllUserResumesByCategory = async (req, res) => {
  try {
    const user_id = req.params.user_id;

    const resumes = await Resume.findAll({
      where: { user_id: user_id },
      include: includeModels
    });

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

    // Clean and deduplicate each category
    combinedData.education = cleanAndDeduplicate(combinedData.education, 'education_id');
    combinedData.projects = cleanAndDeduplicate(combinedData.projects, 'project_id');
    combinedData.employment = cleanAndDeduplicate(combinedData.employment, 'employment_id');
    combinedData.honors = cleanAndDeduplicate(combinedData.honors, 'honor_id');
    combinedData.skills = cleanAndDeduplicate(combinedData.skills, 'skill_id');

    res.status(200).json(combinedData);
  } catch (error) {
    handleError(res, error, 'An error occurred while retrieving user resumes');
  }
};

exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const resume = await Resume.findByPk(id, { include: includeModels });

    if (!resume) {
      return res.status(404).send({ message: "Resume not found" });
    }

    const cleanedResume = cleanResume(resume);
    res.send(cleanedResume);
  } catch (error) {
    handleError(res, error, "Some error occurred while retrieving the Resume.");
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

    await ResumeSkill.destroy({ where: { resume_id: id }, transaction });
    await ResumeEmployment.destroy({ where: { resume_id: id }, transaction });
    await ResumeEducation.destroy({ where: { resume_id: id }, transaction });
    await ResumeHonor.destroy({ where: { resume_id: id }, transaction });
    await ResumeProject.destroy({ where: { resume_id: id }, transaction });
    await Resume.destroy({ where: { resume_id: id }, transaction });

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
    await ResumeSkill.destroy({ where: {}, transaction });
    await ResumeEmployment.destroy({ where: {}, transaction });
    await ResumeEducation.destroy({ where: {}, transaction });
    await ResumeHonor.destroy({ where: {}, transaction });
    await ResumeProject.destroy({ where: {}, transaction });
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

exports.viewResume = async (req, res) => {
  try {
    const id = req.params.id;
    const resume = await Resume.findByPk(id);

    if (!resume || !resume.ai_generated_url) {
      return res.status(404).json({ message: 'Resume not found or PDF not generated.' });
    }
    const pdfPath = path.join(__dirname, '../../generated_resumes', resume.ai_generated_url);
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ message: 'Failed to fetch PDF.' });
  }
};
