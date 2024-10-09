import { PsAiModelSize } from "@policysynth/agents/aiModelTypes.js";
import { PolicySynthAgent } from "@policysynth/agents/base/agent.js";
import { PsAgent } from "@policysynth/agents/dbModels/agent.js";

// Import necessary types and interfaces
// Assuming these are defined in your codebase
// import { JobDescriptionMemoryData, JobDescription, JobDescriptionDegreeAnalysis, DataConsistencyChecks, DegreeRequirementStatus, MandatoryStatusExplanations, ProfessionalLicenseRequirement } from "../types.js";

export class ValidateJobDescriptionAgent extends PolicySynthAgent {
  declare memory: JobDescriptionMemoryData;

  modelSize: PsAiModelSize = PsAiModelSize.Medium;
  maxModelTokensOut = 2048;
  modelTemperature = 0.0;

  constructor(
    agent: PsAgent,
    memory: JobDescriptionMemoryData,
    startProgress: number,
    endProgress: number
  ) {
    super(agent, memory, startProgress, endProgress);
    this.memory = memory;
  }

  // Processing function for validating job descriptions
  async processJobDescription(jobDescription: JobDescription) {
    await this.updateRangedProgress(
      0,
      `Validating data consistency for ${jobDescription.name}`
    );

    // Ensure degreeAnalysis exists
    jobDescription.degreeAnalysis = jobDescription.degreeAnalysis || {} as JobDescriptionDegreeAnalysis;
    const degreeAnalysis = jobDescription.degreeAnalysis;

    // Ensure degreeRequirementStatus exists
    degreeAnalysis.degreeRequirementStatus = degreeAnalysis.degreeRequirementStatus || {} as DegreeRequirementStatus;
    const degreeStatus = degreeAnalysis.degreeRequirementStatus;

    // Ensure mandatoryStatusExplanations exists
    degreeAnalysis.mandatoryStatusExplanations = degreeAnalysis.mandatoryStatusExplanations || {} as MandatoryStatusExplanations;
    const explanations = degreeAnalysis.mandatoryStatusExplanations;

    // Ensure professionalLicenseRequirement exists
    degreeAnalysis.professionalLicenseRequirement = degreeAnalysis.professionalLicenseRequirement || {} as ProfessionalLicenseRequirement;
    const professionalLicenseRequirement = degreeAnalysis.professionalLicenseRequirement;

    // Initialize validationChecks
    degreeAnalysis.validationChecks = {} as DataConsistencyChecks;
    const validationChecks = degreeAnalysis.validationChecks;

    // 1. cscRevisedConsistency
    if (jobDescription.cscRevised === true) {
      const conditionMet =
        degreeStatus.hasAlternativeQualifications === true &&
        degreeStatus.multipleQualificationPaths === true &&
        degreeStatus.isDegreeMandatory === false &&
        degreeStatus.isDegreeAbsolutelyRequired === false;

      validationChecks.cscRevisedConsistency = conditionMet;
    } else {
      // If cscRevised is not true, we consider the consistency check not applicable.
      validationChecks.cscRevisedConsistency = undefined;
    }

    // 2. requiredAlternativeExplanationConsistency
    const bothRequiredAndAlternativeTrue =
      degreeStatus.isDegreeMandatory === true &&
      degreeStatus.hasAlternativeQualifications === true;
    const bothRequiredAndAlternativeFalse =
      degreeStatus.isDegreeMandatory === false &&
      degreeStatus.hasAlternativeQualifications === false;

    if (bothRequiredAndAlternativeTrue) {
      const explanationFilled =
        explanations.bothTrueExplanation !== undefined &&
        explanations.bothTrueExplanation.trim() !== "";

      validationChecks.requiredAlternativeExplanationConsistency = explanationFilled;
    } else if (bothRequiredAndAlternativeFalse) {
      const explanationFilled =
        explanations.bothFalseExplanation !== undefined &&
        explanations.bothFalseExplanation.trim() !== "";

      validationChecks.requiredAlternativeExplanationConsistency = explanationFilled;
    } else {
      // If 'required' and 'alternative' are not both true or both false, the check is not applicable.
      validationChecks.requiredAlternativeExplanationConsistency = undefined;
    }

    // 3. needsCollegeDegreeConsistency
    if (degreeAnalysis.needsCollegeDegree === true) {
      const educationRequirementsFilled =
        degreeAnalysis.educationRequirements !== undefined &&
        degreeAnalysis.educationRequirements.length > 0;

      const eitherDegreeRequiredOrAlternativeTrue =
        degreeStatus.isDegreeMandatory === true ||
        degreeStatus.isDegreeAbsolutelyRequired === true ||
        degreeStatus.hasAlternativeQualifications === true ||
        degreeStatus.multipleQualificationPaths === true;

      const alternativeQualificationsFilled =
        degreeStatus.alternativeQualifications !== undefined &&
        degreeStatus.alternativeQualifications.length > 0;

      validationChecks.needsCollegeDegreeConsistency =
        educationRequirementsFilled &&
        eitherDegreeRequiredOrAlternativeTrue &&
        alternativeQualificationsFilled;
    } else {
      // If needsCollegeDegree is not true, we consider the consistency check not applicable.
      validationChecks.needsCollegeDegreeConsistency = undefined;
    }

    // 4. educationRequirementsConsistency
    if (
      degreeAnalysis.educationRequirements &&
      degreeAnalysis.educationRequirements.some((req) =>
        req.type !== "collegeCoursework" && req.type !== "highschool"
      )
    ) {
      const eitherDegreeRequiredOrAlternativeTrue =
        degreeStatus.isDegreeMandatory === true ||
        degreeStatus.isDegreeAbsolutelyRequired === true ||
        degreeStatus.hasAlternativeQualifications === true ||
        degreeStatus.multipleQualificationPaths === true;

      const alternativeQualificationsFilled =
        degreeStatus.alternativeQualifications !== undefined &&
        degreeStatus.alternativeQualifications.length > 0;

      validationChecks.educationRequirementsConsistency =
        eitherDegreeRequiredOrAlternativeTrue && alternativeQualificationsFilled;
    } else {
      // If educationRequirements does not include higher degrees, we consider the check not applicable.
      validationChecks.educationRequirementsConsistency = undefined;
    }

    // 5. alternativeQualificationsConsistency
    if (
      degreeStatus.hasAlternativeQualifications !== undefined &&
      degreeStatus.multipleQualificationPaths !== undefined
    ) {
      validationChecks.alternativeQualificationsConsistency =
        degreeStatus.hasAlternativeQualifications === degreeStatus.multipleQualificationPaths;
    } else {
      // If either field is undefined, we cannot perform the check.
      validationChecks.alternativeQualificationsConsistency = undefined;
    }

    // 6. degreeMandatoryConsistency
    if (
      degreeStatus.isDegreeMandatory !== undefined &&
      degreeStatus.isDegreeAbsolutelyRequired !== undefined
    ) {
      validationChecks.degreeMandatoryConsistency =
        degreeStatus.isDegreeMandatory === degreeStatus.isDegreeAbsolutelyRequired;
    } else {
      // If either field is undefined, we cannot perform the check.
      validationChecks.degreeMandatoryConsistency = undefined;
    }

    // 7. alternativesIfTrueConsistency
    if (
      degreeStatus.hasAlternativeQualifications === true ||
      degreeStatus.multipleQualificationPaths === true
    ) {
      const alternativeQualificationsFilled =
        degreeStatus.alternativeQualifications !== undefined &&
        degreeStatus.alternativeQualifications.length > 0;

      // substitutionPossible could be true (we accept both true and undefined)
      const substitutionPossibleAcceptable =
        degreeStatus.substitutionPossible === true ||
        degreeStatus.substitutionPossible === undefined;

      const degreeRequirementExplanationFilled =
        explanations.degreeRequirementExplanation !== undefined &&
        explanations.degreeRequirementExplanation.trim() !== "";

      validationChecks.alternativesIfTrueConsistency =
        alternativeQualificationsFilled &&
        substitutionPossibleAcceptable &&
        degreeRequirementExplanationFilled;
    } else {
      // If neither hasAlternativeQualifications nor multipleQualificationPaths is true, the check is not applicable.
      validationChecks.alternativesIfTrueConsistency = undefined;
    }

    // 8. licenseIncludesDegreeRequirementConsistency
    if (
      professionalLicenseRequirement &&
      professionalLicenseRequirement.includesDegreeRequirement === true
    ) {
      const eitherDegreeRequiredOrAlternativeTrue =
        degreeStatus.isDegreeMandatory === true ||
        degreeStatus.isDegreeAbsolutelyRequired === true ||
        degreeStatus.hasAlternativeQualifications === true ||
        degreeStatus.multipleQualificationPaths === true;

      const alternativeQualificationsFilled =
        degreeStatus.alternativeQualifications !== undefined &&
        degreeStatus.alternativeQualifications.length > 0;

      validationChecks.licenseIncludesDegreeRequirementConsistency =
        eitherDegreeRequiredOrAlternativeTrue && alternativeQualificationsFilled;
    } else {
      // If includesDegreeRequirement is not true, the check is not applicable.
      validationChecks.licenseIncludesDegreeRequirementConsistency = undefined;
    }

    // 9. barriersToNonDegreeApplicantsConsistency
    if (degreeAnalysis.barriersToNonDegreeApplicants) {
      // Check if barriersToNonDegreeApplicants mentions a college or other higher education degree
      const mentionsDegree = /college|university|higher education degree|bachelor|master|doctorate|associate/i.test(
        degreeAnalysis.barriersToNonDegreeApplicants
      );

      if (mentionsDegree) {
        const eitherDegreeRequiredOrAlternativeTrue =
          degreeStatus.isDegreeMandatory === true ||
          degreeStatus.isDegreeAbsolutelyRequired === true ||
          degreeStatus.hasAlternativeQualifications === true ||
          degreeStatus.multipleQualificationPaths === true;

        const alternativeQualificationsFilled =
          degreeStatus.alternativeQualifications !== undefined &&
          degreeStatus.alternativeQualifications.length > 0;

        // Check if the same language is identified in the job description
        const jobDescriptionMentionsDegree = /college|university|higher education degree|bachelor|master|doctorate|associate/i.test(
          jobDescription.text
        );

        validationChecks.barriersToNonDegreeApplicantsConsistency =
          eitherDegreeRequiredOrAlternativeTrue &&
          alternativeQualificationsFilled &&
          jobDescriptionMentionsDegree;
      } else {
        // If barriersToNonDegreeApplicants does not mention a degree, the check is not applicable.
        validationChecks.barriersToNonDegreeApplicantsConsistency = undefined;
      }
    } else {
      // If barriersToNonDegreeApplicants is not provided, the check is not applicable.
      validationChecks.barriersToNonDegreeApplicantsConsistency = undefined;
    }

    await this.updateRangedProgress(100, "Data consistency validation completed");
  }
}
