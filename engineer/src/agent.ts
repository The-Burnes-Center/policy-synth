import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PolicySynthAgentBase } from "@policysynth/agents/baseAgent.js";
import { IEngineConstants } from "@policysynth/agents/constants.js";
import { PsEngineerInitialAnalyzer } from "./analyze/initialAnalyzer.js";
import { PsEngineerExamplesWebResearchAgent } from "./webResearch/examplesWebResearch.js";
import { PsEngineerDocsWebResearchAgent } from "./webResearch/documentationWebResearch.js";
import { PsEngineerProgrammingAgent } from "./programming/programmingAgent.js";
import fs from "fs";
import path from "path";

export class PSEngineerAgent extends PolicySynthAgentBase {
  override memory: PsEngineerMemoryData;

  constructor() {
    super();
    this.memory = {
      actionLog: [],
      workspaceFolder: "/home/robert/Scratch/psAgentsTest",
      taskTitle:
        "Integrate LLM Abstractions for Claude Opus and Google Gemini into LangChain TS",
      taskDescription:
        "Our current system utilizes LangChain TS for modeling abstraction and is configured to support OpenAI's models, accessible both directly and through Azure. The goal is to expand this capability by integrating abstractions for Claude Opus and Google Gemini, with a design that allows easy addition of other models in the future.",
      taskInstructions: `1. Implement the new abstractions within the PolicySynthAgentBase class.
      2. Use the modelName parameter to determine the appropriate abstraction for each model.
      3. Set default configurations so that no modifications are needed in the existing codebase that utilizes the base agent class. This should ensure backward compatibility.`,
      stages: PSEngineerAgent.emptyDefaultStages,
    } as unknown as PsEngineerMemoryData;
  }

  async doWebResearch() {
    const exampleResearcher = new PsEngineerExamplesWebResearchAgent(
      this.memory
    );
    const docsResearcher = new PsEngineerDocsWebResearchAgent(this.memory);

    const [exampleContextItems, docsContextItems] = await Promise.all([
      exampleResearcher.doWebResearch() as Promise<string[]>,
      docsResearcher.doWebResearch() as Promise<string[]>,
    ]);

    this.memory.exampleContextItems = exampleContextItems;
    this.memory.docsContextItems = docsContextItems;

    this.memory.actionLog.push("Web research completed");
  }

  async readAllTypescriptFileNames(folderPath: string): Promise<string[]> {
    const files = fs.readdirSync(folderPath);

    const allFiles: string[] = [];

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory() && file !== "ts-out" && file !== "node_modules") {
        const subFiles = await this.readAllTypescriptFileNames(filePath);
        allFiles.push(...subFiles);
      } else if (path.extname(file) === ".ts") {
        allFiles.push(filePath);
      }
    }

    return allFiles;
  }

  async run() {
    this.memory.allTypescriptSrcFiles = await this.readAllTypescriptFileNames(
      this.memory.workspaceFolder
    );

    const analyzeAgent = new PsEngineerInitialAnalyzer(this.memory);
    await analyzeAgent.analyzeAndSetup();

    if (false && this.memory.needsDocumentionsAndExamples === true) {
      await this.doWebResearch();
    }

    const programmer = new PsEngineerProgrammingAgent(this.memory);
    await programmer.implementTask();
  }
}