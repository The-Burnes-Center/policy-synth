import { Page, Browser } from "puppeteer";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { GetWebPagesProcessor } from "../../solutions/web/getWebPages.js";
import { RootCauseWebPageVectorStore } from "../../vectorstore/rootCauseWebPage.js";
export declare class GetRootCausesWebPagesProcessor extends GetWebPagesProcessor {
    rootCauseWebPageVectorStore: RootCauseWebPageVectorStore;
    renderRootCauseScanningPrompt(type: PSRootCauseWebPageTypes, text: string): (SystemMessage | HumanMessage)[];
    getRootCauseTokenCount(text: string, type: PSRootCauseWebPageTypes): Promise<{
        totalTokenCount: number;
        promptTokenCount: {
            totalCount: number;
            countPerMessage: number[];
        };
    }>;
    getRootCauseTextAnalysis(type: PSRootCauseWebPageTypes, text: string): Promise<PSRootCauseRawWebPageData | PSRefinedRootCause[]>;
    getRootCauseAIAnalysis(type: PSRootCauseWebPageTypes, text: string): Promise<PSRootCauseRawWebPageData>;
    mergeAnalysisData(data1: PSRootCauseRawWebPageData, data2: PSRootCauseRawWebPageData): PSRootCauseRawWebPageData;
    processPageText(text: string, subProblemIndex: undefined, url: string, type: IEngineWebPageTypes | PSRootCauseWebPageTypes, entityIndex: number | undefined, policy?: undefined): Promise<void>;
    getAndProcessRootCausePage(url: string, browserPage: Page, type: PSRootCauseWebPageTypes): Promise<boolean>;
    processRootCauses(browser: Browser): Promise<void>;
    getAllPages(): Promise<void>;
    process(): Promise<void>;
}
//# sourceMappingURL=getRootCausesWebPages.d.ts.map