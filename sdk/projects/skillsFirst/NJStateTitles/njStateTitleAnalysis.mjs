import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';
import cheerio from 'cheerio';
import 'dotenv/config';

// Create the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the JSON object
const jobSpecsPath = path.join(__dirname, 'nj_titles_state_1_prompt.json');
let jobSpecs = JSON.parse(await fs.readFile(jobSpecsPath, 'utf-8'));

async function getDegreeAnalysis(textContent, jobTitle, retries = 5) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
           messages: [
        {
          role: "system",
          content: `You are a great job description analyzer and thorough! Reply in form of a JSON feed with the structure \n\n\`\`\`json\n{\n  "higher ed degree possible for eligibility": true/false,\n  "higher ed degree required for eligibility": true/false\n}\n\`\`\``
        },
        {
          role: "user",
          content: `1. Does the job description include a higher education degree as a possible way to be eligible for the job?\n2. Does the job description include a higher education degree as a requirement to be eligible for the job?\nReply only with the JSON as provided in the System message. Be precise and thorough and do not make up informationthat do not exisit. \n\n${textContent}`
        }
      ],
      temperature: 0,
      max_tokens: 4096,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Extract JSON from the response
    const jsonString = response.choices[0].message.content.match(/```json\n([\s\S]*?)\n```/)[1];
    return JSON.parse(jsonString);
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      const retryAfter = error.response.headers['retry-after'] || 1;
      console.error(`Rate limit exceeded. Retrying in ${retryAfter} seconds...`);
      await sleep(retryAfter * 1000);
      return getDegreeAnalysis(textContent, jobTitle, retries - 1);
    } else {
      throw error;
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractTextFromHtml(htmlContent) {
  const $ = cheerio.load(htmlContent);
  return $('body').text().replace(/\s+/g, ' ').trim();
}

async function processJobSpecs() {
  const requestsPerMinute = 500; // Set a safe value below the limit
  const delayBetweenBatches = 60000 / requestsPerMinute;
  const batchSize = 50; // Number of concurrent requests in a batch

  for (let i = 0; i < jobSpecs.length; i += batchSize) {
    const batch = jobSpecs.slice(i, i + batchSize).filter(job => !(job.error && job.error === '404 Not Found'));
    const promises = batch.map(async job => {
      const filePath = path.join(__dirname, 'html', `${job['TITLE CODE']}.html`);
      try {
        const htmlContent = await fs.readFile(filePath, 'utf-8');
        const textContent = extractTextFromHtml(htmlContent);

        const degreeAnalysis = await getDegreeAnalysis(textContent, job['TITLE']);
        // Merge the new analysis with existing degree analysis
        job['degree analysis'] = {
          ...job['degree analysis'],
          ...degreeAnalysis
        };
        console.log(`${job['TITLE CODE']}.html processed`);
      } catch (err) {
        console.error(`Error processing ${filePath}: ${err}`);
      }
    });

    await Promise.all(promises);

    // Save the updated JSON object to the original file after processing each batch
    await fs.writeFile(jobSpecsPath, JSON.stringify(jobSpecs, null, 2));

    // Wait for the specified delay to avoid exceeding rate limits
    await sleep(delayBetweenBatches);
  }
}

processJobSpecs().catch(console.error);
