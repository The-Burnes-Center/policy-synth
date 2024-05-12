import { PsEngineerBaseProgrammingAgent } from "./baseAgent.js";
export declare class PsEngineerProgrammingPlanningAgent extends PsEngineerBaseProgrammingAgent {
    planSystemPrompt(): string;
    getUserPlanPrompt(reviewLog: string): string;
    reviewSystemPrompt(): string;
    actionPlanReviewSystemPrompt(): string;
    getUserReviewPrompt(codingPlan: string): string;
    getUserActionPlanReviewPrompt(actionPlan: PsEngineerCodingActionPlanItem[]): string;
    getActionPlanSystemPrompt(): string;
    getUserActionPlanPrompt(codingPlan: string, reviewLog: string): string;
    getCodingPlan(): Promise<string | undefined>;
    getActionPlan(): Promise<PsEngineerCodingActionPlanItem[] | undefined>;
}
//# sourceMappingURL=planningAgent.d.ts.map