import { BasePairwiseRankingsProcessor } from "@policysynth/agents/basePairwiseRanking.js";
export declare class StageOneRanker extends BasePairwiseRankingsProcessor {
    rankInstructions: string | undefined;
    constructor(memory?: PsBaseMemoryData | undefined, progressFunction?: Function | undefined);
    voteOnPromptPair(index: number, promptPair: number[]): Promise<IEnginePairWiseVoteResults>;
    rankItems(itemsToRank: string[], rankInstructions?: string | undefined): Promise<string[]>;
}
//# sourceMappingURL=stageOneRanker.d.ts.map