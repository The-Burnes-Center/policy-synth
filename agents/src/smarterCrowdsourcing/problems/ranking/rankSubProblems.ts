import { BaseSmarterCrowdsourcingPairwiseAgent } from "../../pairwiseAgent.js";

export class RankSubProblemsProcessor extends BaseSmarterCrowdsourcingPairwiseAgent {
  subProblemIndex = 0;

  async voteOnPromptPair(
    subProblemIndex: number,
    promptPair: number[]
  ): Promise<PsPairWiseVoteResults> {
    const itemOneIndex = promptPair[0];
    const itemTwoIndex = promptPair[1];

    const itemOne = this.allItems![subProblemIndex]![itemOneIndex] as PsSubProblem;
    const itemTwo = this.allItems![subProblemIndex]![itemTwoIndex] as PsSubProblem;

    const messages = [
      this.createSystemMessage(
        `
        You are an AI expert trained to analyse complex problem statements and associated sub-problems to determine their relevance.

        Instructions:
        1. You will be presented with a problem statement and two associated sub-problems. These will be marked as "Sub Problem One" and "Sub Problem Two".
        2. Analyse, compare, and rank these two sub-problems in relation to the main problem statement to determine which is more relevant and important.
        3. Output your decision as either "One", "Two" or "Neither". An explanation is not required.

        ${
          this.memory.customInstructions.rankSubProblems
            ? `
          Important Instructions: ${this.memory.customInstructions.rankSubProblems}
          `
            : ""
        }

        Let's think step by step.
        `
      ),
      this.createHumanMessage(
        `
        ${this.renderProblemStatement()}

        Sub-Problems for Consideration:

        Sub Problem One:
        ${itemOne.title}
        ${itemOne.description}
        ${itemOne.whyIsSubProblemImportant}

        Sub Problem Two:
        ${itemTwo.title}
        ${itemTwo.description}
        ${itemTwo.whyIsSubProblemImportant}

        The Most Relevant Sub-Problem Is:
        `
      ),
    ];

    return await this.getResultsFromLLM(
      subProblemIndex,
      messages,
      itemOneIndex,
      itemTwoIndex
    );
  }


 async process() {
    this.logger.info("Rank Sub Problems Processor");
    super.process();

    let maxPrompts;

    if (this.memory.subProblems.length > 100) {
      maxPrompts = this.memory.subProblems.length*this.subProblemsRankingMinNumberOfMatches;
    }
    this.setupRankingPrompts(-1, this.memory.subProblems, maxPrompts);

    await this.performPairwiseRanking(-1);

    this.logger.debug(`Sub problems before ranking: ${JSON.stringify(this.memory.subProblems)}`);
    this.memory.subProblems = this.getOrderedListOfItems(-1,true) as PsSubProblem[];
    this.logger.debug(`Sub problems after ranking: ${JSON.stringify(this.memory.subProblems)}`);

    await this.saveMemory();
  }
}
