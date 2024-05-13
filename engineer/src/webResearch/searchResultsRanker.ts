
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BasePairwiseRankingsProcessor } from "@policysynth/agents/basePairwiseRanking.js";
import { IEngineConstants } from "@policysynth/agents/constants.js";

export class SearchResultsRanker extends BasePairwiseRankingsProcessor {
  instructions: string | undefined;
  override memory: PsEngineerMemoryData;

  constructor(
    memory: PsEngineerMemoryData,
    progressFunction: Function | undefined = undefined
  ) {
    super(undefined as any, memory);
    this.memory = memory;
    this.progressFunction = progressFunction;
  }

  async voteOnPromptPair(
    index: number,
    promptPair: number[]
  ): Promise<IEnginePairWiseVoteResults> {
    const itemOneIndex = promptPair[0];
    const itemTwoIndex = promptPair[1];

    const itemOne = this.allItems![index]![
      itemOneIndex
    ] as IEngineSearchResultItem;
    const itemTwo = this.allItems![index]![
      itemTwoIndex
    ] as IEngineSearchResultItem;

    console.log(`itemOne: ${JSON.stringify(itemOne, null, 2)}`);
    console.log(`itemTwo: ${JSON.stringify(itemTwo, null, 2)}`);

    const messages = [
      new SystemMessage(
        `
        You are an AI expert trained to rank search results based on their relevance to the user instructions.

        Instructions:
        1. You will receive a research question.
        2. You will also see two web search results, marked as "Search Result One" and "Search Result Two".
        3. Your task is to analyze, compare, and rank these search results based on their relevance to the user instructions.
        4. Output your decision as either "One", "Two" or "Neither". No explanation is required.
        5. Let's think step by step.
        `
      ),
      new HumanMessage(
        `
        User instructions: ${this.instructions}

        Overall task title:
        ${this.memory.taskTitle}

        Overall task description:
        ${this.memory.taskDescription}

        Overall task instructions: ${this.memory.taskInstructions}

        ${
          this.memory.likelyRelevantNpmPackageDependencies?.length > 0
            ? `Likely relevant npm dependencies:\n${this.memory.likelyRelevantNpmPackageDependencies.join(
                `\n`
              )}`
            : ``
        }

        Search Results to Rank:

        Search Results One:
        ${itemOne.title}
        ${itemOne.description}
        ${itemOne.url}

        Search Results Two:
        ${itemTwo.title}
        ${itemTwo.description}
        ${itemTwo.url}

        The Most Relevant Search Results Is:
       `
      ),
    ];

    return await this.getResultsFromLLM(
      index,
      "rank-search-results",
      IEngineConstants.searchResultsRankingsModel,
      messages,
      itemOneIndex,
      itemTwoIndex
    );
  }

  async rankSearchResults(
    queriesToRank: IEngineSearchResultItem[],
    instructions: string,
    maxPrompts = 150
  ) {
    this.instructions = instructions;

    this.chat = new ChatOpenAI({
      temperature: IEngineConstants.searchQueryRankingsModel.temperature,
      maxTokens: IEngineConstants.searchQueryRankingsModel.maxOutputTokens,
      modelName: "gpt-4o",
      verbose: IEngineConstants.searchQueryRankingsModel.verbose,
    });

    this.setupRankingPrompts(-1, queriesToRank, maxPrompts, this.progressFunction);
    await this.performPairwiseRanking(-1);
    return this.getOrderedListOfItems(-1) as IEngineSearchResultItem[];
  }
}
