import { BaseSmarterCrowdsourcingPairwiseAgent } from "../../pairwiseAgent.js";
export declare class RankProsConsProcessor extends BaseSmarterCrowdsourcingPairwiseAgent {
    voteOnPromptPair(subProblemIndex: number, promptPair: number[], additionalData: {
        solution: string;
        prosOrCons: "pros" | "cons";
        subProblemIndex: number;
    }): Promise<PsPairWiseVoteResults>;
    convertProsConsToObjects(prosCons: string[]): PsProCon[];
    process(): Promise<void>;
    processSubProblem(subProblem: PsSubProblem, subProblemIndex: number): Promise<void>;
    renderSolution(solution: PsSolution): string;
}
//# sourceMappingURL=rankProsCons.d.ts.map