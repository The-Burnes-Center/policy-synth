import { TemplateResult } from 'lit';
import 'urlpattern-polyfill';
import '@material/web/labs/navigationbar/navigation-bar.js';
import '@material/web/labs/navigationtab/navigation-tab.js';
import '@material/web/labs/navigationdrawer/navigation-drawer.js';
import '@material/web/list/list-item.js';
import '@material/web/list/list.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@material/mwc-snackbar/mwc-snackbar.js';
import '@material/web/menu/menu.js';
import '@yrpri/webapp/common/yp-image.js';
import './policies/ps-web-research.js';
import { PsServerApi } from './base/PsServerApi.js';
import { PsAppGlobals } from './base/PsAppGlobals.js';
import './ps-home.js';
import './operations/ps-operations-manager.js';
import '@material/web/dialog/dialog.js';
import '@material/web/button/elevated-button.js';
import '@material/web/textfield/outlined-text-field.js';
import { PsRouter } from './base/router/router.js';
import { YpBaseElement } from '@yrpri/webapp/common/yp-base-element.js';
declare global {
    interface Window {
        psAppGlobals: PsAppGlobals;
        psServerApi: PsServerApi;
    }
}
export declare class PsAgentOperationsWebApp extends YpBaseElement {
    currentProjectId: number | undefined;
    activeSubProblemIndex: number | undefined;
    activePopulationIndex: number | undefined;
    activeSolutionIndex: number | undefined;
    activePolicyIndex: number | undefined;
    pageIndex: number;
    currentMemory: PsBaseMemoryData | undefined;
    totalNumberOfVotes: number;
    showAllCosts: boolean;
    lastSnackbarText: string | undefined;
    collectionType: string;
    earlName: string;
    currentError: string | undefined;
    forceGetBackupForProject: string | undefined;
    tempPassword: string | undefined;
    localStorageThemeColorKey: string;
    themeColor: string;
    themePrimaryColor: string;
    themeSecondaryColor: string;
    themeTertiaryColor: string;
    themeNeutralColor: string;
    themeNeutralVariantColor: string;
    themeScheme: MaterialColorScheme;
    themeVariant: MaterialDynamicVariants | undefined;
    themeHighContrast: boolean;
    isAdmin: boolean;
    surveyClosed: boolean;
    appearanceLookup: string;
    currentLeftAnswer: string;
    currentRightAnswer: string;
    numberOfSolutionsGenerations: number;
    numberOfPoliciesIdeasGeneration: number;
    totalSolutions: number;
    totalPros: number;
    totalCons: number;
    constructor();
    setupDebugScroll(): void;
    router: PsRouter;
    renderAgentPage(agentId?: string | undefined): TemplateResult<1>;
    getServerUrlFromClusterId(clusterId: number): "https://betrireykjavik.is/api" | "https://ypus.org/api" | "https://yrpri.org/api";
    connectedCallback(): void;
    boot(): Promise<void>;
    disconnectedCallback(): void;
    getHexColor(color: string): string;
    themeChanged(target?: HTMLElement | undefined): void;
    snackbarclosed(): void;
    _displaySnackbar(event: CustomEvent): Promise<void>;
    _setupEventListeners(): void;
    _removeEventListeners(): void;
    updated(changedProperties: Map<string | number | symbol, unknown>): void;
    _appError(event: CustomEvent): void;
    get adminConfirmed(): boolean;
    _settingsColorChanged(event: CustomEvent): void;
    static get styles(): import("lit").CSSResult[];
    updateThemeColor(event: CustomEvent): void;
    toggleDarkMode(): void;
    toggleHighContrastMode(): void;
    setupTheme(): void;
    toCamelCase(str: string): string;
    renderContentOrLoader(content: TemplateResult): TemplateResult;
    handleShowMore(event: CustomEvent): void;
    renderThemeToggle(hideText?: boolean): TemplateResult<1>;
    render(): TemplateResult<1>;
}
//# sourceMappingURL=ps-app.d.ts.map