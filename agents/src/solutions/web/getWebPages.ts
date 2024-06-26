import { HTTPResponse, Page, Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { IEngineConstants } from "../../constants.js";
import { PdfReader } from "pdfreader";
import axios from "axios";

import { createGzip, gunzipSync, gzipSync } from "zlib";
import { promisify } from "util";
import { writeFile, readFile, existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";

const gzip = promisify(createGzip);
const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

import { htmlToText } from "html-to-text";
import { BaseProblemSolvingAgent } from "../../baseProblemSolvingAgent.js";

import weaviate, { WeaviateClient } from "weaviate-ts-client";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { ChatOpenAI } from "@langchain/openai";

import { WebPageVectorStore } from "../../vectorstore/webPage.js";

import ioredis from "ioredis";

const redis = new ioredis(
  process.env.REDIS_MEMORY_URL || "redis://localhost:6379"
);

//@ts-ignore
puppeteer.use(StealthPlugin());

const onlyCheckWhatNeedsToBeScanned = false;

export class GetWebPagesProcessor extends BaseProblemSolvingAgent {
  webPageVectorStore = new WebPageVectorStore();

  totalPagesSave = 0;

  renderScanningPrompt(
    problemStatement: IEngineProblemStatement,
    text: string,
    subProblemIndex?: number,
    entityIndex?: number
  ) {
    return [
      new SystemMessage(
       `Your are an AI expert in analyzing text for practical solutions to difficult problems:

        Important Instructions:
        1. Examine the "Text context" and determine how it relates to the problem statement and any specified sub problem.
        2. Identify solutions in the "Text Context" and add them in the 'solutionsIdentifiedInTextContext' JSON array.
        3. If the solutions are for a specific audience, always include a reference to that audience in the text of the solution, do not have the audience as a separate field
        4. Always output your results in this JSON format: { solutionsIdentifiedInTextContext: [ "" ], summary, relevanceToProblem,  contacts: [ "" ] } format, with no additional explanation.
        5. Think step-by-step.
        6. It is very important for society that you find the best solutions to those problems
        `
      ),
      new HumanMessage(
        `
        Problem Statement:
        ${problemStatement.description}

        ${
          subProblemIndex !== undefined
            ? `
                ${this.renderSubProblem(subProblemIndex)}
              `
            : ``
        }

        ${
          entityIndex !== undefined && subProblemIndex !== undefined
            ? `
                ${this.renderEntity(subProblemIndex, entityIndex)}
              `
            : ``
        }

        Text Context:
        ${text}

        JSON Output:
        `
      ),
    ];
  }

  async getTokenCount(text: string, subProblemIndex: number | undefined) {
    const emptyMessages = this.renderScanningPrompt(
      this.memory.problemStatement,
      "",
      subProblemIndex
    );

    const promptTokenCount = await this.chat!.getNumTokensFromMessages(
      emptyMessages
    );

    const textForTokenCount = new HumanMessage(text);

    const textTokenCount = await this.chat!.getNumTokensFromMessages([
      textForTokenCount,
    ]);

    const totalTokenCount =
      promptTokenCount.totalCount +
      textTokenCount.totalCount +
      IEngineConstants.getSolutionsPagesAnalysisModel.maxOutputTokens;

    return { totalTokenCount, promptTokenCount };
  }

  getAllTextForTokenCheck(text: string, subProblemIndex: number | undefined) {
    const promptMessages = this.renderScanningPrompt(
      this.memory.problemStatement,
      "",
      subProblemIndex
    );

    const promptMessagesText = promptMessages.map((m) => m.text).join("\n");

    return `${promptMessagesText} ${text}`;
  }

  mergeAnalysisData(
    data1:
      | IEngineWebPageAnalysisData
      | PSEvidenceRawWebPageData
      | PSRootCauseRawWebPageData,
    data2:
      | IEngineWebPageAnalysisData
      | PSEvidenceRawWebPageData
      | PSRootCauseRawWebPageData
  ):
    | IEngineWebPageAnalysisData
    | PSEvidenceRawWebPageData
    | PSRootCauseRawWebPageData {
    data1 = data1 as IEngineWebPageAnalysisData;
    data2 = data2 as IEngineWebPageAnalysisData;
    return {
      mostRelevantParagraphs: [
        ...(data1.mostRelevantParagraphs || []),
        ...(data2.mostRelevantParagraphs || []),
      ],
      solutionsIdentifiedInTextContext: [
        ...(data1.solutionsIdentifiedInTextContext || []),
        ...(data2.solutionsIdentifiedInTextContext || []),
      ],
      relevanceToProblem: data1.relevanceToProblem,
      tags: [...(data1.tags || []), ...(data2.tags || [])],
      entities: [...(data1.entities || []), ...(data2.entities || [])],
      contacts: [...(data1.contacts || []), ...(data2.contacts || [])],
      summary: data1.summary,
      url: data1.url,
      searchType: data1.searchType,
      subProblemIndex: data1.subProblemIndex,
      entityIndex: data1.entityIndex,
      groupId: data1.groupId,
      communityId: data1.communityId,
      domainId: data1.domainId,
    };
  }

  isWithinTokenLimit(allText: string, maxChunkTokenCount: number): boolean {
    const words = allText.split(/\s+/);
    const estimatedTokenCount = words.length * 1.35;

    return estimatedTokenCount <= maxChunkTokenCount;
  }

  splitText(
    fullText: string,
    maxChunkTokenCount: number,
    subProblemIndex: number | undefined
  ): string[] {
    const chunks: string[] = [];
    const elements = fullText.split("\n");
    let currentChunk = "";

    const addElementToChunk = (element: string) => {
      const potentialChunk =
        (currentChunk !== "" ? currentChunk + "\n" : "") + element;

      if (
        !this.isWithinTokenLimit(
          this.getAllTextForTokenCheck(potentialChunk, subProblemIndex),
          maxChunkTokenCount
        )
      ) {
        // If currentChunk is not empty, add it to chunks and start a new chunk with the element
        if (currentChunk !== "") {
          chunks.push(currentChunk);
          currentChunk = element;
        } else {
          // If currentChunk is empty, it means that the element is too large to fit in a chunk
          // In this case, split the element further.
          if (element.includes(" ")) {
            // If the element is a sentence, split it by words
            const words = element.split(" ");
            for (let word of words) {
              addElementToChunk(word);
            }
          } else {
            // If the element is a single word that exceeds maxChunkTokenCount, add it as is
            chunks.push(element);
          }
        }
      } else {
        currentChunk = potentialChunk;
      }
    };

    for (let element of elements) {
      // Before adding an element to a chunk, check its size
      if (
        !this.isWithinTokenLimit(
          this.getAllTextForTokenCheck(element, subProblemIndex),
          maxChunkTokenCount
        )
      ) {
        // If the element is too large, split it by sentences
        const sentences = element.match(/[^.!?]+[.!?]+/g) || [element];
        for (let sentence of sentences) {
          addElementToChunk(sentence);
        }
      } else {
        addElementToChunk(element);
      }
    }

    // Push any remaining text in currentChunk to chunks
    if (currentChunk !== "") {
      chunks.push(currentChunk);
    }

    this.logger.debug(`Split text into ${chunks.length} chunks`);

    return chunks;
  }

  async getAIAnalysis(
    text: string,
    subProblemIndex?: number,
    entityIndex?: number
  ) {
    this.logger.info("Get AI Analysis");
    const messages = this.renderScanningPrompt(
      this.memory.problemStatement,
      text,
      subProblemIndex,
      entityIndex
    );

    const analysis = (await this.callLLM(
      "web-get-pages",
      IEngineConstants.getSolutionsPagesAnalysisModel,
      messages,
      true,
      true
    )) as IEngineWebPageAnalysisData;

    return analysis;
  }

  async getTextAnalysis(
    text: string,
    subProblemIndex?: number,
    entityIndex?: number
  ) {
    try {
      const { totalTokenCount, promptTokenCount } = await this.getTokenCount(
        text,
        subProblemIndex
      );

      this.logger.debug(
        `Total token count: ${totalTokenCount} Prompt token count: ${JSON.stringify(
          promptTokenCount
        )}`
      );

      let textAnalysis: IEngineWebPageAnalysisData;

      if (
        IEngineConstants.getSolutionsPagesAnalysisModel.tokenLimit <
        totalTokenCount
      ) {
        const maxTokenLengthForChunk =
          IEngineConstants.getSolutionsPagesAnalysisModel.tokenLimit -
          promptTokenCount.totalCount -
          128;

        this.logger.debug(
          `Splitting text into chunks of ${maxTokenLengthForChunk} tokens`
        );

        const splitText = this.splitText(
          text,
          maxTokenLengthForChunk,
          subProblemIndex
        );

        this.logger.debug(`Got ${splitText.length} splitTexts`);

        for (let t = 0; t < splitText.length; t++) {
          const currentText = splitText[t];

          let nextAnalysis = await this.getAIAnalysis(
            currentText,
            subProblemIndex,
            entityIndex
          );

          if (nextAnalysis) {
            if (t == 0) {
              textAnalysis = nextAnalysis;
            } else {
              textAnalysis = this.mergeAnalysisData(
                textAnalysis!,
                nextAnalysis
              ) as IEngineWebPageAnalysisData;
            }

            this.logger.debug(
              `Refined text analysis (${t}): ${JSON.stringify(
                textAnalysis,
                null,
                2
              )}`
            );
          } else {
            this.logger.error(
              `Error getting AI analysis for text ${currentText}`
            );
          }
        }
      } else {
        textAnalysis = await this.getAIAnalysis(text, subProblemIndex);
        this.logger.debug(
          `Text analysis ${JSON.stringify(textAnalysis, null, 2)}`
        );
      }

      return textAnalysis!;
    } catch (error) {
      this.logger.error(`Error in getTextAnalysis: ${error}`);
      throw error;
    }
  }

  async processPageText(
    text: string,
    subProblemIndex: number | undefined,
    url: string,
    type:
      | IEngineWebPageTypes
      | PSEvidenceWebPageTypes
      | PSRootCauseWebPageTypes,
    entityIndex: number | undefined,
    policy: PSPolicy | undefined = undefined
  ): Promise<void | PSRefinedRootCause[]> {
    this.logger.debug(
      `Processing page text ${text.slice(
        0,
        150
      )} for ${url} for ${type} search results ${subProblemIndex} sub problem index`
    );

    try {
      const textAnalysis = await this.getTextAnalysis(
        text,
        subProblemIndex,
        entityIndex
      );

      if (textAnalysis) {
        textAnalysis.url = url;
        textAnalysis.subProblemIndex = subProblemIndex;
        textAnalysis.entityIndex = entityIndex;
        textAnalysis.searchType = type as IEngineWebPageTypes;
        textAnalysis.groupId = this.memory.groupId;
        textAnalysis.communityId = this.memory.communityId;
        textAnalysis.domainId = this.memory.domainId;
        textAnalysis.mostRelevantParagraphs = [];

        if (
          Array.isArray(textAnalysis.contacts) &&
          textAnalysis.contacts.length > 0
        ) {
          if (
            typeof textAnalysis.contacts[0] === "object" &&
            textAnalysis.contacts[0] !== null
          ) {
            textAnalysis.contacts = textAnalysis.contacts.map((contact) =>
              JSON.stringify(contact)
            );
          }
        }

        this.logger.debug(
          `Saving text analysis ${JSON.stringify(textAnalysis, null, 2)}`
        );

        try {
          this.logger.info(`Posting web page for url ${url}`)
          await this.webPageVectorStore.postWebPage(textAnalysis);
          this.totalPagesSave += 1;
          this.logger.info(`Total ${this.totalPagesSave} saved pages`);
        } catch (e: any) {
          this.logger.error(`Error posting web page for url ${url}`);
          this.logger.error(e);
          this.logger.error(e.stack);
        }
      } else {
        this.logger.warn(`No text analysis for ${url}`);
      }
    } catch (e: any) {
      this.logger.error(`Error in processPageText`);
      this.logger.error(e.stack || e);
    }
  }

  //TODO: Use arxiv API as seperate datasource, use other for non arxiv papers
  // https://github.com/hwchase17/langchain/blob/master/langchain/document_loaders/arxiv.py
  // https://info.arxiv.org/help/api/basics.html
  async getAndProcessPdf(
    subProblemIndex: number | undefined,
    url: string,
    type:
      | IEngineWebPageTypes
      | PSEvidenceWebPageTypes
      | PSRootCauseWebPageTypes,
    entityIndex: number | undefined,
    policy: PSPolicy | undefined = undefined
  ) {
    return new Promise<void>(async (resolve, reject) => {
      this.logger.info("getAndProcessPdf");

      try {
        let finalText = "";
        let pdfBuffer;

        const directoryPath = `webPagesCache/${this.memory ? this.memory.groupId : `webResearchId${subProblemIndex}`}`;
        const fileName = encodeURIComponent(url) + '.gz';
        const fullPath = join(directoryPath, fileName);

        // Create the directory if it doesn't exist
        if (!existsSync(directoryPath)) {
            mkdirSync(directoryPath, { recursive: true });
        }

        if (existsSync(fullPath) && statSync(fullPath).isFile()) {
          this.logger.info("Got cached PDF");
          const cachedPdf = await readFileAsync(fullPath);
          pdfBuffer = gunzipSync(cachedPdf);
        } else {
          const sleepingForMs =
            IEngineConstants.minSleepBeforeBrowserRequest +
            Math.random() *
              IEngineConstants.maxAdditionalRandomSleepBeforeBrowserRequest;

          this.logger.info(`Fetching PDF ${url} in ${sleepingForMs} ms`);

          await new Promise((r) => setTimeout(r, sleepingForMs));

          const axiosResponse = await axios.get(url, {
            responseType: "arraybuffer",
          });

          pdfBuffer = axiosResponse.data;

          if (pdfBuffer) {
            this.logger.debug(`Caching PDF response`);
            const gzipData = gzipSync(pdfBuffer);
            await writeFileAsync(fullPath, gzipData);
            this.logger.debug("Have cached PDF response");
          }
        }

        if (pdfBuffer) {
          //this.logger.debug(pdfBuffer.toString().slice(0, 100));
          try {
            new PdfReader({ debug: false, verbose: false }).parseBuffer(
              pdfBuffer,
              async (err: any, item: any) => {
                if (err) {
                  this.logger.error(`Error parsing PDF ${url}`);
                  this.logger.error(err);
                  resolve();
                } else if (!item) {
                  finalText = finalText.replace(/(\r\n|\n|\r){3,}/gm, "\n\n");
                  /*this.logger.debug(
                    `Got final PDF text: ${
                      finalText ? finalText.slice(0, 100) : ""
                    }`
                  );*/
                  await this.processPageText(
                    finalText,
                    subProblemIndex,
                    url,
                    type,
                    entityIndex,
                    policy
                  );
                  resolve();
                } else if (item.text) {
                  finalText += item.text + " ";
                }
              }
            );
          } catch (e) {
            this.logger.error(`No PDF buffer`);
            this.logger.error(e);
            resolve();
          }
        } else {
          this.logger.error(`No PDF buffer`);
          resolve();
        }
      } catch (e) {
        this.logger.error(`Error in get pdf`);
        this.logger.error(e);
        resolve();
      }
    });
  }

  async getAndProcessHtml(
    subProblemIndex: number | undefined,
    url: string,
    browserPage: Page,
    type:
      | IEngineWebPageTypes
      | PSEvidenceWebPageTypes
      | PSRootCauseWebPageTypes,
    entityIndex: number | undefined,
    policy: PSPolicy | undefined = undefined
  ) {
    try {
      let finalText, htmlText;

      this.logger.debug(`Getting HTML for ${url}`);

      const directoryPath = `webPagesCache/${this.memory ? this.memory.groupId : `webResearchId${subProblemIndex}`}`;
      const fileName = encodeURIComponent(url) + '.gz';
      const fullPath = join(directoryPath, fileName);

      // Create the directory if it doesn't exist
      if (!existsSync(directoryPath)) {
          mkdirSync(directoryPath, { recursive: true });
      }

      if (existsSync(fullPath) && statSync(fullPath).isFile()) {
        this.logger.info("Got cached HTML");
        const cachedData = await readFileAsync(fullPath);
        htmlText = gunzipSync(cachedData).toString();
      } else {
        const sleepingForMs =
          IEngineConstants.minSleepBeforeBrowserRequest +
          Math.random() *
            IEngineConstants.maxAdditionalRandomSleepBeforeBrowserRequest;

        this.logger.info(`Fetching HTML page ${url} in ${sleepingForMs} ms`);

        await new Promise((r) => setTimeout(r, sleepingForMs));

        const response = await browserPage.goto(url, {
          waitUntil: "networkidle0",
        });
        if (response) {
          htmlText = await response.text();
          if (htmlText) {
            this.logger.debug(`Caching response`);
            const gzipData = gzipSync(Buffer.from(htmlText));
            await writeFileAsync(fullPath, gzipData);
          }
        }
      }

      if (htmlText) {
        finalText = htmlToText(htmlText, {
          wordwrap: false,
          selectors: [
            {
              selector: "a",
              format: "skip",
              options: {
                ignoreHref: true,
              },
            },
            {
              selector: "img",
              format: "skip",
            },
            {
              selector: "form",
              format: "skip",
            },
            {
              selector: "nav",
              format: "skip",
            },
          ],
        });

        finalText = finalText.replace(/(\r\n|\n|\r){3,}/gm, "\n\n");

        //this.logger.debug(`Got HTML text: ${finalText}`);
        await this.processPageText(
          finalText,
          subProblemIndex,
          url,
          type,
          entityIndex,
          policy
        );
      } else {
        this.logger.error(`No HTML text found for ${url}`);
      }
    } catch (e: any) {
      this.logger.error(`Error in get html`);
      this.logger.error(e.stack || e);
    }
  }

  async getAndProcessPage(
    subProblemIndex: number | undefined,
    url: string,
    browserPage: Page,
    type:
      | IEngineWebPageTypes
      | PSEvidenceWebPageTypes
      | PSRootCauseWebPageTypes,
    entityIndex: number | undefined
  ) {
    if (onlyCheckWhatNeedsToBeScanned) {
      const hasPage = await this.webPageVectorStore.webPageExist(
        this.memory.groupId,
        url,
        type as IEngineWebPageTypes,
        subProblemIndex,
        entityIndex
      );
      if (hasPage) {
        this.logger.warn(
          `Already have scanned ${type} / ${subProblemIndex} / ${entityIndex} ${url}`
        );
      } else {
        this.logger.warn(
          `Need to scan ${type} / ${subProblemIndex} / ${entityIndex} ${url}`
        );
      }
    } else {
      if (url.toLowerCase().endsWith(".pdf")) {
        await this.getAndProcessPdf(subProblemIndex, url, type, entityIndex);
      } else {
        await this.getAndProcessHtml(
          subProblemIndex,
          url,
          browserPage,
          type,
          entityIndex
        );
      }
    }

    return true;
  }

  async processSubProblems(browser: Browser) {
    const searchQueryTypes = [
      "general",
      "scientific",
      "openData",
      "news",
    ] as const;
    const promises = [];

    for (
      let s = 0;
      s <
      Math.min(this.memory.subProblems.length, IEngineConstants.maxSubProblems);
      s++
    ) {
      promises.push(
        (async () => {
          const newPage = await browser.newPage();
          newPage.setDefaultTimeout(IEngineConstants.webPageNavTimeout);
          newPage.setDefaultNavigationTimeout(
            IEngineConstants.webPageNavTimeout
          );

          await newPage.setUserAgent(IEngineConstants.currentUserAgent);

          for (const searchQueryType of searchQueryTypes) {
            this.logger.info(
              `Fetching pages for ${this.memory.subProblems[s].title} for ${searchQueryType} search results`
            );

            const urlsToGet = this.getUrlsToFetch(
              this.memory.subProblems[s].searchResults!.pages[searchQueryType]
            );

            for (let i = 0; i < urlsToGet.length; i++) {
              await this.getAndProcessPage(
                s,
                urlsToGet[i],
                newPage,
                searchQueryType,
                undefined
              );
            }

            this.memory.subProblems[s].haveScannedWeb = true;

            await this.processEntities(s, searchQueryType, newPage);

            await this.saveMemory();
          }

          await newPage.close();

          this.logger.info(
            `Finished and closed page for ${this.memory.subProblems[s].title}`
          );
        })()
      );
    }

    await Promise.all(promises);
  }

  async processEntities(
    subProblemIndex: number,
    searchQueryType: IEngineWebPageTypes,
    browserPage: Page
  ) {
    for (
      let e = 0;
      e <
      Math.min(
        this.memory.subProblems[subProblemIndex].entities.length,
        IEngineConstants.maxTopEntitiesToSearch
      );
      e++
    ) {
      const currentEntity =
        this.memory.subProblems[subProblemIndex].entities[e];

      this.logger.info(
        `Fetching pages for Entity ${currentEntity.name} for ${this.memory.subProblems[subProblemIndex].title} for ${searchQueryType} search results`
      );

      const urlsToGet = this.getUrlsToFetch(
        this.memory.subProblems[subProblemIndex].entities[e].searchResults!
          .pages[searchQueryType]
      );

      for (let i = 0; i < urlsToGet.length; i++) {
        await this.getAndProcessPage(
          subProblemIndex,
          urlsToGet[i],
          browserPage,
          searchQueryType,
          e
        );
      }

      this.memory.subProblems[subProblemIndex].entities[e].haveScannedWeb =
        true;
    }
  }

  getUrlsToFetch(allPages: IEngineSearchResultItem[]): string[] {
    let outArray: IEngineSearchResultItem[] = [];

    outArray = allPages.slice(
      0,
      Math.floor(
        allPages.length * IEngineConstants.maxPercentOfSolutionsWebPagesToGet
      )
    );

    // Map to URLs and remove duplicates
    const urlsToGet: string[] = Array.from(
      outArray
        .map((p) => p.url)
        .reduce((unique, item) => unique.add(item), new Set())
    ) as string[];

    this.logger.debug(
      `Got ${urlsToGet.length} URLs to fetch ${JSON.stringify(
        urlsToGet,
        null,
        2
      )}`
    );

    return urlsToGet;
  }

  async processProblemStatement(
    searchQueryType: IEngineWebPageTypes,
    browserPage: Page
  ) {
    this.logger.info(
      `Ranking Problem Statement for ${searchQueryType} search results`
    );

    const urlsToGet = this.getUrlsToFetch(
      this.memory.problemStatement.searchResults!.pages[searchQueryType]
    );

    this.logger.debug(`Got ${urlsToGet.length} URLs`);

    for (let i = 0; i < urlsToGet.length; i++) {
      await this.getAndProcessPage(
        undefined,
        urlsToGet[i],
        browserPage,
        searchQueryType,
        undefined
      );
    }

    this.memory.problemStatement.haveScannedWeb = true;

    this.logger.info(
      `Ranking Problem Statement for ${searchQueryType} search results complete`
    );
  }

  async getAllCustomSearchUrls(browserPage: Page) {
    for (
      let subProblemIndex = 0;
      subProblemIndex <
      Math.min(this.memory.subProblems.length, IEngineConstants.maxSubProblems);
      subProblemIndex++
    ) {
      const customUrls =
        this.memory.subProblems[subProblemIndex].customSearchUrls;
      if (customUrls && customUrls.length > 0) {
        for (let i = 0; i < customUrls.length; i++) {
          this.logger.debug(`Getting custom URL ${customUrls[i]}`);
          await this.getAndProcessPage(
            subProblemIndex,
            customUrls[i],
            browserPage,
            "general",
            undefined
          );
        }
      } else {
        this.logger.info(`No custom URLs for sub problem ${subProblemIndex}`);
      }
    }
  }

  async getAllPages() {
    const browser = await puppeteer.launch({ headless: true });
    this.logger.debug("Launching browser");

    const browserPage = await browser.newPage();
    browserPage.setDefaultTimeout(IEngineConstants.webPageNavTimeout);
    browserPage.setDefaultNavigationTimeout(IEngineConstants.webPageNavTimeout);

    await browserPage.setUserAgent(IEngineConstants.currentUserAgent);

    await this.processSubProblems(browser);

    await this.saveMemory();

    await this.getAllCustomSearchUrls(browserPage);

    await this.saveMemory();

    const searchQueryTypes = [
      "general",
      "scientific",
      "openData",
      "news",
    ] as const;

    const processPromises = searchQueryTypes.map(async (searchQueryType) => {
      const newPage = await browser.newPage();
      newPage.setDefaultTimeout(IEngineConstants.webPageNavTimeout);
      newPage.setDefaultNavigationTimeout(IEngineConstants.webPageNavTimeout);

      await newPage.setUserAgent(IEngineConstants.currentUserAgent);

      await this.processProblemStatement(
        searchQueryType as IEngineWebPageTypes,
        newPage
      );

      await newPage.close();
      this.logger.info(`Closed page for ${searchQueryType} search results`);
    });

    await Promise.all(processPromises);

    await this.saveMemory();

    await browser.close();

    this.logger.info("Browser closed");
  }

  async process() {
    this.logger.info("Get Web Pages Processor");
    super.process();

    this.totalPagesSave = 0;

    this.chat = new ChatOpenAI({
      temperature: IEngineConstants.getSolutionsPagesAnalysisModel.temperature,
      maxTokens:
        IEngineConstants.getSolutionsPagesAnalysisModel.maxOutputTokens,
      modelName: IEngineConstants.getSolutionsPagesAnalysisModel.name,
      verbose: IEngineConstants.getSolutionsPagesAnalysisModel.verbose,
    });

    await this.getAllPages();

    this.logger.info(`Saved ${this.totalPagesSave} pages`);
    this.logger.info("Get Web Pages Processor Complete");
  }
}
