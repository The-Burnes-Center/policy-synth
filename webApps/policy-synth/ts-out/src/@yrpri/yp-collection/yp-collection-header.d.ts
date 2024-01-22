import { nothing } from 'lit';
import { YpBaseElement } from '../common/yp-base-element.js';
import '../common/yp-image.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';
import '../yp-magic-text/yp-magic-text.js';
import './yp-collection-stats.js';
export declare class YpCollectionHeader extends YpBaseElement {
    collection: YpCollectionData | undefined;
    collectionType: string | undefined;
    hideImage: boolean;
    flaggedContentCount: number | undefined;
    collectionVideoId: number | undefined;
    welcomeHTML: string | undefined;
    playStartedAt: Date | undefined;
    videoPlayListener: Function | undefined;
    videoPauseListener: Function | undefined;
    videoEndedListener: Function | undefined;
    audioPlayListener: Function | undefined;
    audioPauseListener: Function | undefined;
    audioEndedListener: Function | undefined;
    get hasCollectionAccess(): boolean;
    get collectionVideos(): Array<YpVideoData> | undefined;
    get openMenuLabel(): string;
    get collectionHeaderImages(): Array<YpImageData> | undefined;
    get collectionVideoURL(): string | undefined;
    get collectionVideoPosterURL(): string | undefined;
    get collectionHeaderImagePath(): string | undefined;
    static get styles(): any[];
    renderStats(): typeof nothing | import("lit-html").TemplateResult<1>;
    renderFirstBoxContent(): typeof nothing | import("lit-html").TemplateResult<1>;
    _openMenu(): void;
    renderMenu(): import("lit-html").TemplateResult<1>;
    renderFooter(): import("lit-html").TemplateResult<1>;
    render(): import("lit-html").TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    firstUpdated(changedProperties: Map<string | number | symbol, unknown>): void;
    updated(changedProperties: Map<string | number | symbol, unknown>): void;
    _pauseMediaPlayback(): void;
    _menuSelection(event: CustomEvent): void;
}
//# sourceMappingURL=yp-collection-header.d.ts.map