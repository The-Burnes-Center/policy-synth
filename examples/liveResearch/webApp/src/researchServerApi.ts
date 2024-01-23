import { YpServerApi } from "@yrpri/webapp";

export class ResearchServerApi extends YpServerApi {
  constructor(urlPath: string = '/api') {
    super();
    this.baseUrlPath = urlPath;
  }

  public conversation(
    chatLog: PsSimpleChatLog[],
    wsClientId: string,
  ): Promise<void> {

    return this.fetchWrapper(
      this.baseUrlPath + `/live_research_chat/`,
      {
        method: 'PUT',
        body: JSON.stringify({ wsClientId, chatLog: chatLog }),
      },
      false
    ) as Promise<void>;
  }

}