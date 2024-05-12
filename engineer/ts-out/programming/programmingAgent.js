import { Project } from "ts-morph";
import path from "path";
import { PsEngineerBaseProgrammingAgent } from "./baseAgent.js";
import { PsEngineerProgrammingPlanningAgent } from "./planningAgent.js";
import { PsEngineerProgrammingImplementationAgent } from "./implementationAgent.js";
export class PsEngineerProgrammingAgent extends PsEngineerBaseProgrammingAgent {
    async implementChanges() {
        console.log(`Implementing changes `);
        const planningAgent = new PsEngineerProgrammingPlanningAgent(this.memory, this.likelyToChangeFilesContents, this.otherFilesToKeepInContextContent, this.documentationFilesInContextContent, this.tsMorphProject);
        const actionPlan = await planningAgent.getActionPlan();
        console.log(`Coding plan: ${JSON.stringify(actionPlan, null, 2)}`);
        if (actionPlan) {
            const implementationAgent = new PsEngineerProgrammingImplementationAgent(this.memory, this.likelyToChangeFilesContents, this.otherFilesToKeepInContextContent, this.documentationFilesInContextContent, this.tsMorphProject);
            // Loop until all actions are completed
            let allCompleted = false;
            while (!allCompleted) {
                await implementationAgent.implementCodingActionPlan(actionPlan);
                // Check if all actions are completed
                allCompleted = actionPlan.every(action => action.status === "completed");
                if (!allCompleted) {
                    console.log("Not all actions completed, running again...");
                }
            }
        }
        else {
            console.error(`No coding plan received`);
        }
    }
    async implementTask() {
        if (!this.memory.typeScriptFilesLikelyToChange) {
            console.error("No files to change");
            return;
        }
        this.tsMorphProject = new Project({
            tsConfigFilePath: path.join(this.memory.workspaceFolder, "tsconfig.json"),
        });
        this.tsMorphProject.addSourceFilesAtPaths("src/**/*.ts");
        this.otherFilesToKeepInContextContent = this.getFileContentsWithFileName(this.memory.otherTypescriptFilesToKeepInContext);
        this.likelyToChangeFilesContents = this.getFileContentsWithFileName(this.memory.typeScriptFilesLikelyToChange);
        this.documentationFilesInContextContent = this.getFileContentsWithFileName(this.memory.documentationFilesToKeepInContext);
        await this.implementChanges();
        this.memory.actionLog.push(`Implemented changes`);
        return;
    }
}
//# sourceMappingURL=programmingAgent.js.map