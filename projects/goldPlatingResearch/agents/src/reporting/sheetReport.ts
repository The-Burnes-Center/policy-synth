import { PolicySynthAgent } from "@policysynth/agents/base/agent.js";
import { PsAgent } from "@policysynth/agents/dbModels/agent.js";
import { PsConnectorFactory } from "@policysynth/agents/connectors/base/connectorFactory.js";
import { PsConnectorClassTypes } from "@policysynth/agents/connectorTypes.js";
import { PsBaseSheetConnector } from "@policysynth/agents/connectors/base/baseSheetConnector";

export class XlsReportAgent extends PolicySynthAgent {
  declare memory: GoldPlatingMemoryData;
  private sheetsConnector: PsBaseSheetConnector;

  constructor(
    agent: PsAgent,
    memory: GoldPlatingMemoryData,
    startProgress: number,
    endProgress: number
  ) {
    super(agent, memory, startProgress, endProgress);
    this.sheetsConnector = PsConnectorFactory.getConnector(
      this.agent,
      this.memory,
      PsConnectorClassTypes.Spreadsheet,
      false
    ) as PsBaseSheetConnector;

    if (!this.sheetsConnector) {
      throw new Error("Google Sheets connector not found");
    }
  }

  async processItem(researchItem: GoldplatingResearchItem): Promise<void> {
    await this.updateRangedProgress(0, "Starting XLS report generation");

    const notJustifiedGoldPlating = this.collectArticles(
      researchItem,
      "notJustifiedGoldPlating"
    );
    const justifiedGoldPlating = this.collectArticles(
      researchItem,
      "justifiedGoldPlating"
    );

    await this.generateReport(
      researchItem,
      notJustifiedGoldPlating,
      justifiedGoldPlating
    );

    await this.updateRangedProgress(100, "XLS report generation completed");
  }

  private collectArticles(
    researchItem: GoldplatingResearchItem,
    collectionType: "justifiedGoldPlating" | "notJustifiedGoldPlating"
  ): LawArticle[] {
    const rankableArticles: LawArticle[] = [];

    const addArticles = (articles: LawArticle[]) => {
      articles
        .filter((article) =>
          collectionType == "justifiedGoldPlating"
            ? article.research?.likelyJustified === true
            : article.research?.likelyJustified === false
        )
        .forEach((article) => {
          rankableArticles.push(article);
        });
    };

    if (researchItem.nationalLaw) {
      addArticles(researchItem.nationalLaw.law.articles);
      researchItem.nationalLaw.law.articles.forEach((article) => {
        article.source = "law";
      });
    }

    if (researchItem.nationalRegulation) {
      researchItem.nationalRegulation.forEach((regulation) => {
        addArticles(regulation.articles);
        regulation.articles.forEach((article) => {
          article.source = "regulation";
        });
      });
    }

    return rankableArticles.sort(
      (a, b) => (b.eloRating || 0) - (a.eloRating || 0)
    );
  }

  private async generateReport(
    researchItem: GoldplatingResearchItem,
    notJustifiedGoldPlating: LawArticle[],
    justifiedGoldPlating: LawArticle[]
  ): Promise<void> {
    const summarySheet = this.generateSummarySheet(
      researchItem,
      notJustifiedGoldPlating
    );

    const notJustifiedGoldPlatingRows = this.generateDetailedFindingsSheet(
      notJustifiedGoldPlating
    );

    const justifiedGoldPlatingRows =
      this.generateDetailedFindingsSheet(justifiedGoldPlating);

    const allData = [
      ...summarySheet,
      [], // Empty row for separation
      ["Not justified gold-plating"],
      ...notJustifiedGoldPlatingRows,
      [], // Empty row for separation
      ["Likely Justified gold-plating"],
      ...justifiedGoldPlatingRows,
    ];

    try {
      // Update the sheet using updateRange method
      const sanitizedData = this.sanitizeData(allData);
      await this.sheetsConnector.updateRange("A1", sanitizedData);
      console.log(
        "Report generated and uploaded to Google Sheets successfully."
      );
    } catch (error) {
      console.error("Error updating Google Sheet:", error);
      throw error;
    }
  }

  private generateSummarySheet(
    researchItem: GoldplatingResearchItem,
    rankedArticles: LawArticle[]
  ): string[][] {
    return [
      [`Rannsókn á gullhúðun fyrir ${researchItem.name}`],
      [
        "",
        "",
        "Total instances of potential gold-plating:",
        rankedArticles.length.toString(),
      ],
      [""],
      ["Topp 5 dæmi:"],
      ["Rank", "Source", "Article Number", "ELO Rating", "Description", "Url"],
      ...rankedArticles
        .slice(0, 5)
        .map((article, index) => [
          (index + 1).toString(),
          article.source!,
          article.number.toString(),
          (article.eloRating || 0).toString(),
          article.research?.description || "N/A",
          article.research?.url || "N/A",
        ]),
    ];
  }

  private sanitizeData(data: any[][]): string[][] {
    return data.map((row) =>
      row.map((cell) => {
        if (typeof cell === "object" && cell !== null) {
          return JSON.stringify(cell);
        }
        return String(cell);
      })
    );
  }

  private generateDetailedFindingsSheet(
    rankedArticles: LawArticle[]
  ): string[][] {
    const headers = [
      "Rank",
      "Source",
      "Article Number",
      "ELO Rating",
      "Text",
      "Description",
      "Url",
      "Justification",
      "EU Directive Article Numbers",
      "Possible Reason",
      "Detailed Rules",
      "Expanded Scope",
      "Exemptions Not Utilized",
      "Stricter National Laws",
      "Disproportionate Penalties",
      "Earlier Implementation",
      "Possible Reasons",
      "Possible Explanation (frá greinargerð)",
      "EU Directive Relevant Extract",
      "English Article Translation",
    ];

    const rows = rankedArticles.map((article, index) => [
      (index + 1).toString(),
      article.source!,
      article.number.toString(),
      (article.eloRating || 0).toString(),
      article.text,
      article.research?.description || "N/A",
      article.research?.url || "N/A",
      article.research?.justification || "N/A",
      article.research?.results.euDirectiveArticlesNumbers?.join(", ") || "N/A",
      article.research?.results.possibleReasons || "N/A",
      article.research?.results.detailedRules || "N/A",
      article.research?.results.expandedScope || "N/A",
      article.research?.results.exemptionsNotUtilized || "N/A",
      article.research?.results.stricterNationalLaws || "N/A",
      article.research?.results.disproportionatePenalties || "N/A",
      article.research?.results.earlierImplementation || "N/A",
      article.research?.results.possibleReasons || "N/A",
      article.research?.supportTextExplanation || "N/A",
      article.research?.euLawExtract || "N/A",
      article.research?.englishTranslationOfIcelandicArticle || "N/A",
    ]);

    return [["Detailed Findings"], headers, ...rows];
  }
}
