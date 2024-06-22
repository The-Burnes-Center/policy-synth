import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PolicySynthScAgentBase } from "../base/baseScAgentBase.js";
export declare class PsBaseValidationAgent extends PolicySynthScAgentBase {
    name: string;
    options: PsBaseValidationAgentOptions;
    constructor(name: string, options?: PsBaseValidationAgentOptions);
    set nextAgent(agent: PsValidationAgent);
    protected renderPrompt(): Promise<(SystemMessage | HumanMessage)[]>;
    runValidationLLM(): Promise<PsValidationAgentResult>;
    execute(): Promise<PsValidationAgentResult>;
    protected beforeExecute(): Promise<void>;
    protected performExecute(): Promise<PsValidationAgentResult>;
    protected afterExecute(result: PsValidationAgentResult): Promise<void>;
}
//# sourceMappingURL=baseValidationAgent.d.ts.map