import { PolicySynthOperationsAgent } from "../base/operationsAgent.js";
import { PsAgentClass } from "../dbModels/agentClass.js";
import { ProblemsSmarterCrowdsourcingAgent } from "./scBaseProblemsAgent.js";
import { SolutionsSmarterCrowdsourcingAgent } from "./scBaseSolutionsAgent.js";
import { PoliciesSmarterCrowdsourcingAgent } from "./scBasePoliciesAgent.js";
export class BaseSmarterCrowdsourcingAgent extends PolicySynthOperationsAgent {
    job;
    currentSubProblemIndex;
    constructor(agent, memory, startProgress, endProgress) {
        super(agent, memory, startProgress, endProgress);
    }
    getConfig(uniqueId, defaultValue) {
        const answer = this.agent.configuration.answers?.find((a) => a.uniqueId === uniqueId);
        if (answer) {
            if (typeof defaultValue === "number") {
                return Number(answer.value);
            }
            else if (typeof defaultValue === "boolean") {
                return (answer.value === "true");
            }
            else if (Array.isArray(defaultValue)) {
                return JSON.parse(answer.value);
            }
            return answer.value;
        }
        return defaultValue;
    }
    static getConfigurationQuestions() {
        return [
            ...this.getMainCommonConfigurationSettings(),
            ...this.getMainConfigurationSettings(),
            {
                type: "textDescription",
                text: "Advanced Configuration Settings",
            },
            ...this.getExtraCommonConfigurationQuestions(),
            ...this.getExtraConfigurationQuestions(),
        ];
    }
    // Implement in subclass
    static getMainConfigurationSettings() {
        return [];
    }
    // Implement in subclass
    static getExtraConfigurationQuestions() {
        return [];
    }
    static async createAgentClassesIfNeeded(userId) {
        const agentClasses = [
            ProblemsSmarterCrowdsourcingAgent.getAgentClass(),
            SolutionsSmarterCrowdsourcingAgent.getAgentClass(),
            PoliciesSmarterCrowdsourcingAgent.getAgentClass(),
        ];
        for (const agentClass of agentClasses) {
            const [instance, created] = await PsAgentClass.findOrCreate({
                where: { class_base_id: agentClass.class_base_id },
                defaults: {
                    ...agentClass,
                    user_id: userId,
                },
            });
            if (created) {
                console.log(`Created agent class: ${instance.class_base_id}`);
            }
        }
    }
    static getMainCommonConfigurationSettings() {
        return [
            {
                uniqueId: "problemStatementDescription",
                type: "text",
                value: "",
                maxLength: 2000,
                required: true,
                rows: 5,
                charCounter: true,
                text: "Problem Statement Description",
            },
            {
                uniqueId: "rankSubProblemsInstructions",
                type: "text",
                value: `
  1. Assess how important the sub problems are as sub problems to the main problem statement.
  2. We are not looking for solutions, only well defined sub problems.
  3. Keep in mind while you decide that the sub problems, in this case, are especially important to civil society and policymakers.
`,
                maxLength: 1000,
                required: true,
                rows: 5,
                charCounter: true,
                text: "Rank Sub-Problems Instructions",
            },
            {
                uniqueId: "subProblemClientColors",
                type: "text",
                value: JSON.stringify([
                    "#ee782d",
                    "#0b60b9",
                    "#face2d",
                    "#50c363",
                    "#ADD8E6",
                    "#cf1103",
                    "#7F00FF",
                    "#3f5fce",
                ]),
                maxLength: 500,
                required: true,
                rows: 3,
                charCounter: true,
                text: "Sub-Problem Client Colors (JSON array)",
            },
            {
                uniqueId: "subProblemColors",
                type: "text",
                value: JSON.stringify([
                    "orange",
                    "blue",
                    "yellow",
                    "green",
                    "light blue",
                    "red",
                    "violet",
                    "sea Green",
                    "saddle Brown",
                    "chocolate",
                    "fire Brick",
                    "orange Red",
                    "yellow Green",
                    "gold",
                    "dark Khaki",
                    "dark Magenta",
                    "dark Violet",
                    "wheat",
                    "forest Green",
                    "tan",
                    "gray",
                    "transparent",
                ]),
                maxLength: 1000,
                required: true,
                rows: 5,
                charCounter: true,
                text: "Sub-Problem Colors (JSON array)",
            }
        ];
    }
    static getExtraCommonConfigurationQuestions() {
        return [
            {
                uniqueId: "maxSubProblems",
                type: "number",
                value: 7,
                maxLength: 3,
                required: true,
                text: "Maximum number of sub-problems",
            },
            {
                uniqueId: "maxNumberGeneratedOfEntities",
                type: "number",
                value: 7,
                maxLength: 3,
                required: true,
                text: "Maximum number of generated entities",
            },
            {
                uniqueId: "maxStabilityRetryCount",
                type: "number",
                value: 14,
                maxLength: 3,
                required: true,
                text: "Maximum stability retry count",
            },
            {
                uniqueId: "mainLLMmaxRetryCount",
                type: "number",
                value: 5,
                maxLength: 2,
                required: true,
                text: "Main LLM max retry count",
            },
            {
                uniqueId: "limitedLLMmaxRetryCount",
                type: "number",
                value: 3,
                maxLength: 2,
                required: true,
                text: "Limited LLM max retry count",
            },
            {
                uniqueId: "rankingLLMmaxRetryCount",
                type: "number",
                value: 40,
                maxLength: 3,
                required: true,
                text: "Ranking LLM max retry count",
            },
            {
                uniqueId: "maxTopEntitiesToSearch",
                type: "number",
                value: 3,
                maxLength: 2,
                required: true,
                text: "Maximum top entities to search",
            },
            {
                uniqueId: "maxTopEntitiesToRender",
                type: "number",
                value: 3,
                maxLength: 2,
                required: true,
                text: "Maximum top entities to render",
            },
            {
                uniqueId: "maxTopQueriesToSearchPerType",
                type: "number",
                value: 5,
                maxLength: 2,
                required: true,
                text: "Maximum top queries to search per type",
            },
            {
                uniqueId: "mainSearchRetryCount",
                type: "number",
                value: 40,
                maxLength: 3,
                required: true,
                text: "Main search retry count",
            },
            {
                uniqueId: "maxDalleRetryCount",
                type: "number",
                value: 7,
                maxLength: 2,
                required: true,
                text: "Maximum DALL-E retry count",
            },
            {
                uniqueId: "maxTopWebPagesToGet",
                type: "number",
                value: 5,
                maxLength: 2,
                required: true,
                text: "Maximum top web pages to get",
            },
            {
                uniqueId: "maxBingSearchResults",
                type: "number",
                value: 10,
                maxLength: 3,
                required: true,
                text: "Maximum Bing search results",
            },
            {
                uniqueId: "maxTopProsConsUsedForRating",
                type: "number",
                value: 2,
                maxLength: 2,
                required: true,
                text: "Maximum top pros/cons used for rating",
            },
            {
                uniqueId: "maxNumberGeneratedProsConsForSolution",
                type: "number",
                value: 3,
                maxLength: 2,
                required: true,
                text: "Maximum number of generated pros/cons for solution",
            },
            {
                uniqueId: "minSleepBeforeBrowserRequest",
                type: "number",
                value: 50,
                maxLength: 5,
                required: true,
                text: "Minimum sleep before browser request (ms)",
            },
            {
                uniqueId: "maxAdditionalRandomSleepBeforeBrowserRequest",
                type: "number",
                value: 100,
                maxLength: 5,
                required: true,
                text: "Maximum additional random sleep before browser request (ms)",
            },
            {
                uniqueId: "numberOfSearchTypes",
                type: "number",
                value: 4,
                maxLength: 2,
                required: true,
                text: "Number of search types",
            },
            {
                uniqueId: "webPageNavTimeout",
                type: "number",
                value: 30000,
                maxLength: 6,
                required: true,
                text: "Web page navigation timeout (ms)",
            },
            {
                uniqueId: "currentUserAgent",
                type: "text",
                value: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                maxLength: 200,
                required: true,
                text: "Current user agent string",
            },
            {
                uniqueId: "tokenInLimit",
                type: "number",
                value: 8000,
                maxLength: 5,
                required: true,
                text: "Token input limit",
            },
        ];
    }
    // General configuration options
    get maxSubProblems() {
        return this.getConfig("maxSubProblems", 7);
    }
    get maxNumberGeneratedOfEntities() {
        return this.getConfig("maxNumberGeneratedOfEntities", 7);
    }
    get maxStabilityRetryCount() {
        return this.getConfig("maxStabilityRetryCount", 14);
    }
    get rankingLLMmaxRetryCount() {
        return this.getConfig("rankingLLMmaxRetryCount", 40);
    }
    get maxTopEntitiesToSearch() {
        return this.getConfig("maxTopEntitiesToSearch", 3);
    }
    get maxTopEntitiesToRender() {
        return this.getConfig("maxTopEntitiesToRender", 3);
    }
    get maxTopQueriesToSearchPerType() {
        return this.getConfig("maxTopQueriesToSearchPerType", 5);
    }
    get mainSearchRetryCount() {
        return this.getConfig("mainSearchRetryCount", 40);
    }
    get maxDalleRetryCount() {
        return this.getConfig("maxDalleRetryCount", 7);
    }
    get maxTopWebPagesToGet() {
        return this.getConfig("maxTopWebPagesToGet", 5);
    }
    get maxBingSearchResults() {
        return this.getConfig("maxBingSearchResults", 10);
    }
    get maxTopProsConsUsedForRating() {
        return this.getConfig("maxTopProsConsUsedForRating", 2);
    }
    get maxNumberGeneratedProsConsForSolution() {
        return this.getConfig("maxNumberGeneratedProsConsForSolution", 3);
    }
    get minSleepBeforeBrowserRequest() {
        return this.getConfig("minSleepBeforeBrowserRequest", 50);
    }
    get maxAdditionalRandomSleepBeforeBrowserRequest() {
        return this.getConfig("maxAdditionalRandomSleepBeforeBrowserRequest", 100);
    }
    get numberOfSearchTypes() {
        return this.getConfig("numberOfSearchTypes", 4);
    }
    get webPageNavTimeout() {
        return this.getConfig("webPageNavTimeout", 30 * 1000);
    }
    get currentUserAgent() {
        return this.getConfig("currentUserAgent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
    }
    get tokenInLimit() {
        return this.getConfig("tokenInLimit", 8000);
    }
    // Problems-specific configuration options
    get maxTopRootCauseQueriesToSearchPerType() {
        return this.getConfig("maxTopRootCauseQueriesToSearchPerType", 15);
    }
    get maxRootCausePercentOfSearchResultWebPagesToGet() {
        return this.getConfig("maxRootCausePercentOfSearchResultWebPagesToGet", 0.7);
    }
    get maxRootCausesToUseForRatingRootCauses() {
        return this.getConfig("maxRootCausesToUseForRatingRootCauses", 5);
    }
    get topWebPagesToGetForRefineRootCausesScan() {
        return this.getConfig("topWebPagesToGetForRefineRootCausesScan", 100);
    }
    get subProblemsRankingMinNumberOfMatches() {
        return this.getConfig("subProblemsRankingMinNumberOfMatches", 10);
    }
    get rootCauseFieldTypes() {
        return this.getConfig("rootCauseFieldTypes", []);
    }
    get createEntitiesRefinedEnabled() {
        return this.getConfig("createEntitiesRefinedEnabled", true);
    }
    get createSubProblemsRefineEnabled() {
        return this.getConfig("createSubProblemsRefineEnabled", true);
    }
    // Solutions-specific configuration options
    get topItemsToKeepForTopicClusterPruning() {
        return this.getConfig("topItemsToKeepForTopicClusterPruning", 3);
    }
    get maxTopSearchQueriesForSolutionCreation() {
        return this.getConfig("maxTopSearchQueriesForSolutionCreation", 8);
    }
    get maxPercentOfSolutionsWebPagesToGet() {
        return this.getConfig("maxPercentOfSolutionsWebPagesToGet", 0.5);
    }
    get createSolutionsNotUsingTopSearchQueriesChance() {
        return this.getConfig("createSolutionsNotUsingTopSearchQueriesChance", 0.1);
    }
    get createSolutionsWebSolutionsTopChance() {
        return this.getConfig("createSolutionsWebSolutionsTopChance", 0.05);
    }
    get createSolutionsWebSolutionsTopThreeChance() {
        return this.getConfig("createSolutionsWebSolutionsTopThreeChance", 0.25);
    }
    get createSolutionsWebSolutionsTopSevenChance() {
        return this.getConfig("createSolutionsWebSolutionsTopSevenChance", 0.5);
    }
    get createSolutionsVectorSearchAcrossAllProblemsChance() {
        return this.getConfig("createSolutionsVectorSearchAcrossAllProblemsChance", 0.001);
    }
    get useRandomTopFromVectorSearchResultsLimits() {
        return this.getConfig("useRandomTopFromVectorSearchResultsLimits", 14);
    }
    get createSolutionsSearchQueriesUseMainProblemSearchQueriesChance() {
        return this.getConfig("createSolutionsSearchQueriesUseMainProblemSearchQueriesChance", 0.01);
    }
    get createSolutionsSearchQueriesUseOtherSubProblemSearchQueriesChance() {
        return this.getConfig("createSolutionsSearchQueriesUseOtherSubProblemSearchQueriesChance", 0.01);
    }
    get createSolutionsSearchQueriesUseSubProblemSearchQueriesChance() {
        return this.getConfig("createSolutionsSearchQueriesUseSubProblemSearchQueriesChance", 0.38);
    }
    get createSolutionsRefineEnabled() {
        return this.getConfig("createSolutionsRefineEnabled", true);
    }
    get createProsConsRefinedEnabled() {
        return this.getConfig("createProsConsRefinedEnabled", true);
    }
    // Evolution-specific configuration options
    get evolutionPopulationSize() {
        return this.getConfig("evolutionPopulationSize", 80);
    }
    get evolutionLimitTopTopicClusterElitesToEloRating() {
        return this.getConfig("evolutionLimitTopTopicClusterElitesToEloRating", 850);
    }
    get evolutionKeepElitePercent() {
        return this.getConfig("evolutionKeepElitePercent", 0.1);
    }
    get evolutionRandomImmigrationPercent() {
        return this.getConfig("evolutionRandomImmigrationPercent", 0.4);
    }
    get evolutionMutationOffspringPercent() {
        return this.getConfig("evolutionMutationOffspringPercent", 0.35);
    }
    get evolutionCrossoverPercent() {
        return this.getConfig("evolutionCrossoverPercent", 0.15);
    }
    get evolutionLowMutationRate() {
        return this.getConfig("evolutionLowMutationRate", 0.5);
    }
    get evolutionMediumMutationRate() {
        return this.getConfig("evolutionMediumMutationRate", 0.3);
    }
    get evolutionHighMutationRate() {
        return this.getConfig("evolutionHighMutationRate", 0.2);
    }
    get evolutionSelectParentTournamentSize() {
        return this.getConfig("evolutionSelectParentTournamentSize", 7);
    }
    get evolutionCrossoverMutationPercent() {
        return this.getConfig("evolutionCrossoverMutationPercent", 0.05);
    }
    // Policies-specific configuration options
    get maxTopSolutionsToCreatePolicies() {
        return this.getConfig("maxTopSolutionsToCreatePolicies", 3);
    }
    get maxTopPoliciesToProcess() {
        return this.getConfig("maxTopPoliciesToProcess", 1);
    }
    get maxEvidenceToUseForRatingEvidence() {
        return this.getConfig("maxEvidenceToUseForRatingEvidence", 5);
    }
    get policyEvidenceFieldTypes() {
        return this.getConfig("policyEvidenceFieldTypes", []);
    }
    get maxTopEvidenceQueriesToSearchPerType() {
        return this.getConfig("maxTopEvidenceQueriesToSearchPerType", 4);
    }
    // Other configuration options
    get maxPercentOfEloMatched() {
        return this.getConfig("maxPercentOfEloMatched", 0.75);
    }
    get minimumNumberOfPairwiseVotesForPopulation() {
        return this.getConfig("minimumNumberOfPairwiseVotesForPopulation", 10);
    }
    get maxNumberOfPairwiseRankingPrompts() {
        return this.getConfig("maxNumberOfPairwiseRankingPrompts", this.evolutionPopulationSize *
            this.minimumNumberOfPairwiseVotesForPopulation);
    }
    get customInstructionsRankSolutions() {
        return this.getConfig("customInstructionsRankSolutions", "");
    }
    simplifyEvidenceType(evidenceType) {
        let type = evidenceType
            .replace(/allPossible/g, "")
            .replace(/IdentifiedInTextContext/g, "");
        type = type.charAt(0).toLowerCase() + type.slice(1);
        return type;
    }
    simplifyRootCauseType(rootCauseType) {
        let type = rootCauseType
            .replace(/allPossible/g, "")
            .replace(/IdentifiedInTextContext/g, "");
        type = type.charAt(0).toLowerCase() + type.slice(1);
        if (type !== "rootCausesCaseStudies") {
            type = type.slice(0, -1);
        }
        return type;
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
//# sourceMappingURL=scBaseAgent.js.map