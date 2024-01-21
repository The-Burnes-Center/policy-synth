import { YpBaseElement } from '../@yrpri/common/yp-base-element';
import '@material/web/icon/icon.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/progress/circular-progress.js';
import '../../@yrpri/common/yp-image.js';
import { BaseChatBotServerApi } from './BaseChatBotApi';
export declare class PsAiChatElement extends YpBaseElement {
    message: string;
    sender: 'you' | 'bot';
    detectedLanguage: string;
    clusterId: number;
    type: 'start' | 'error' | 'moderation_error' | 'info' | 'message' | 'thinking' | 'noStreaming' | undefined;
    active: boolean;
    fullReferencesOpen: boolean;
    followUpQuestionsRaw: string;
    followUpQuestions: string[];
    jsonLoading: boolean;
    api: BaseChatBotServerApi;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    stopJsonLoading(): void;
    handleJsonLoadingStart: () => void;
    handleJsonLoadingEnd: (event: any) => void;
    static get styles(): any[];
    get isError(): boolean;
    renderCGImage(): import("lit-html").TemplateResult<1>;
    renderRoboImage(): import("lit-html").TemplateResult<1>;
    renderJson(): import("lit-html").TemplateResult<1>;
    renderChatGPT(): any;
    parseFollowUpQuestions(): void;
    updated(changedProperties: Map<string | number | symbol, unknown>): void;
    renderUser(): import("lit-html").TemplateResult<1>;
    renderNoStreaming(): import("lit-html").TemplateResult<1>;
    renderThinking(): import("lit-html").TemplateResult<1>;
    getThinkingText(): "Thinking..." | "Mõeldes..." | "Hugsa...";
    renderMessage(): any;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=ps-ai-chat-element.d.ts.map