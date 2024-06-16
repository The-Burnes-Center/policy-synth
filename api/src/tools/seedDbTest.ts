import { initializeModels, models } from "../models/index.js";

import { PsAgentConnectorClass } from "../models/agentConnectorClass.js"; // Adjust the path as needed
import { User } from "../models/ypUser.js";
import { Group } from "../models/ypGroup.js";
import { PsAgentClass } from "../models/agentClass.js";
import { PsAgentConnector } from "../models/agentConnector.js";
import { PsAgent } from "../models/agent.js";
import { PsApiCost } from "../models/apiCost.js";
import { PsModelCost } from "../models/modelCost.js";
import { PsAgentAuditLog } from "../models/agentAuditLog.js";
import { PsAgentRegistry } from "../models/agentRegistry.js";
import { PsAiModel } from "../models/aiModel.js";
import { PsApiCostClass } from "../models/apiCostClass.js";
import { PsModelCostClass } from "../models/modelCostClass.js";
import { connectToDatabase } from "../models/sequelize.js";

await connectToDatabase();
await initializeModels();

let googleDocsQuestions = [
  {
    uniqueId: "name",
    text: "Name",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "googleDocsId",
    text: "Document ID",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "googleServiceAccount",
    text: "ServiceAccount JSON",
    type: "textArea",
    rows: 10,
    required: false,
  },
];

let discordQuestions = [
  {
    uniqueId: "name",
    text: "Name",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "discordBotToken",
    text: "Bot Token",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "discordChannelName",
    text: "Discord Channel Name",
    type: "textField",
    maxLength: 200,
    required: false,
  },
];

let yourPrioritiesQuestions = [
  {
    uniqueId: "name",
    text: "Name",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "user_id",
    text: "User ID",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "userKey",
    text: "User Key",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "group_id",
    text: "Group ID",
    type: "textField",
    maxLength: 200,
    required: false,
  },
];

let googleDocsConnectorClass = {
  name: "Google Docs",
  version: 1,
  user_id: 1,
  available: true,
  configuration: {
    description: "Connector for Google Docs",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/339c8468-eb12-4167-a719-606bde321dc2.png",
    iconName: "docs",
    questions: googleDocsQuestions,
  },
} as PsAgentConnectorClassAttributes;

let discordMarketResearchBotConnectorClass = {
  name: "Discord Bot",
  version: 1,
  user_id: 1,
  available: true,
  configuration: {
    description: "Connector for Discord Mark+et Research Bot",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/7336a9fb-7512-4c31-ae77-0bb7c5a99b97.png",
    iconName: "discord",
    questions: discordQuestions,
  },
} as PsAgentConnectorClassAttributes;

let yourPrioritiesConnectorClass = {
  name: "Your Priorities",
  version: 1,
  user_id: 1,
  available: true,
  configuration: {
    description: "Connector for Your Priorities",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/0a10f369-185b-40dc-802a-c2d78e6aab6d.png",
    iconName: "yourPriorities",
    questions: yourPrioritiesQuestions,
  },
} as PsAgentConnectorClassAttributes;

let allOurIdeasConnectorClass = {
  name: "All Our Ideas",
  version: 1,
  user_id: 1,
  available: true,
  configuration: {
    description: "Connector for All Our Ideas",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/30582554-20a7-4de5-87a4-4540dc2030b4.png",
    iconName: "allOurIdeas",
    questions: [] as any,
  },
} as PsAgentConnectorClassAttributes;

let googleSheetsConnectorClass = {
  name: "Google Sheets",
  version: 1,
  user_id: 1,
  available: true,
  configuration: {
    description: "Connector for All ",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/1187aee2-39e8-48b2-afa2-0aba91c0ced0.png",
    iconName: "googleSheets",
    questions: [] as any,
  },
} as PsAgentConnectorClassAttributes;

await User.create({ email: "robert@citizens.is", name: "Robert" });
await Group.create({
  name: "Citizens",
  user_id: 1,
  configuration: {
    aiModelAccess: [],
  },
});

const googleDocsConnectorClassInst = await PsAgentConnectorClass.create(
  googleDocsConnectorClass
);

const discordMarketResearchBotConnectorInst =
  await PsAgentConnectorClass.create(discordMarketResearchBotConnectorClass);

const yourPrioritiesConnectorClassInst = await PsAgentConnectorClass.create(
  yourPrioritiesConnectorClass
);

const allOurIdeasConnectorClassInst = await PsAgentConnectorClass.create(
  allOurIdeasConnectorClass
);

const googleSheetsConnectorClassInst = await PsAgentConnectorClass.create(
  googleSheetsConnectorClass
);

/////////////////////

let rootCausesQuestions = [
  {
    uniqueId: "name",
    text: "Name",
    type: "textField",
    maxLength: 200,
    required: false,
  },
  {
    uniqueId: "problemStatement",
    text: "Problem Statement",
    type: "textArea",
    rows: 5,
    maxLength: 2500,
    required: false,
  },
  {
    uniqueId: "rankingInstructions",
    text: "Ranking Instructions",
    type: "textArea",
    rows: 3,
    maxLength: 1000,
    required: false,
  },
  {
    uniqueId: "howManySearchQueries",
    text: "How many search queries",
    type: "textField",
    maxLength: 200,
    subType: "number",
    required: false,
  },
  {
    uniqueId: "percentToUseSearchQueries",
    text: "% of top search queries to use",
    type: "textField",
    maxLength: 200,
    subType: "number",
    required: false,
  },
  {
    uniqueId: "percentToUseSearchResults",
    text: "% of top search results to use",
    type: "textField",
    maxLength: 200,
    subType: "number",
    required: false,
  },
];

let smarterCrowdsourcingAgentClass = {
  version: 1,
  name: "Smarter Crowdsourcing Agent",
  user_id: 1,
  available: true,
  configuration: {
    description: "An agent for running the Smarter Crowdsourcing process",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/6d4368ce-ecaf-41ab-abb3-65ceadbdb2a6.png",
    iconName: "smarter_crowdsourcing",
    assistantSystemInstructions: "Explain the process",
    capabilities: ["research", "analysis"],
    inputJsonInterface: "{}",
    outputJsonInterface: "{}",
    questions: rootCausesQuestions,
    supportedConnectors: [
      googleDocsConnectorClass,
      discordMarketResearchBotConnectorClass,
    ],
  },
} as PsAgentClassAttributes;

let rootCausesSubAgentClass = {
  version: 1,
  user_id: 1,
  available: true,
  name: "Root Causes Research",
  configuration: {
    description: "Root causes research sub-agent",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/08d596cf-290e-4a1b-abff-74a305e3dbbb.png",
    iconName: "root_causes_research",
    assistantSystemInstructions: "Conduct root causes research",
    capabilities: ["research", "analysis"],
    inputJsonInterface: "{}",
    outputJsonInterface: "{}",
    questions: rootCausesQuestions,
    supportedConnectors: [
      googleDocsConnectorClass,
      discordMarketResearchBotConnectorClass,
    ],
  },
} as PsAgentClassAttributes;

let solutionsSubAgentClass = {
  version: 1,
  user_id: 1,
  available: true,
  name: "Solutions Search",
  configuration: {
    description: "Sub-agent for solutions search",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/6d4368ce-ecaf-41ab-abb3-65ceadbdb2a6.png",
    iconName: "solutions_search",
    assistantSystemInstructions: "Conduct solutions search",
    capabilities: ["research", "analysis"],
    inputJsonInterface: "{}",
    outputJsonInterface: "{}",
    questions: rootCausesQuestions,
    supportedConnectors: [
      googleDocsConnectorClass,
      discordMarketResearchBotConnectorClass,
    ],
  },
} as PsAgentClassAttributes;

let policyGenerationSubAgentClass = {
  user_id: 1,
  available: true,
  version: 1,
  name: "Generate Policies",
  configuration: {
    description: "Sub-agent for generating policies",
    imageUrl:
      "https://aoi-storage-production.citizens.is/ypGenAi/community/1/b70ab7b3-7235-46b6-a3af-1a16eccee784.png",
    iconName: "generate_policies",
    assistantSystemInstructions: "Generate policies",
    capabilities: ["research", "analysis", "policyGeneration"],
    inputJsonInterface: "{}",
    outputJsonInterface: "{}",
    questions: rootCausesQuestions,
    supportedConnectors: [
      googleDocsConnectorClass,
      discordMarketResearchBotConnectorClass,
    ],
  },
} as PsAgentClassAttributes;

const smarterCrowdsourcingAgentClassInst = (await PsAgentClass.create(
  smarterCrowdsourcingAgentClass
)) as PsAgentClass;

const rootCausesSubAgentClassInst = (await PsAgentClass.create(
  rootCausesSubAgentClass
)) as PsAgentClass;

const solutionsSubAgentClassInst = (await PsAgentClass.create(
  solutionsSubAgentClass
)) as PsAgentClass;

const policyGenerationSubAgentClassInst = (await PsAgentClass.create(
  policyGenerationSubAgentClass
)) as PsAgentClass;

/////////////////////

let connectorGoogleDocsForRootCauses = {
  class_id: googleDocsConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Root Causes Summary",
    googleDocsId: "1sdfjkl3j4klj3",
    googleServiceAccount: "...",
    graphPosX: -5,
    graphPosY: 370,
    permissionNeeded: "read" as any,
  },
};

let connectorGoogleSheetsForRootCauses = {
  class_id: googleSheetsConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Root Causes Rows",
    googleDocsId: "1sdfjkl3j4klj3",
    googleServiceAccount: "...",
    graphPosX: 230,
    graphPosY: 540,
    permissionNeeded: "read" as any,
  },
};

let connectorGoogleSheetsForSolutions = {
  class_id: googleSheetsConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Solutions Rows",
    googleDocsId: "1sdfjkl3j4klj3",
    googleServiceAccount: "...",
    graphPosX: 230,
    graphPosY: 1340,
    permissionNeeded: "read" as any,
  },
};

let connectorGoogleSheetsForPolicies = {
  class_id: googleSheetsConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Policies Rows",
    googleDocsId: "1sdfjkl3j4klj3",
    googleServiceAccount: "...",
    graphPosX: 230,
    graphPosY: 2100,
    permissionNeeded: "read" as any,
  },
};

let connectorDiscordRootCauses = {
  class_id: discordMarketResearchBotConnectorInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Causes Notifications",
    discordBotToken: "dasdsadsdsa",
    discordChannelName: "root-causes-agent",
    graphPosX: 480,
    graphPosY: 300,
    permissionNeeded: "readWrite" as any,
  },
};

let connectorDiscordSolutions = {
  class_id: discordMarketResearchBotConnectorInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Solutions Notifications",
    discordBotToken: "dasdsadsdsa",
    discordChannelName: "solutions-agent",
    graphPosX: 480,
    graphPosY: 1100,
    permissionNeeded: "readWrite" as any,
  },
};

let connectorDiscordPolicies = {
  class_id: discordMarketResearchBotConnectorInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Notifications & Remote Control",
    discordBotToken: "dasdsadsdsa",
    discordChannelName: "policies-agent",
    graphPosX: 480,
    graphPosY: 1850,
    permissionNeeded: "readWrite" as any,
  },
};

let connectorYourPrioritiesSolutions = {
  class_id: yourPrioritiesConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Human Solutions",
    user_id: "planxbot@hugsmidi.is",
    userKey: "12345",
    group_id: "31298",
    graphPosX: -5,
    graphPosY: 1030,
    permissionNeeded: "readWrite" as any,
  },
};

let connectorYourPrioritiesPolicies = {
  class_id: yourPrioritiesConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Policy Ideas Deliberation",
    user_id: "planxbot@hugsmidi.is",
    userKey: "12345",
    group_id: "31299",
    graphPosX: -10,
    graphPosY: 1800,
    permissionNeeded: "readWrite" as any,
  },
};

let connectorAllOurIdeasRootCauses = {
  class_id: allOurIdeasConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Rank Root Causes",
    user_id: "planxbot@hugsmidi.is",
    userKey: "12345",
    group_id: "31299",
    graphPosX: 230,
    graphPosY: 780,
    permissionNeeded: "readWrite" as any,
  },
};

let connectorAllOurIdeasSolutions = {
  class_id: allOurIdeasConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Rank Solutions",
    user_id: "planxbot@hugsmidi.is",
    userKey: "12345",
    group_id: "31299",
    graphPosX: 230,
    graphPosY: 1580,
    permissionNeeded: "readWrite" as any,
  },
};

let connectorAllOurIdeasPolicies = {
  class_id: allOurIdeasConnectorClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Rank Policies",
    user_id: "planxbot@hugsmidi.is",
    userKey: "12345",
    group_id: "31299",
    graphPosX: 230,
    graphPosY: 2330,
    permissionNeeded: "readWrite" as any,
  },
};

console.log(
  `hello: ${JSON.stringify(
    connectorGoogleDocsForRootCauses,
    null,
    2
  )} ----------------------------------------`
);

const connectorGoogleDocsForRootCausesInst = await PsAgentConnector.create(
  connectorGoogleDocsForRootCauses
);

console.log(
  `hello2: ${JSON.stringify(
    connectorGoogleDocsForRootCausesInst,
    null,
    2
  )} XXXXXXXXXXXXXXXXxx`
);

const connectorGoogleSheetsForRootCausesInst = await PsAgentConnector.create(
  connectorGoogleSheetsForRootCauses
);
const connectorGoogleSheetsForSolutionsInst = await PsAgentConnector.create(
  connectorGoogleSheetsForSolutions
);
const connectorGoogleSheetsForPoliciesInst = await PsAgentConnector.create(
  connectorGoogleSheetsForPolicies
);
const connectorDiscordRootCausesInst = await PsAgentConnector.create(
  connectorDiscordRootCauses
);
const connectorDiscordSolutionsInst = await PsAgentConnector.create(
  connectorDiscordSolutions
);
const connectorDiscordPoliciesInst = await PsAgentConnector.create(
  connectorDiscordPolicies
);
const connectorYourPrioritiesSolutionsInst = await PsAgentConnector.create(
  connectorYourPrioritiesSolutions
);
const connectorYourPrioritiesPoliciesInst = await PsAgentConnector.create(
  connectorYourPrioritiesPolicies
);
const connectorAllOurIdeasRootCausesInst = await PsAgentConnector.create(
  connectorAllOurIdeasRootCauses
);
const connectorAllOurIdeasSolutionsInst = await PsAgentConnector.create(
  connectorAllOurIdeasSolutions
);
const connectorAllOurIdeasPoliciesInst = await PsAgentConnector.create(
  connectorAllOurIdeasPolicies
);

/////////////////////

let subAgent1 = {
  class_id: rootCausesSubAgentClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Unlocking Literacy",
    howManySearchQueries: 10,
    percentToUseSearchQueries: 50,
    percentToUseSearchResults: 50,
    graphPosX: 200,
    graphPosY: 250,
  },
  parent_agent_id: 1,
} as PsAgentAttributes;

let subAgent2 = {
  class_id: solutionsSubAgentClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Unlocking Literacy",
    howManySearchQueries: 10,
    percentToUseSearchQueries: 50,
    percentToUseSearchResults: 50,
    graphPosX: 200,
    graphPosY: 1050,
  },
  parent_agent_id: 1,
} as PsAgentAttributes;

let subAgent3 = {
  class_id: policyGenerationSubAgentClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    name: "Smarter Crowdsourcing",
    graphPosX: 200,
    graphPosY: 1810,
  },
  parent_agent_id: 1,
} as PsAgentAttributes;

let smarterCrowdsourcingAgent = {
  class_id: smarterCrowdsourcingAgentClassInst.dataValues.id,
  user_id: 1,
  group_id: 1,
  configuration: {
    graphPosX: 0,
    graphPosY: 0,
    name: "Smarter Crowdsourcing",
  },
} as PsAgentAttributes;

function getAllMethods(obj: any): string[] {
  let props = new Set<string>();
  let currentObj = obj;

  while (currentObj) {
    Object.getOwnPropertyNames(currentObj).forEach((name) => {
      try {
        if (typeof currentObj[name] === "function") {
          props.add(name);
        }
      } catch (e) {
        // Handle or log the error if necessary
      }
    });
    currentObj = Object.getPrototypeOf(currentObj);
  }

  return [...props];
}

const smarterCrowdsourcingAgentInstance = await PsAgent.create(
  smarterCrowdsourcingAgent
);
const subAgent1Instance = await PsAgent.create(subAgent1);
const subAgent2Instance = await PsAgent.create(subAgent2);
const subAgent3Instance = await PsAgent.create(subAgent3);

const methods = getAllMethods(smarterCrowdsourcingAgentInstance);
console.log(methods);

// Adding through associations for connectors
await smarterCrowdsourcingAgentInstance.addSubAgents([
  subAgent1Instance,
  subAgent2Instance,
  subAgent3Instance,
]);

await subAgent1Instance.addConnectors([
  connectorGoogleDocsForRootCausesInst,
  connectorDiscordRootCausesInst,
  connectorAllOurIdeasRootCausesInst,
  connectorGoogleSheetsForRootCausesInst,
]);

await subAgent2Instance.addConnectors([
  connectorGoogleSheetsForSolutionsInst,
  connectorDiscordSolutionsInst,
  connectorYourPrioritiesSolutionsInst,
  connectorAllOurIdeasSolutionsInst,
]);

await subAgent3Instance.addConnectors([
  connectorYourPrioritiesPoliciesInst,
  connectorDiscordPoliciesInst,
  connectorGoogleSheetsForPoliciesInst,
  connectorAllOurIdeasPoliciesInst,
]);
