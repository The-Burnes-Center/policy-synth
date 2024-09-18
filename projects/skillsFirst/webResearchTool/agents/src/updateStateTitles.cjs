// updateStateTitles.js

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Reads the CSV file and returns a Map of CSV records keyed by titleCode.
 *
 * @param {string} csvFilePath
 * @returns {Promise<Map<string, CSVRecord>>}
 */
function readCSVFile(csvFilePath) {
  return new Promise((resolve, reject) => {
    const records = new Map();

    fs.createReadStream(csvFilePath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.toLowerCase().replace(/[^a-z0-9]/g, ''),
      }))
      .on('data', (data) => {
        // Normalize and extract the required fields
        const titleCode = data['titlecode'] ? data['titlecode'].trim() : '';
        const multiLevelJob = data['multileveljob'] ? data['multileveljob'].trim().toLowerCase() : '';
        const cscRevised = data['cscrevised'] ? data['cscrevised'].trim().toLowerCase() : '';
        const notes = data['notes'] ? data['notes'].trim() : '';
        const occupationalCategory = data['occupationalsubcategoryid'] ? data['occupationalsubcategoryid'].trim() : '';

        if (titleCode) {
          records.set(titleCode, {
            multiLevelJob,
            cscRevised,
            notes,
            occupationalCategory
          });
        } else {
          console.warn('Warning: Missing Title Code in record:', data);
        }
      })
      .on('end', () => {
        resolve(records);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Reads the job descriptions from the JSON file.
 *
 * @param {string} jsonFilePath
 * @returns {Object[]}
 */
function readJobDescriptions(jsonFilePath) {
  const data = fs.readFileSync(jsonFilePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Updates the job descriptions using data from the CSV records.
 *
 * @param {Object[]} jobDescriptions
 * @param {Map<string, CSVRecord>} csvData
 * @returns {Object[]}
 */
function updateJobDescriptions(jobDescriptions, csvData) {
  return jobDescriptions.map((job) => {
    const csvRecord = csvData.get(job.titleCode);
    if (csvRecord) {
      return {
        ...job,
        multiLevelJob: ['yes', 'true'].includes(csvRecord.multiLevelJob),
        cscRevised: ['yes', 'true'].includes(csvRecord.cscRevised),
        notes: csvRecord.notes || job.notes,
        occupationalCategory: parseOccupationalCategory(csvRecord.occupationalCategory),
      };
    }
    return job;
  });
}

/**
 * Parses the occupational category string into an array.
 *
 * @param {string} categoryStr
 * @returns {string[]}
 */
function parseOccupationalCategory(categoryStr) {
  // Split the IDs and trim whitespace
  return categoryStr.split(',').map((id) => id.trim()).filter((id) => id);
}

/**
 * Writes the updated job descriptions back to the JSON file.
 *
 * @param {string} jsonFilePath
 * @param {Object[]} jobDescriptions
 */
function writeJobDescriptions(jsonFilePath, jobDescriptions) {
  fs.writeFileSync(jsonFilePath, JSON.stringify(jobDescriptions, null, 2), 'utf-8');
}

/**
 * Main function to orchestrate the update.
 */
(async function main() {
  const csvFilePath = path.resolve(__dirname, './master_sheet_skillsbased_StateTitle_Analysis.csv');
  const jsonFilePath = path.resolve(__dirname, './stateTitlesNJJson.json');

  try {
    // Read CSV data
    const csvData = await readCSVFile(csvFilePath);

    // Read job descriptions from JSON file
    const jobDescriptions = readJobDescriptions(jsonFilePath);

    // Update job descriptions
    const updatedJobDescriptions = updateJobDescriptions(jobDescriptions, csvData);

    // Write the updated job descriptions back to the JSON file
    writeJobDescriptions(jsonFilePath, updatedJobDescriptions);

    console.log('Job descriptions updated successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
})();