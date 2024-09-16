import { nothing } from 'lit';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';
import { PsServerApi } from './PsServerApi.js';
import { PsOperationsBaseNode } from './ps-operations-base-node.js';
import { MdMenu } from '@material/web/menu/menu.js';
export declare class PsAgentNode extends PsOperationsBaseNode {
    agent: PsAgentAttributes;
    agentId: number;
    private agentState;
    private latestMessage;
    private progress;
    private menuOpen;
    menuAnchor: HTMLElement;
    agentMenu: MdMenu;
    api: PsServerApi;
    private statusInterval;
    constructor();
    firstUpdated(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    toggleMenu(e: Event): void;
    addInputConnector(): void;
    addOutputConnector(): void;
    startStatusUpdates(): void;
    stopStatusUpdates(): void;
    updateAgentStatus(): Promise<void>;
    startAgent(): Promise<void>;
    pauseAgent(): Promise<void>;
    stopAgent(): Promise<void>;
    editNode(): void;
    renderActionButtons(): import("lit").TemplateResult<1>;
    renderProgress(): import("lit").TemplateResult<1>;
    render(): import("lit").TemplateResult<1> | typeof nothing;
    static get styles(): (any[] | import("lit").CSSResult)[];
}
//# sourceMappingURL=ps-agent-node.d.ts.map