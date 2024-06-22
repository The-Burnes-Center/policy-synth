import { BaseProblemSolvingAgent } from "../../base/baseProblemSolvingAgent.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
export declare class ReapSolutionsProcessor extends BaseProblemSolvingAgent {
    renderReapPrompt(solution: PsSolution): Promise<(SystemMessage | HumanMessage)[]>;
    reapSolutionsForSubProblem(subProblemIndex: number, solutions: Array<PsSolution>): Promise<void>;
    reapSolutions(): Promise<void>;
    process(): Promise<void>;
}
//# sourceMappingURL=reapPopulation.d.ts.map