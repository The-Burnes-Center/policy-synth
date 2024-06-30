import { PolicySynthOperationsAgent } from "./operationsAgent.js";
export declare abstract class OperationsPairwiseRankingsAgent extends PolicySynthOperationsAgent {
    maxModelTokensOut: number;
    modelTemperature: number;
    prompts: Record<number, number[][]>;
    allItems: Record<number, (PsEloRateable[] | string[]) | undefined>;
    INITIAL_ELO_RATING: number;
    K_FACTOR_INITIAL: number;
    K_FACTOR_MIN: number;
    NUM_COMPARISONS_FOR_MIN_K: number;
    maxNumberOfPrompts: number;
    numComparisons: Record<number, Record<number, number>>;
    KFactors: Record<number, Record<number, number>>;
    eloRatings: Record<number, Record<number, number>>;
    progressFunction: Function | undefined;
    updatePrefix: string;
    disableRelativeProgress: boolean;
    fisherYatesShuffle(array: any[]): any[];
    setupRankingPrompts(subProblemIndex: number, allItems: PsEloRateable[] | string[], maxPrompts?: number | undefined, updateFunction?: Function | undefined): void;
    abstract voteOnPromptPair(subProblemIndex: number, promptPair: number[], additionalData?: any): Promise<PsPairWiseVoteResults>;
    getResultsFromLLM(subProblemIndex: number, messages: PsModelMessage[], itemOneIndex: number, itemTwoIndex: number): Promise<{
        subProblemIndex: number;
        wonItemIndex: number | undefined;
        lostItemIndex: number | undefined;
    }>;
    getUpdatedKFactor(numComparisons: number): number;
    performPairwiseRanking(subProblemIndex: number, additionalData?: any): Promise<void>;
    getOrderedListOfItems(subProblemIndex: number, setEloRatings?: boolean, customEloRatingKey?: string | undefined): (string | PsEloRateable)[];
}
//# sourceMappingURL=operationsPairwiseRanking.d.ts.map