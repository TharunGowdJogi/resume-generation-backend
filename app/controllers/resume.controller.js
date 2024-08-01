const db = require("../models");
const path = require("path");
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
const puppeteer = require("puppeteer");
const fs = require("fs");
const OpenAi = require('openai');
require('dotenv').config();
const openAiKey = process.env.OPENAI_SECRET_KEY;
const assistantId = process.env.OPENAI_ASSISTANT;
const openAi = new OpenAi({
  apiKey: openAiKey
})

const findOrCreateItem = async (model, data, userId, transaction) => {
  const {
    skill_id,
    employment_id,
    project_id,
    education_id,
    honor_id,
    ...searchCriteria
  } = data;
  searchCriteria.user_id = userId;

  let existingItem = await model.findOne({
    where: searchCriteria,
    transaction,
  });
  if (existingItem) {
    return existingItem;
  } else {
    const {
      skill_id,
      employment_id,
      project_id,
      education_id,
      honor_id,
      ...new_data
    } = data;
    return await model.create(
      { ...new_data, user_id: userId },
      { transaction }
    );
  }
};

// Helper functions
const includeModels = [
  { model: Skill, as: "skills" },
  { model: Employment, as: "employment" },
  { model: Education, as: "education" },
  { model: Honor, as: "honors" },
  { model: Project, as: "projects" },
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
  cleanResume.skills = cleanAndDeduplicate(resume.skills, "skill_id");
  cleanResume.employment = cleanAndDeduplicate(
    resume.employment,
    "employment_id"
  );
  cleanResume.education = cleanAndDeduplicate(resume.education, "education_id");
  cleanResume.honors = cleanAndDeduplicate(resume.honors, "honor_id");
  cleanResume.projects = cleanAndDeduplicate(resume.projects, "project_id");
  return cleanResume;
};

const handleError = (res, error, defaultMessage) => {
  console.error("Error:", error);
  res.status(500).send({
    message: error.message || defaultMessage,
  });
};

const updateOrCreateJunctionTable = async (
  resumeId,
  userId,
  dataItems,
  model,
  junctionModel,
  transaction
) => {
  await junctionModel.destroy({ where: { resume_id: resumeId }, transaction });

  for (const data of dataItems) {
    console.log("data", data);
    const item = await findOrCreateItem(model, data, userId, transaction);
    const junctionData = { resume_id: resumeId };
    junctionData[`${model.name.toLowerCase()}_id`] =
      item[`${model.name.toLowerCase()}_id`];
    console.log("junction data", junctionData);
    console.log("item data", item);
    try {
      await junctionModel.create(junctionData, { transaction });
    } catch (e) {
      console.log("error", e);
    }
  }
};

function generateRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to convertTo PDF
const convertToPDF = async (content) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    });
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateAndStoreResume = async (body) => {
  try {

    // Construct the prompt
    const prompt = `Create a detailed and professional resume in HTML and CSS format using the following candidate information and resume templates:

      Candidate Information:
      ${JSON.stringify(body, null, 2)}

      Please adhere to these guidelines:
      1. Select one of the provided resume templates and adapt it to fit the candidate's information.
      2. Ensure the HTML is semantically correct and the CSS is clean and efficient.
      3. Use the following font sizes:
        - 12pt for main section headings (e.g., "Professional Experience", "Educational Background")
        - 10pt for sub-headings (e.g., job titles, degree names)
        - 8pt for body text and bullet points
      4. Choose a professional, easy-to-read font such as Arial, Helvetica, or Calibri.
      5. Maintain adequate spacing between sections:
        - Include at least 20px of margin above and below each main section.
        - Add 10px of margin above and below sub-headings.
        - Use 5px of margin between bullet points for clarity.
      6. Use black color for all text to maintain a clean and professional look.
      7. Avoid any layout that could cause inappropriate page breaks. Ensure that sections fit well together without splitting across pages.
      8. Ensure the design is responsive and looks good when converted to PDF.
      9. Include appropriate margins (e.g., 0.5 to 1 inch) to ensure the resume is printable.
      10. Use bullet points for listing skills, job responsibilities, and achievements.
      11. Highlight key information such as job titles, company names, and dates.
      12. Ensure the overall layout is balanced and visually appealing.

      Provide only the HTML and CSS code, starting from the <!DOCTYPE html> declaration and ending with the closing </html> tag. Do not include any explanations or additional text outside of the HTML/CSS code.

      The final result should be a polished, professional-looking resume that accurately represents the provided data and is ready for PDF conversion.`;
   
      console.log("prompt", prompt);

    // Use Open AI tool to generate the resume content
    const thread = await openAi.beta.threads.create();
    let res = "";
    let run = await openAi.beta.threads.runs.createAndPoll(
        thread.id,
        { 
          assistant_id: assistantId,
          instructions: prompt,
        }
      );
    if (run.status === 'completed') {
        const messages = await openAi.beta.threads.messages.list(
            run.thread_id
        );
        for (const message of messages.data.reverse()) {
            console.log(`message : ${message.role} > ${message.content[0].text.value}`);
            res = message.content[0].text.value
        }
    } else {
        console.log(run.status);
    }

    console.log("response", JSON.stringify(res));
    const generatedText = res.trim().replace("```html","").replace("```","");
    const randomNumber = generateRandomNumber(1, 90000);
    console.log("generated text:", generatedText);
    const filePath = path.join(
      __dirname,
      "../../generated_resumes",
      `resume_${randomNumber}.pdf`
    );
    const pdfBufferData = await convertToPDF(generatedText);
    await fs.promises.writeFile(filePath, pdfBufferData);
    console.log("PDF Generated:", filePath);
    return { url: `resume_${randomNumber}.pdf` };
  } catch (error) {
    console.error("Error generating resume:", error);
    throw error;
  }
};

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      user_info,
      user_id,
      skills,
      employment,
      education,
      honors,
      projects,
    } = req.body;
    console.log("req:", req.body);
    const { url } = await generateAndStoreResume(req.body);
    const resume = await Resume.create(
      {
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
        ai_generated_url: url,
      },
      { transaction }
    );

    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      skills,
      Skill,
      ResumeSkill,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      employment,
      Employment,
      ResumeEmployment,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      education,
      Education,
      ResumeEducation,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      honors,
      Honor,
      ResumeHonor,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      projects,
      Project,
      ResumeProject,
      transaction
    );

    await transaction.commit();
    res.send({
      message: "Resume Generated Successfully!",
      resume_id: resume.resume_id,
      ai_generated_url: resume.ai_generated_url,
    });
  } catch (error) {
    console.log("error", error);
    await transaction.rollback();
    res.status(500).send({
      message:
        error.message || "Some error occurred while generating the Resume.",
    });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const {
    user_info,
    user_id,
    skills,
    employment,
    education,
    honors,
    projects,
  } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const resume = await Resume.findByPk(id);
    if (!resume) {
      await transaction.rollback();
      return res
        .status(404)
        .send({
          message: `Cannot update Resume with id=${id}. Resume was not found!`,
        });
    }
    const { url } = await generateAndStoreResume(req.body);

    await Resume.update(
      {
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
        ai_generated_url: url,
      },
      {
        where: { resume_id: id },
        transaction,
      }
    );

    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      skills,
      Skill,
      ResumeSkill,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      employment,
      Employment,
      ResumeEmployment,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      education,
      Education,
      ResumeEducation,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      honors,
      Honor,
      ResumeHonor,
      transaction
    );
    await updateOrCreateJunctionTable(
      resume.resume_id,
      user_id,
      projects,
      Project,
      ResumeProject,
      transaction
    );

    await transaction.commit();
    res.send({
      message: "Resume Updated Successfully!",
      resume_id: resume.resume_id,
      ai_generated_url: resume.ai_generated_url,
    });
  } catch (error) {
    console.log("error", error);
    await transaction.rollback();
    res.status(500).send({
      message:
        error.message || "Some error occurred while updating the Resume.",
    });
  }
};

// Main functions
exports.findAll = async (req, res) => {
  try {
    const data = await Resume.findAll({ where: { is_deleted: false }, include: includeModels });
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
      where: { user_id: user_id, is_deleted: false },
      include: includeModels,
    });

    if (resumes.length === 0) {
      return res
        .status(404)
        .send({ message: "No resumes found for this user" });
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
      include: includeModels,
    });

    const combinedData = {
      education: [],
      projects: [],
      employment: [],
      honors: [],
      skills: [],
    };

    resumes.forEach((resume) => {
      combinedData.education.push(...resume.education);
      combinedData.projects.push(...resume.projects);
      combinedData.employment.push(...resume.employment);
      combinedData.honors.push(...resume.honors);
      combinedData.skills.push(...resume.skills);
    });

    // Clean and deduplicate each category
    combinedData.education = cleanAndDeduplicate(
      combinedData.education,
      "education_id"
    );
    combinedData.projects = cleanAndDeduplicate(
      combinedData.projects,
      "project_id"
    );
    combinedData.employment = cleanAndDeduplicate(
      combinedData.employment,
      "employment_id"
    );
    combinedData.honors = cleanAndDeduplicate(combinedData.honors, "honor_id");
    combinedData.skills = cleanAndDeduplicate(combinedData.skills, "skill_id");

    res.status(200).json(combinedData);
  } catch (error) {
    handleError(res, error, "An error occurred while retrieving user resumes");
  }
};

exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const resume = await Resume.findByPk(id, { include: includeModels, is_deleted: false });

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
      return res
        .status(404)
        .send({
          message: `Cannot delete Resume with id=${id}. Resume was not found!`,
        });
    }

    // Instead of deleting the resume, update the is_deleted field to true
    await Resume.update(
      { is_deleted: true },
      { where: { resume_id: id }, transaction }
    );

    await transaction.commit();
    res.send({ message: "Resume was deleted successfully!" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).send({
      message: error.message || "Could not delete Resume with id=" + id,
    });
  }
};


exports.deleteAll = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Set is_deleted to true for all resumes
    await Resume.update(
      { is_deleted: true },
      { where: {}, transaction }
    );

    await transaction.commit();
    res.send({ message: "All Resumes were marked as deleted successfully!" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).send({
      message:
        error.message || "Some error occurred while marking all resumes as deleted.",
    });
  }
};


exports.viewResume = async (req, res) => {
  try {
    const id = req.params.id;
    const resume = await Resume.findByPk(id);

    if (!resume || !resume.ai_generated_url) {
      return res
        .status(404)
        .json({ message: "Resume not found or PDF not generated." });
    }
    const pdfPath = path.join(
      __dirname,
      "../../generated_resumes",
      resume.ai_generated_url
    );
    res.sendFile(pdfPath);
  } catch (error) {
    console.error("Error fetching PDF:", error);
    res.status(500).json({ message: "Failed to fetch PDF." });
  }
};
