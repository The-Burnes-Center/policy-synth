import { BaseProblemSolvingAgent } from "../../baseProblemSolvingAgent.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
export declare class CreateProsConsProcessor extends BaseProblemSolvingAgent {
    renderCurrentSolution(solution: IEngineSolution): string;
    renderRefinePrompt(prosOrCons: string, results: string[], subProblemIndex: number, solution: IEngineSolution): Promise<(HumanMessage | SystemMessage)[]>;
    renderCreatePrompt(prosOrCons: string, subProblemIndex: number, solution: IEngineSolution): Promise<(HumanMessage | SystemMessage)[]>;
    createProsCons(): Promise<void>;
    process(): Promise<void>;
}
//# sourceMappingURL=createProsCons.d.ts.map