import { PropertyValueMap } from 'lit';
import '@material/web/fab/fab.js';
import '@material/web/radio/radio.js';
import '@material/web/button/elevated-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@yrpri/webapp/cmp/common/yp-image.js';
import { PsAiChatElement } from './ps-ai-chat-element.js';
import { MdFilledTonalButton } from '@material/web/button/filled-tonal-button.js';
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';
import { YpBaseElement } from '@yrpri/webapp';
import { BaseChatBotServerApi } from './BaseChatBotApi';
import './ps-ai-chat-element.js';
export declare class PsChatAssistant extends YpBaseElement {
    chatLog: PsAiChatWsMessage[];
    infoMessage: string;
    wsClientId: string;
    defaultInfoMessage: string;
    wsEndpoint: string;
    ws: WebSocket;
    inputIsFocused: boolean;
    onlyUseTextField: boolean;
    clusterId: number;
    userScrolled: boolean;
    communityId: number;
    textInputLabel: string;
    currentFollowUpQuestions: string;
    programmaticScroll: boolean;
    scrollStart: number;
    defaultDevWsPort: number;
    sendButton?: MdFilledTonalButton;
    chatElements?: PsAiChatElement[];
    chatInputField?: MdOutlinedTextField;
    chatWindow?: HTMLElement;
    chatMessagesElement?: HTMLElement;
    api: BaseChatBotServerApi;
    heartbeatInterval: number | undefined;
    constructor();
    calcVH(): void;
    handleCtrlPKeyPress(event: KeyboardEvent): void;
    copyLatestDebugInfoToClipboard(): void;
    connectedCallback(): void;
    initWebSockets(): void;
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    sendHeartbeat(): void;
    onWsOpen(): void;
    updated(changedProperties: Map<string | number | symbol, unknown>): void;
    handleScroll(): void;
    disconnectedCallback(): void;
    onMessage(event: MessageEvent): Promise<void>;
    scrollDown(): void;
    addToChatLogWithMessage(data: PsAiChatWsMessage, message?: string | undefined, changeButtonDisabledState?: boolean | undefined, changeButtonLabelTo?: string | undefined, refinedCausesSuggestions?: string[] | undefined, rawMessage?: string | undefined): void;
    addChatBotElement(data: PsAiChatWsMessage): void;
    addChatUserElement(data: PsAiChatWsMessage): void;
    sendChatMessage(): Promise<void>;
    get simplifiedChatLog(): PsSimpleChatLog[];
    static get styles(): any[];
    followUpQuestion(event: CustomEvent): void;
    reset(): void;
    toggleDarkMode(): void;
    renderChatInput(): import("lit").TemplateResult<1>;
    render(): import("lit").TemplateResult<1>;
}
//# sourceMappingURL=ps-chat-assistant.d.ts.map