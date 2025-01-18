// Script to transform JSON to CSV with nested keys reflected in column names
// using ES6 import statements for use in an .mjs script

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createObjectCsvWriter } from 'csv-writer';

// Determine __dirname since ES modules do not have it by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON file
const jsonFilePath = path.join(__dirname, 'jobDescriptions.json'); // Updated the JSON file name
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// Prepare CSV headers with nested structure reflected in the column titles
const headers = [
  { id: 'agentId', title: 'agentId' },
  { id: 'titleCode', title: 'titleCode' },
  { id: 'variant', title: 'variant' },
  { id: 'classOfService', title: 'classOfService' },
  { id: 'workWeek', title: 'workWeek' },
  { id: 'bargainUnit', title: 'bargainUnit' },
  { id: 'classCode', title: 'classCode' },
  { id: 'salaryRange', title: 'salaryRange' },
  { id: 'workMonth', title: 'workMonth' },
  { id: 'deptCode', title: 'deptCode' },
  { id: 'url', title: 'url' },
  { id: 'name', title: 'name' },
  // { id: 'text', title: 'text' }, // Uncomment if you need the text field
  { id: 'classification', title: 'classification' },
  { id: 'error', title: 'error' },
  { id: 'multiLevelJob', title: 'multiLevelJob' },
  { id: 'cscRevised', title: 'cscRevised' },
  { id: 'notes', title: 'notes' },
  // Occupational Category (nested)
  { id: 'occupationalCategory.mainCategory', title: 'occupationalCategory.mainCategory' },
  { id: 'occupationalCategory.subCategory', title: 'occupationalCategory.subCategory' },
  // Degree Analysis (nested)
  { id: 'degreeAnalysis.needsCollegeDegree', title: 'degreeAnalysis.needsCollegeDegree' },
  // Education Requirements (may have multiple entries)
  { id: 'degreeAnalysis.educationRequirements', title: 'degreeAnalysis.educationRequirements' },
  // Degree Requirement Status (nested)
  { id: 'degreeAnalysis.degreeRequirementStatus.isDegreeMandatory', title: 'degreeAnalysis.degreeRequirementStatus.isDegreeMandatory' },
  { id: 'degreeAnalysis.degreeRequirementStatus.hasAlternativeQualifications', title: 'degreeAnalysis.degreeRequirementStatus.hasAlternativeQualifications' },
  { id: 'degreeAnalysis.degreeRequirementStatus.alternativeQualifications', title: 'degreeAnalysis.degreeRequirementStatus.alternativeQualifications' },
  { id: 'degreeAnalysis.degreeRequirementStatus.multipleQualificationPaths', title: 'degreeAnalysis.degreeRequirementStatus.multipleQualificationPaths' },
  { id: 'degreeAnalysis.degreeRequirementStatus.isDegreeAbsolutelyRequired', title: 'degreeAnalysis.degreeRequirementStatus.isDegreeAbsolutelyRequired' },
  { id: 'degreeAnalysis.degreeRequirementStatus.substitutionPossible', title: 'degreeAnalysis.degreeRequirementStatus.substitutionPossible' },
  // Mandatory Status Explanations
  { id: 'degreeAnalysis.mandatoryStatusExplanations.degreeRequirementExplanation', title: 'degreeAnalysis.mandatoryStatusExplanations.degreeRequirementExplanation' },
  // NEW: Additional fields for mandatoryStatusExplanations
  { id: 'degreeAnalysis.mandatoryStatusExplanations.bothTrueExplanation', title: 'degreeAnalysis.mandatoryStatusExplanations.bothTrueExplanation' },
  { id: 'degreeAnalysis.mandatoryStatusExplanations.bothFalseExplanation', title: 'degreeAnalysis.mandatoryStatusExplanations.bothFalseExplanation' },
  // Professional License Requirement (nested)
  { id: 'degreeAnalysis.professionalLicenseRequirement.isLicenseRequired', title: 'degreeAnalysis.professionalLicenseRequirement.isLicenseRequired' },
  { id: 'degreeAnalysis.professionalLicenseRequirement.licenseDescription', title: 'degreeAnalysis.professionalLicenseRequirement.licenseDescription' },
  { id: 'degreeAnalysis.professionalLicenseRequirement.issuingAuthority', title: 'degreeAnalysis.professionalLicenseRequirement.issuingAuthority' },
  { id: 'degreeAnalysis.professionalLicenseRequirement.includesDegreeRequirement', title: 'degreeAnalysis.professionalLicenseRequirement.includesDegreeRequirement' },
  // Barriers to Non-Degree Applicants
  { id: 'degreeAnalysis.barriersToNonDegreeApplicants', title: 'degreeAnalysis.barriersToNonDegreeApplicants' },
  // **Validation Checks (reversed order)**
  { id: 'degreeAnalysis.validationChecks.cscRevisedConsistency', title: 'degreeAnalysis.validationChecks.cscRevisedConsistency' },
  { id: 'degreeAnalysis.validationChecks.requiredAlternativeExplanationConsistency', title: 'degreeAnalysis.validationChecks.requiredAlternativeExplanationConsistency' },
  { id: 'degreeAnalysis.validationChecks.barriersToNonDegreeApplicantsConsistency', title: 'degreeAnalysis.validationChecks.barriersToNonDegreeApplicantsConsistency' },
  { id: 'degreeAnalysis.validationChecks.licenseIncludesDegreeRequirementConsistency', title: 'degreeAnalysis.validationChecks.licenseIncludesDegreeRequirementConsistency' },
  { id: 'degreeAnalysis.validationChecks.alternativesIfTrueConsistency', title: 'degreeAnalysis.validationChecks.alternativesIfTrueConsistency' },
  { id: 'degreeAnalysis.validationChecks.degreeMandatoryConsistency', title: 'degreeAnalysis.validationChecks.degreeMandatoryConsistency' },
  { id: 'degreeAnalysis.validationChecks.alternativeQualificationsConsistency', title: 'degreeAnalysis.validationChecks.alternativeQualificationsConsistency' },
  { id: 'degreeAnalysis.validationChecks.educationRequirementsConsistency', title: 'degreeAnalysis.validationChecks.educationRequirementsConsistency' },
  { id: 'degreeAnalysis.validationChecks.needsCollegeDegreeConsistency', title: 'degreeAnalysis.validationChecks.needsCollegeDegreeConsistency' },
  // **Reading Level US Grade Analysis**
  { id: 'readingLevelUSGradeAnalysis.difficultPassages', title: 'readingLevelUSGradeAnalysis.difficultPassages' },
  { id: 'readingLevelUSGradeAnalysis.usGradeLevelReadability', title: 'readingLevelUSGradeAnalysis.usGradeLevelReadability' },
  // **Reading Level US Grade Analysis P2**
  { id: 'readingLevelUSGradeAnalysisP2.difficultPassages', title: 'readingLevelUSGradeAnalysisP2.difficultPassages' },
  { id: 'readingLevelUSGradeAnalysisP2.usGradeLevelReadability', title: 'readingLevelUSGradeAnalysisP2.usGradeLevelReadability' },
  // **Reading Level Analysis Results**
  { id: 'readingLevelAnalysisResults.difficultPassages', title: 'readingLevelAnalysisResults.difficultPassages' },
  { id: 'readingLevelAnalysisResults.usGradeLevelReadability', title: 'readingLevelAnalysisResults.usGradeLevelReadability' },
  // Add more headers as needed...
];

// Prepare CSV writer
const csvWriter = createObjectCsvWriter({
  path: path.join(__dirname, 'jobDescriptions.csv'),
  header: headers,
});

// Process data to fit into CSV
const records = jsonData.jobDescriptions.map((job) => {
  const row = {
    agentId: jsonData.agentId || '',
    titleCode: job.titleCode,
    variant: job.variant,
    classOfService: job.classOfService,
    workWeek: job.workWeek,
    bargainUnit: job.bargainUnit,
    classCode: job.classCode,
    salaryRange: job.salaryRange,
    workMonth: job.workMonth,
    deptCode: job.deptCode,
    url: job.url,
    name: job.name,
    // text: job.text, // Uncomment if you need the text field
    classification: JSON.stringify(job.classification),
    error: job.error,
    multiLevelJob: job.multiLevelJob,
    cscRevised: job.cscRevised,
    notes: job.notes,
  };

  // Handle occupationalCategory (may have multiple entries)
  if (job.occupationalCategory && job.occupationalCategory.length > 0) {
    // Assuming only one entry for simplicity
    const occCat = job.occupationalCategory[0];
    row['occupationalCategory.mainCategory'] = occCat.mainCategory;
    row['occupationalCategory.subCategory'] = occCat.subCategory;
  } else {
    row['occupationalCategory.mainCategory'] = '';
    row['occupationalCategory.subCategory'] = '';
  }

  // Handle degreeAnalysis
  const degreeAnalysis = job.degreeAnalysis || {};
  row['degreeAnalysis.needsCollegeDegree'] = degreeAnalysis.needsCollegeDegree;

  // Education Requirements (joining multiple entries)
  if (degreeAnalysis.educationRequirements && degreeAnalysis.educationRequirements.length > 0) {
    row['degreeAnalysis.educationRequirements'] = degreeAnalysis.educationRequirements
      .map((req) => `${req.type}: ${req.evidenceQuote}`)
      .join('\r\n|\r\n');
  } else {
    row['degreeAnalysis.educationRequirements'] = '';
  }

  // Degree Requirement Status
  const degreeRequirementStatus = degreeAnalysis.degreeRequirementStatus || {};
  row['degreeAnalysis.degreeRequirementStatus.isDegreeMandatory'] = degreeRequirementStatus.isDegreeMandatory;
  row['degreeAnalysis.degreeRequirementStatus.hasAlternativeQualifications'] = degreeRequirementStatus.hasAlternativeQualifications;
  row['degreeAnalysis.degreeRequirementStatus.alternativeQualifications'] = degreeRequirementStatus.alternativeQualifications
    ? degreeRequirementStatus.alternativeQualifications.join('\r\n|\r\n')
    : '';
  row['degreeAnalysis.degreeRequirementStatus.multipleQualificationPaths'] = degreeRequirementStatus.multipleQualificationPaths;
  row['degreeAnalysis.degreeRequirementStatus.isDegreeAbsolutelyRequired'] = degreeRequirementStatus.isDegreeAbsolutelyRequired;
  row['degreeAnalysis.degreeRequirementStatus.substitutionPossible'] = degreeRequirementStatus.substitutionPossible;

  // Mandatory Status Explanations
  const mandatoryStatusExplanations = degreeAnalysis.mandatoryStatusExplanations || {};
  row['degreeAnalysis.mandatoryStatusExplanations.degreeRequirementExplanation'] =
    mandatoryStatusExplanations.degreeRequirementExplanation || '';
  // NEW: Additional fields for mandatoryStatusExplanations
  row['degreeAnalysis.mandatoryStatusExplanations.bothTrueExplanation'] =
    mandatoryStatusExplanations.bothTrueExplanation || '';
  row['degreeAnalysis.mandatoryStatusExplanations.bothFalseExplanation'] =
    mandatoryStatusExplanations.bothFalseExplanation || '';

  // Professional License Requirement
  const professionalLicenseRequirement = degreeAnalysis.professionalLicenseRequirement || {};
  row['degreeAnalysis.professionalLicenseRequirement.isLicenseRequired'] = professionalLicenseRequirement.isLicenseRequired;
  row['degreeAnalysis.professionalLicenseRequirement.licenseDescription'] =
    professionalLicenseRequirement.licenseDescription || '';
  row['degreeAnalysis.professionalLicenseRequirement.issuingAuthority'] =
    professionalLicenseRequirement.issuingAuthority || '';
  row['degreeAnalysis.professionalLicenseRequirement.includesDegreeRequirement'] =
    professionalLicenseRequirement.includesDegreeRequirement;

  // Barriers to Non-Degree Applicants
  row['degreeAnalysis.barriersToNonDegreeApplicants'] = degreeAnalysis.barriersToNonDegreeApplicants || '';

  // **Handle Validation Checks (with reversed order)**
  const validationChecks = degreeAnalysis.validationChecks || {};

  // List of validation check fields in reversed order
  const validationCheckFields = [
    'cscRevisedConsistency',
    'requiredAlternativeExplanationConsistency',
    'barriersToNonDegreeApplicantsConsistency',
    'licenseIncludesDegreeRequirementConsistency',
    'alternativesIfTrueConsistency',
    'degreeMandatoryConsistency',
    'alternativeQualificationsConsistency',
    'educationRequirementsConsistency',
    'needsCollegeDegreeConsistency',
  ];

  // Loop through each validation check field and add to the row
  validationCheckFields.forEach((field) => {
    const value = validationChecks[field];
    row[`degreeAnalysis.validationChecks.${field}`] = value !== undefined ? value : '';
  });

  // **Handle Reading Level US Grade Analysis**
  const readingLevelUSGradeAnalysis = job.readingLevelUSGradeAnalysis || {};
  row['readingLevelUSGradeAnalysis.usGradeLevelReadability'] =
    readingLevelUSGradeAnalysis.usGradeLevelReadability || '';

  if (Array.isArray(readingLevelUSGradeAnalysis.difficultPassages)) {
    row['readingLevelUSGradeAnalysis.difficultPassages'] = readingLevelUSGradeAnalysis.difficultPassages.join(
      '\r\n|\r\n'
    );
  } else {
    row['readingLevelUSGradeAnalysis.difficultPassages'] = '';
  }

  // **Handle Reading Level US Grade Analysis P2**
  const readingLevelUSGradeAnalysisP2 = job.readingLevelUSGradeAnalysisP2 || {};
  row['readingLevelUSGradeAnalysisP2.usGradeLevelReadability'] =
    readingLevelUSGradeAnalysisP2.usGradeLevelReadability || '';

  if (Array.isArray(readingLevelUSGradeAnalysisP2.difficultPassages)) {
    row['readingLevelUSGradeAnalysisP2.difficultPassages'] = readingLevelUSGradeAnalysisP2.difficultPassages.join(
      '\r\n|\r\n'
    );
  } else {
    row['readingLevelUSGradeAnalysisP2.difficultPassages'] = '';
  }

  // **Handle Reading Level Analysis Results**
  const readingLevelAnalysisResults = job.readingLevelAnalysisResults || {};
  row['readingLevelAnalysisResults.usGradeLevelReadability'] =
    readingLevelAnalysisResults.usGradeLevelReadability || '';

  if (Array.isArray(readingLevelAnalysisResults.difficultPassages)) {
    row['readingLevelAnalysisResults.difficultPassages'] = readingLevelAnalysisResults.difficultPassages.join(
      '\r\n|\r\n'
    );
  } else {
    row['readingLevelAnalysisResults.difficultPassages'] = '';
  }

  // Add more fields as needed...

  return row;
});

// Write to CSV
csvWriter
  .writeRecords(records)
  .then(() => {
    console.log('CSV file was written successfully');
  })
  .catch((err) => {
    console.error('Error writing CSV file', err);
  });
