import { BaseProblemSolvingAgent } from "../../baseProblemSolvingAgent.js";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { IEngineConstants } from "../../constants.js";
import { WebPageVectorStore } from "../../vectorstore/webPage.js";

const DISABLE_LLM_FOR_DEBUG = false;

export class CreateSolutionsProcessor extends BaseProblemSolvingAgent {
  useLanguage: string | undefined = "English";

  renderCreateSystemMessage() {
    return new SystemMessage(
      `As an expert, you are tasked with creating innovative solution components for sub problems, considering the affected entities based on the <SolutionsToBaseYourSolutionComponentsOn> provided by the user.

      Instructions:
      1. Generate four simple solution components focused on the sub problem and its affected entities based on the <SolutionsToBaseYourSolutionComponentsOn>.
      2. Solution components should be specific, not just improving this or enhancing that.
      3. Solution components should be actionable, innovative, and equitable.
      4. Each solution component should include a short title, description, mainBenefitOfSolutionComponent, and mainObstacleToSolutionComponentAdoption.
      5. Limit the description of each solution component to six sentences maximum and the description should be accessible and free of technical jargon.
      6. Never re-create solution components listed under 'Already Created Solution Components'.
      ${this.useLanguage ? `7. Always output in ${this.useLanguage}` : ""}
      ${
        false && this.memory.customInstructions.createSolutions
          ? `
        Important Instructions (override the previous instructions if needed):${this.memory.customInstructions.createSolutions}

    `
          : ""
      }

      Always output your solution components in the following JSON format:
      [
        {
          "title": string,
          "description": string,
          "mainBenefitOfSolutionComponent": string,
          "mainObstacleToSolutionComponentAdoption": string
        }
      ]

      `
    );
  }
  async renderCreatePrompt(
    subProblemIndex: number,
    solutionsForInspiration: IEngineSolution[],
    alreadyCreatedSolutions: string | undefined = undefined
  ) {
    const messages = [
      this.renderCreateSystemMessage(),
      new HumanMessage(
        `
        ${this.renderProblemStatementSubProblemsAndEntities(
          subProblemIndex,
          false
        )}

        <SolutionsToBaseYourSolutionComponentsOn>
          ${solutionsForInspiration
            .map((s) => `# ${s.title}\n\n${s.description}`)
            .join("\n\n")}
        </SolutionsToBaseYourSolutionComponentsOn>

        ${
          alreadyCreatedSolutions
            ? `
          Previously Created Solution Components:
          ${alreadyCreatedSolutions}
        `
            : ``
        }

        Output in JSON Format:
       `
      ),
    ];

    return messages;
  }

  async createSolutions(
    subProblemIndex: number,
    solutionsForInspiration: IEngineSolution[],
    alreadyCreatedSolutions: string | undefined = undefined,
    stageName: PsMemoryStageTypes = "create-seed-solutions"
  ): Promise<IEngineSolution[]> {
    if (DISABLE_LLM_FOR_DEBUG) {
      this.logger.info("DISABLE_LLM_FOR_DEBUG is true, skipping LLM call");
      await this.renderCreatePrompt(
        subProblemIndex,
        solutionsForInspiration,
        alreadyCreatedSolutions
      );
      return [];
    } else {
      this.logger.info(`Calling LLM for sub problem ${subProblemIndex}`);
      let results = await this.callLLM(
        stageName,
        IEngineConstants.createSolutionsModel,
        await this.renderCreatePrompt(
          subProblemIndex,
          solutionsForInspiration,
          alreadyCreatedSolutions
        ),
        true,
        false,
        860
      );

      return results;
    }
  }

  async countTokensForString(text: string) {
    const tokenCountData = await this.chat!.getNumTokensFromMessages([
      new HumanMessage(text),
    ]);
    return tokenCountData.totalCount;
  }

  getRandomSolutions(
    subProblemIndex: number,
    alreadyCreatedSolutions: string | undefined
  ): IEngineSolution[] {
    this.logger.info(
      `Getting random solutions for sub problem ${subProblemIndex}`
    );
    const subProblemSolutions =
      this.memory.subProblems[subProblemIndex].solutionsFromSearch!;
    const problemStatementSolutions =
      this.memory.problemStatement.solutionsFromSearch!;

    this.logger.debug(
      `Lengths: ${subProblemSolutions!.length}, ${
        problemStatementSolutions!.length
      }`
    );

    const getFilteredSolutions = (
      solutions: IEngineSolution[],
      minEloScore: number
    ): IEngineSolution[] => {
      return solutions.filter((solution) => solution.eloRating! > minEloScore);
    };

    let selectedSolutions: IEngineSolution[];

    const randomValue = Math.random(); // Value between 0 and 1

    const numberOfSolutionComponents = 4;

    if (randomValue < 0.05) {
      selectedSolutions = this.getRandomItemsFromArray(
        problemStatementSolutions,
        numberOfSolutionComponents
      );
      this.logger.debug(
        `Selected solutions from problem statement: ${JSON.stringify(
          selectedSolutions.map((s) => `${s.title}: ${s.description}`),
          null,
          2
        )}`
      );
    } else if (
      (subProblemSolutions.length > 50 && randomValue < 0.5) ||
      randomValue < 0.7
    ) {
      selectedSolutions = this.getRandomItemsFromArray(
        getFilteredSolutions(subProblemSolutions, 1000),
        numberOfSolutionComponents
      );
      this.logger.debug(
        `Selected solutions from sub problem > 1000 Elo: ${JSON.stringify(
          selectedSolutions.map((s) => `${s.title}: ${s.description}`),
          null,
          2
        )}`
      );
    } else if (randomValue < 0.8 && subProblemSolutions.length > 50) {
      selectedSolutions = this.getRandomItemsFromArray(
        getFilteredSolutions(subProblemSolutions, 1100),
        numberOfSolutionComponents
      );
      this.logger.debug(
        `Selected solutions from sub problem > 1100 Elo: ${JSON.stringify(
          selectedSolutions.map((s) => `${s.title}: ${s.description}`),
          null,
          2
        )}`
      );
    } else {
      selectedSolutions = this.getRandomItemsFromArray(
        subProblemSolutions,
        numberOfSolutionComponents
      );
      this.logger.debug(
        `Selected solutions from sub problem: ${JSON.stringify(
          selectedSolutions.map((s) => `${s.title}: ${s.description}`),
          null,
          2
        )}`
      );
    }

    return selectedSolutions;
  }

  getRandomItemsFromArray<T>(array: T[], count: number): T[] {
    const shuffledArray = array.sort(() => 0.5 - Math.random());
    return shuffledArray.slice(0, count);
  }

  getRandomItemFromArray<T>(
    array: T[],
    useTopN: number | undefined = undefined
  ) {
    if (array && array.length > 0) {
      const randomIndex = Math.floor(
        Math.random() *
          (useTopN ? Math.min(useTopN, array.length) : array.length)
      );
      return array[randomIndex];
    } else {
      return "";
    }
  }

  async createAllSeedSolutions() {
    for (
      let subProblemIndex = 0;
      subProblemIndex <
      Math.min(this.memory.subProblems.length, IEngineConstants.maxSubProblems);
      subProblemIndex++
    ) {
      this.currentSubProblemIndex = subProblemIndex;
      this.logger.info(`Creating solutions for sub problem ${subProblemIndex}`);
      let solutions: IEngineSolution[] = [];

      // Create 60 solutions 4*15
      const solutionBatchCount = 15;
      for (let i = 0; i < solutionBatchCount; i++) {
        this.logger.info(
          `Creating solutions batch ${i + 1}/${solutionBatchCount}`
        );
        let alreadyCreatedSolutions;

        if (i > 0) {
          alreadyCreatedSolutions = solutions
            .map((solution) => solution.title)
            .join("\n");
        }

        const solutionsForInspiration = this.getRandomSolutions(
          subProblemIndex,
          alreadyCreatedSolutions
        );

        const newSolutions = await this.createSolutions(
          subProblemIndex,
          solutionsForInspiration,
          alreadyCreatedSolutions
        );

        this.logger.debug(
          `New Solution Components: ${JSON.stringify(newSolutions, null, 2)}`
        );

        solutions = solutions.concat(newSolutions);

        const seedUrls = [
          solutionsForInspiration[0].fromUrl!,
          solutionsForInspiration[1].fromUrl!,
          solutionsForInspiration[2].fromUrl!,
          solutionsForInspiration[3].fromUrl!,
        ];

        for (let solution of solutions) {
          solution.family = {
            seedUrls,
            gen: 0,
          };
        }
      }

      this.logger.debug("Created all solutions batches");

      if (!this.memory.subProblems[subProblemIndex].solutions) {
        this.memory.subProblems[subProblemIndex].solutions = {
          populations: [],
        };
      }

      this.memory.subProblems[subProblemIndex].solutions.populations.push(
        solutions
      );

      await this.saveMemory();
      this.logger.debug(`Saved memory for sub problem ${subProblemIndex}`);
    }
  }

  async process() {
    this.logger.info("Create Seed Solution Components Processor");
    super.process();

    this.chat = new ChatOpenAI({
      temperature: 0.25,
      maxTokens: IEngineConstants.createSolutionsModel.maxOutputTokens,
      modelName: IEngineConstants.createSolutionsModel.name,
      verbose: IEngineConstants.createSolutionsModel.verbose,
    });

    try {
      await this.createAllSeedSolutions();
    } catch (error: any) {
      this.logger.error("Error creating solutions");
      this.logger.error(error);
      this.logger.error(error.stack);
      throw error;
    }
  }
}
