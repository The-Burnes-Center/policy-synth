import { PolicySynthOperationsAgent } from "../base/operationsAgent.js";
export class BaseSmarterCrowdsourcingAgent extends PolicySynthOperationsAgent {
    job;
    currentSubProblemIndex;
    constructor(agent, memory, startProgress, endProgress) {
        super(agent, memory, startProgress, endProgress);
    }
    get maxSubProblems() {
        return process.env.PS_MAX_SUB_PROBLEMS_TO_PROCESS
            ? parseInt(process.env.PS_MAX_SUB_PROBLEMS_TO_PROCESS)
            : 7;
    }
    async initEmptySmarterCrowdsourcingMemory() {
        this.memory = {
            ...this.memory,
            ...{
                lastSavedAt: Date.now(),
                customInstructions: {},
                problemStatement: {
                    description: "",
                    searchQueries: {
                        general: [],
                        scientific: [],
                        news: [],
                        openData: [],
                    },
                    searchResults: {
                        pages: {
                            general: [],
                            scientific: [],
                            news: [],
                            openData: [],
                        },
                    },
                },
                subProblems: [],
                currentStageData: undefined,
                status: {
                    state: "processing",
                    progress: 0,
                    messages: [],
                    lastUpdated: Date.now(),
                },
            },
        };
        await this.saveMemory();
    }
    getProCons(prosCons) {
        if (prosCons && prosCons.length > 0) {
            return prosCons.map((proCon) => proCon.description);
        }
        else {
            return [];
        }
    }
    lastPopulationIndex(subProblemIndex) {
        return (this.memory.subProblems[subProblemIndex].solutions.populations.length - 1);
    }
    renderSubProblem(subProblemIndex, useProblemAsHeader = false) {
        const subProblem = this.memory.subProblems[subProblemIndex];
        return `
      ${useProblemAsHeader ? "Problem" : "Sub Problem"}:
      ${subProblem.title}

      ${subProblem.description}

      ${subProblem.whyIsSubProblemImportant}
      `;
    }
    renderSubProblemSimple(subProblemIndex) {
        const subProblem = this.memory.subProblems[subProblemIndex];
        return `
      ${subProblem.title}
      ${subProblem.description}
      `;
    }
    getActiveSolutionsLastPopulation(subProblemIndex) {
        const populations = this.memory.subProblems[subProblemIndex].solutions.populations;
        const lastPopulation = populations[populations.length - 1];
        return lastPopulation.filter((solution) => !solution.reaped);
    }
    getActiveSolutionsFromPopulation(subProblemIndex, populationIndex) {
        const populations = this.memory.subProblems[subProblemIndex].solutions.populations;
        const lastPopulation = populations[populationIndex];
        return lastPopulation.filter((solution) => !solution.reaped);
    }
    numberOfPopulations(subProblemIndex) {
        return this.memory.subProblems[subProblemIndex].solutions.populations
            .length;
    }
    renderSubProblems() {
        return `
      Sub Problems:
      ${this.memory.subProblems.map((subProblem, index) => {
            return `
        ${index + 1}. ${subProblem.title}\n

        ${subProblem.description}\n

        ${subProblem.whyIsSubProblemImportant}\n
        `;
        })}
   `;
    }
    renderEntity(subProblemIndex, entityIndex) {
        const entity = this.memory.subProblems[subProblemIndex].entities[entityIndex];
        return `
      Entity: ${entity.name}
      ${this.renderEntityPosNegReasons(entity)}
      `;
    }
    renderProblemStatement() {
        return `
      Problem Statement:
      ${this.memory.problemStatement.description}
      `;
    }
    renderProblemStatementSubProblemsAndEntities(index, includeMainProblemStatement = true) {
        const subProblem = this.memory.subProblems[index];
        const entitiesText = `
      ${subProblem.entities
            .slice(0, process.env.PS_MAX_ENTITIES_TO_RENDER
            ? parseInt(process.env.PS_MAX_ENTITIES_TO_RENDER)
            : 3)
            .map((entity) => {
            let entityEffects = this.renderEntityPosNegReasons(entity);
            if (entityEffects.length > 0) {
                entityEffects = `\n${entity.name}\n${entityEffects}\n}`;
            }
            return entityEffects;
        })
            .join("")}`;
        return `
      ${includeMainProblemStatement
            ? `Problem Statement:\n${this.memory.problemStatement.description}\n\nSub Problem:\n`
            : `Problem:\n`}
      ${subProblem.title}\n
      ${subProblem.description}\n

      ${entitiesText ? `Top Affected Entities:\n${entitiesText}` : ""}
    `;
    }
    renderEntityPosNegReasons(item) {
        let itemEffects = "";
        if (item.positiveEffects && item.positiveEffects.length > 0) {
            itemEffects += `
      Positive Effects:
      ${item.positiveEffects.join("\n")}
      `;
        }
        if (item.negativeEffects && item.negativeEffects.length > 0) {
            itemEffects += `
      Negative Effects:
      ${item.negativeEffects.join("\n")}
      `;
        }
        return itemEffects;
    }
}
//# sourceMappingURL=baseAgent.js.map