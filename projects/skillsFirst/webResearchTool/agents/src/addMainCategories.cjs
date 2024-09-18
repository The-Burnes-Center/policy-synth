// addMainCategories.js

const fs = require('fs');
const path = require('path');

/**
 * Reads the occupationalCategories.json file and builds a mapping from OG codes to main category IDs.
 *
 * @param {string} jsonFilePath - Path to the occupationalCategories.json file.
 * @returns {Object} Mapping from OG codes to main category IDs.
 */
function getOccupationalCategoryMapping(jsonFilePath) {
  let occupationalCategories;

  try {
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    occupationalCategories = JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading or parsing occupationalCategories.json:', error);
    throw error;
  }

  const ogCodeToMainCategoryId = {};

  occupationalCategories.forEach((mainCategory) => {
    const mainCategoryId = mainCategory.id; // e.g., "occp_agriculture"

    if (!mainCategory.subCategories || !Array.isArray(mainCategory.subCategories)) {
      console.warn(`Warning: No subCategories found for mainCategory ID '${mainCategoryId}'.`);
      return;
    }

    mainCategory.subCategories.forEach((subCategory) => {
      const ogCode = subCategory.id; // e.g., "OG40"

      if (ogCode) {
        ogCodeToMainCategoryId[ogCode.toUpperCase()] = mainCategoryId;
      } else {
        console.warn(`Warning: SubCategory without an 'id' found under mainCategory ID '${mainCategoryId}'.`);
      }
    });
  });

  return ogCodeToMainCategoryId;
}

/**
 * Transforms the occupationalCategory array from strings to objects containing mainCategory and subCategory.
 *
 * @param {Object[]} jobDescriptions - Array of job description objects.
 * @param {Object} ogCodeToMainCategoryId - Mapping from OG codes to main category IDs.
 * @returns {Object[]} Updated array of job description objects.
 */
function transformOccupationalCategories(jobDescriptions, ogCodeToMainCategoryId) {
  return jobDescriptions.map((job) => {
    if (!job.occupationalCategory || !Array.isArray(job.occupationalCategory)) {
      console.warn(`Warning: Job with titleCode '${job.titleCode}' does not have a valid 'occupationalCategory' array.`);
      return { ...job, occupationalCategory: [] };
    }

    const transformedOccupationalCategories = job.occupationalCategory.map((ogCode) => {
      const upperOgCode = ogCode.toUpperCase();
      const mainCategoryId = ogCodeToMainCategoryId[upperOgCode];

      if (mainCategoryId) {
        return {
          mainCategory: mainCategoryId,
          subCategory: ogCode,
        };
      } else {
        console.warn(`Warning: OG code '${ogCode}' not found in mapping for job with titleCode '${job.titleCode}'.`);
        return {
          mainCategory: null,
          subCategory: ogCode,
        };
      }
    });

    return {
      ...job,
      occupationalCategory: transformedOccupationalCategories,
    };
  });
}

/**
 * Main function to orchestrate the update.
 */
function main() {
  // Define paths to your files
  const jsonFilePath = path.resolve(__dirname, './stateTitlesNJJson.json');
  const occupationalCategoriesJsonPath = path.resolve(__dirname, './occupationalCategories.json');

  // Check if occupationalCategories.json exists
  if (!fs.existsSync(occupationalCategoriesJsonPath)) {
    console.error(`Error: File not found at path '${occupationalCategoriesJsonPath}'. Please ensure the file exists.`);
    process.exit(1);
  }

  // Check if stateTitlesNJJson.json exists
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`Error: File not found at path '${jsonFilePath}'. Please ensure the file exists.`);
    process.exit(1);
  }

  // Step 1: Build the OG code to main category ID mapping
  const ogCodeToMainCategoryId = getOccupationalCategoryMapping(occupationalCategoriesJsonPath);

  // Step 2: Read the job descriptions JSON file
  let jobDescriptions;
  try {
    const jobDescriptionsData = fs.readFileSync(jsonFilePath, 'utf-8');
    jobDescriptions = JSON.parse(jobDescriptionsData);
  } catch (error) {
    console.error('Error reading or parsing stateTitlesNJJson.json:', error);
    throw error;
  }

  // Step 3: Transform the occupationalCategory array
  const updatedJobDescriptions = transformOccupationalCategories(jobDescriptions, ogCodeToMainCategoryId);

  // Step 4: Write the updated job descriptions back to the JSON file
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(updatedJobDescriptions, null, 2), 'utf-8');
    console.log('Job descriptions updated successfully.');
  } catch (error) {
    console.error('Error writing to stateTitlesNJJson.json:', error);
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
}