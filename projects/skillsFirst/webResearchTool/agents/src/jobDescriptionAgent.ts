
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

import { PolicySynthAgent } from "@policysynth/agents/base/agent.js";
import { PsAgent } from "@policysynth/agents/dbModels/agent.js";
import { PsAiModelSize, PsAiModelType } from "@policysynth/agents/aiModelTypes.js";
import { PsAgentClassCategories } from "@policysynth/agents/agentCategories.js";
import { PsConnectorClassTypes } from "@policysynth/agents/connectorTypes.js";
import fs from "fs";
import { DetermineCollegeDegreeStatusAgent } from "./reviewAgents/determineStatus.js";
import { ReviewEvidenceQuoteAgent } from "./reviewAgents/reviewEvidenceAgent.js";
import { DetermineMandatoryStatusAgent } from "./reviewAgents/mantatoryStatus.js";
import { DetermineProfessionalLicenseRequirementAgent } from "./reviewAgents/additionalRequirements.js";
import { IdentifyBarriersAgent } from "./reviewAgents/identifyBarriers.js";
import { ValidateJobDescriptionAgent } from "./reviewAgents/dataConsistencyLLMTSHybrid.js";
import { ReadabilityScoreJobDescriptionAgent } from "./reviewAgents/readabilityAnalysis-text-readability-flesh-kncaid.js";
import { ReadingLevelUSGradeAnalysisAgentP2 } from "./reviewAgents/readingLevelUSGradeAnalysis2P.js";

// Main agent class that orchestrates the job description analysis
export class JobDescriptionAnalysisAgent extends PolicySynthAgent {
  declare memory: JobDescriptionMemoryData;
  modelTemperature = 0.0;
  private static readonly JOB_DESCRIPTION_AGENT_CLASS_BASE_ID = "efe71e49-50e5-4636-b3bd-f4adc97bbad4";
  private static readonly JOB_DESCRIPTION_AGENT_CLASS_VERSION = 1;

  constructor(
    agent: PsAgent,
    memory: JobDescriptionMemoryData,
    startProgress: number,
    endProgress: number
  ) {
    super(agent, memory, startProgress, endProgress);
    this.memory = memory;
  }

  // Main processing function
  async process() {
    await this.updateRangedProgress(0, "Starting Job Description Analysis");
  
    // Load jobDescriptions.json
    const jobDescriptionsData = fs.readFileSync(
      path.join(__dirname, "data", "jobDescriptions.json"),
      "utf-8"
    );
    const allJobDescriptions = JSON.parse(jobDescriptionsData) as JobDescription[];
  
    // Get the number of job descriptions to process from configuration or default to 10
    const numJobDescriptions = 3771; // or this.agent.configuration?.numJobDescriptions
  
    // Choose numJobDescriptions at random
    const selectedJobDescriptions = this.selectRandomJobDescriptions(
      allJobDescriptions,
      numJobDescriptions
    );
  
    this.memory.jobDescriptions = selectedJobDescriptions;
  
    // Process each job description
    for (let i = 0; i < selectedJobDescriptions.length; i++) {
      const jobDescription = selectedJobDescriptions[i];
  
      // 1) If the "error" property is already set and non-empty, skip right away
      if (jobDescription.error && jobDescription.error.trim() !== "") {
        this.logger.warn(
          `Skipping job description '${jobDescription.titleCode}' due to existing error: ${jobDescription.error}`
        );
        continue;
      }
  
      const progress = (i / selectedJobDescriptions.length) * 100;
      await this.updateRangedProgress(
        progress,
        `Processing job description ${i + 1} of ${selectedJobDescriptions.length}`
      );
  
      // 2) Check for the HTML file, and if not present, set error and skip
      const htmlFilePath = path.join(
        __dirname,
        "data",
        "descriptions",
        `${jobDescription.titleCode}.html`
      );
      if (!fs.existsSync(htmlFilePath)) {
        this.logger.error(`HTML file not found for ${jobDescription.titleCode}`);
        jobDescription.error = `HTML file not found for ${jobDescription.titleCode}`;
        continue;
      }
  
      // Read the HTML file content
      const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");
      jobDescription.text = this.extractTextFromHtml(htmlContent);
  
      // Now process the job description
      await this.processJobDescription(jobDescription);
  
      await this.saveMemory();
    }
  
    await this.saveMemory();
  
    await this.updateRangedProgress(100, "Job Description Analysis Completed");
    await this.setCompleted("Task Completed");
  }

  // Helper function to select random job descriptions
  private selectRandomJobDescriptions(
    allJobDescriptions: JobDescription[],
    numToSelect: number
  ): JobDescription[] {
    const shuffled = allJobDescriptions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numToSelect);
  }

  // Helper function to extract text from HTML
  private extractTextFromHtml(htmlContent: string): string {
    // Simple HTML to text extraction
    return htmlContent.replace(/<[^>]*>?/gm, ""); // Remove HTML tags
  }

    // Function to process individual job descriptions
    private async processJobDescription(jobDescription: JobDescription) {
      // Step 1: Determine if the JobDescription includes a discussion of a college degree or higher education requirement.
      const determineDegreeStatusAgent = new DetermineCollegeDegreeStatusAgent(
        this.agent,
        this.memory,
        0,
        14
      );
      await determineDegreeStatusAgent.processJobDescription(jobDescription);
      await this.saveMemory();
    
      // // // Step 2: For all EducationTypes identified as True (except HighSchool), review evidence quotcae.
      const reviewEvidenceQuoteAgent = new ReviewEvidenceQuoteAgent(
        this.agent,
        this.memory,
        14,
        28
      );
      await reviewEvidenceQuoteAgent.processJobDescription(jobDescription);
      await this.saveMemory();
    
      // // // Step 3: Determine whether any college degree requirement is mandatory or permissive.
      const determineMandatoryStatusAgent = new DetermineMandatoryStatusAgent(
        this.agent,
        this.memory,
        28,
        42
      );
      await determineMandatoryStatusAgent.processJobDescription(jobDescription);
      await this.saveMemory();
    
      // Step 4: Determine whether any professional license is required.
      const determineProfessionalLicenseAgent = new DetermineProfessionalLicenseRequirementAgent(
        this.agent,
        this.memory,
        42,
        56
      );
      await determineProfessionalLicenseAgent.processJobDescription(jobDescription);
      await this.saveMemory();
    
      // // // Step 5: Identify any barriers to hiring applicants without a college or university degree.
      const identifyBarriersAgent = new IdentifyBarriersAgent(
        this.agent,
        this.memory,
        56,
        70
      );
      await identifyBarriersAgent.processJobDescription(jobDescription);
      await this.saveMemory();
    
      // // Step 6: Validate data consistency
      const validateJobDescriptionAgent = new ValidateJobDescriptionAgent(
        this.agent,
        this.memory,
        70,
        84
      );
      await validateJobDescriptionAgent.processJobDescription(jobDescription);
      await this.saveMemory();
    
      // // Step 7: Analyze the readability of the job description via flesh kincaid
      const readabilityTXTTSNPMJobDescriptionAgent = new ReadabilityScoreJobDescriptionAgent(
        this.agent,
        this.memory,
        84,
        100
      );
      await readabilityTXTTSNPMJobDescriptionAgent.processJobDescription(jobDescription);
      await this.saveMemory();
    

         // Step 8: Analyze the readability according to US job level and extract  difficult passages .
         const readingLevelUSGradeAnalysisAgentP2 = new ReadingLevelUSGradeAnalysisAgentP2(
          this.agent,
          this.memory,
          100,
          114
        );
        await readingLevelUSGradeAnalysisAgentP2.processJobDescription(jobDescription);
        await this.saveMemory();

      }
  

 
  // Static method to get agent class attributes
  static getAgentClass(): PsAgentClassCreationAttributes {
    return {
      class_base_id: this.JOB_DESCRIPTION_AGENT_CLASS_BASE_ID,
      user_id: 0,
      name: "Job Description Analysis Agent",
      version: this.JOB_DESCRIPTION_AGENT_CLASS_VERSION,
      available: true,
      configuration: {
        category: PsAgentClassCategories.HRManagement,
        subCategory: "jobDescriptionAnalysis",
        hasPublicAccess: false,
        description:
          "An agent for analyzing job descriptions for education requirements",
        queueName: "JOB_DESCRIPTION_ANALYSIS",
        imageUrl: "https://aoi-storage-production.citizens.is/ypGenAi/community/1/d243273c-f11e-4055-9a78-eaa1fa4baa28.png", // Provide an image URL if available
        iconName: "job_description_analysis",
        capabilities: ["analysis", "text processing"],
        requestedAiModelSizes: [PsAiModelSize.Medium],
        defaultStructuredQuestions: [
          {
            uniqueId: "numJobDescriptions",
            type: "textField",
            subType: "number",
            value: 10,
            maxLength: 4,
            required: true,
            text: "Number of job descriptions to analyze",
          },
        ],
        supportedConnectors: [] as PsConnectorClassTypes[],
        questions: this.getConfigurationQuestions(),
      },
    };
  }

  // Configuration questions for the agent
  static getConfigurationQuestions(): YpStructuredQuestionData[] {
    return [
      {
        uniqueId: "numJobDescriptions",
        type: "textField",
        subType: "number",
        value: 10,
        maxLength: 4,
        required: true,
        text: "Number of job descriptions to analyze",
      },
    ];
  }
}
