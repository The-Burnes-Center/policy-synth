import { PropertyValueMap, css, html, nothing } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { dia, shapes, util, highlighters, V, layout } from 'jointjs';
import dagre from 'dagre';

import '@material/web/iconbutton/filled-icon-button.js';
import '@material/web/iconbutton/filled-tonal-icon-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/iconbutton/outlined-icon-button.js';

import { CpsStageBase } from '../cps-stage-base.js';

import './ltp-current-reality-tree-node.js';
import { LtpServerApi } from './LtpServerApi.js';

type Cell = dia.Element | dia.Link;

const TESTING = false;

class MyShapeView extends dia.ElementView {
  render() {
    super.render();
    const htmlMarkup = this.model.get('markup');

    // Create a foreignObject with a set size and style
    const foreignObject = V('foreignObject', {
      width: this.model.attributes.nodeType === 'ude' ? 185 : 185,
      height: this.model.attributes.nodeType === 'ude' ? 135 : 107,
      style: 'overflow: visible; display: block;',
    }).node;

    // Append the foreignObject to this.el
    V(this.el).append(foreignObject);

    // Defer the addition of the inner div with the HTML content
    setTimeout(() => {
      const div = document.createElement('div');
      div.setAttribute('class', 'html-element');
      div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      div.style.width =
        this.model.attributes.nodeType === 'ude' ? '185px' : '185px';
      div.style.height =
        this.model.attributes.nodeType === 'ude' ? '135px' : '107px';
      div.className = `causeContainer ${
        this.model.attributes.isRootCause ? 'rootCauseContainer' : ''
      } ${this.model.attributes.nodeType == 'ude' ? 'udeContainer' : ''}`;
      div.innerHTML = `<ltp-current-reality-tree-node
        nodeId="${this.model.attributes.nodeId}"
        crtId="${this.model.attributes.crtId}"
        crtNodeType="${this.model.attributes.nodeType}"
        ${this.model.attributes.isRootCause ? 'isRootCause=1' : ''}
        causeDescription="${this.model.attributes.label}"
      >
      </ltp-current-reality-tree-node>`;

      // Append the div to the foreignObject
      foreignObject.appendChild(div);

      // Force layout recalculation and repaint
      foreignObject.getBoundingClientRect();
    }, 0); // A timeout of 0 ms defers the execution until the browser has finished other processing

    this.update();
    return this;
  }
}

class MyShape extends shapes.devs.Model {
  defaults() {
    return util.deepSupplement(
      {
        type: 'html.MyShape',
        attrs: {},
        markup: '<div></div>',
      },
      shapes.devs.Model.prototype.defaults
    );
  }

  view = MyShapeView;
}

@customElement('ltp-current-reality-tree')
export class LtpCurrentRealityTree extends CpsStageBase {
  @property({ type: Object }) crtData?: LtpCurrentRealityTreeData;
  private graph: dia.Graph;
  private paper: dia.Paper;
  private elements: { [key: string]: dia.Element } = {};
  private selection: dia.Element | null = null;
  private panning = false;
  private lastClientX = 0;
  private lastClientY = 0;
  private debounce: number | undefined;

  api: LtpServerApi;

  constructor() {
    super();
    this.api = new LtpServerApi();
  }

  async connectedCallback() {
    super.connectedCallback();
    window.appGlobals.activity(`CRT - open`);

    this.addEventListener('add-nodes', this.addNodesEvent as EventListener);
    this.addGlobalListener(
      'add-nodes',
      this.addNodesEvent.bind(this) as EventListener
    );

    window.addEventListener('resize', () => {
      this.updatePaperSize();
    });
  }

  private zoom(factor: number, x: number, y: number): void {
    // Get the current scale and calculate the new scale based on the zoom factor
    const currentScale = this.paper.scale().sx; // sx and sy should be the same
    const newScale = currentScale * factor;

    // Calculate the new position for the origin
    const paperRect = this.paper.getComputedSize(); // Get dimensions of the paper
    const centerX = x - paperRect.width / 2;
    const centerY = y - paperRect.height / 2;

    const beta = factor - 1;
    const offsetX = (centerX * beta) / factor;
    const offsetY = (centerY * beta) / factor;

    // Apply the scaling and translation adjustments
    this.paper.translate(
      this.paper.translate().tx - offsetX,
      this.paper.translate().ty - offsetY
    );
    this.paper.scale(newScale, newScale);
  }

  private zoomIn(): void {
    const center = this.paper.getComputedSize(); // or another way to get center
    this.zoom(1.1, center.width / 2, center.height / 2);
  }

  private zoomOut(): void {
    const center = this.paper.getComputedSize(); // or another way to get center
    this.zoom(0.9, center.width / 2, center.height / 2);
  }

  private resetZoom(): void {
    // Reset the origin before resetting the scale
    this.paper.scale(1, 1);
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this.initializeJointJS();
    this.paper.el.addEventListener('wheel', event => {
      if (!event.shiftKey) {
        return; // Only zoom if the Shift key is held down
      }

      event.preventDefault(); // Prevent default scrolling behavior

      // Clear the previous timeout if it exists
      if (this.debounce) {
        clearTimeout(this.debounce);
      }

      // Set a new timeout for the zoom function
      this.debounce = window.setTimeout(() => {
        const localPoint = this.paper.clientToLocalPoint({
          x: event.offsetX,
          y: event.offsetY,
        });
        const newScale = event.deltaY < 0 ? 1.05 : 0.95; // Smaller factors for smoother zoom

        this.zoom(newScale, localPoint.x, localPoint.y);
      }, 5); // Debounce zoom calls to every 50ms
    });
  }

  addNodesEvent(event: CustomEvent<any>) {
    this.addNodes(event.detail.parentNodeId, event.detail.nodes);
  }

  updated(changedProperties: Map<string | number | symbol, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('crtData') && this.crtData) {
      this.updateGraphWithCRTData(this.crtData);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.appGlobals.activity(`CRT - close`);
  }

  private handleNodeDoubleClick(element: dia.Element, zoomOut: boolean = false): void {
    const bbox = element.getBBox();

    if (zoomOut) {
      const centerX = (bbox.x + bbox.width / 2) * this.paper.scale().sx;
      const centerY = (bbox.y + bbox.height / 2) * this.paper.scale().sy;
      const currentScale = this.paper.scale().sx; // Assuming sx and sy are the same

      // Depending on your needs, adjust the zoom-out factor, this example halves the scale
      const zoomFactor = 1 / 4;
      const newScale = Math.max(this.paper.options.zoom.min, currentScale * zoomFactor);

      // Zoom out, centered on the clicked node
      this.zoom(newScale, centerX, centerY);
    } else {
      // Existing logic for zooming in
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;

      // Zoom in to 2x scale, centered on the double-clicked node
      this.zoom(2, centerX, centerY);
    }
  }

  jointNamespace = {};

  private highlightBranch(element: dia.Element): void {
    // Fade all nodes by adding the fadeAway class
    this.graph.getElements().forEach(el => {
      const view = el.findView(this.paper);
      if (view) {
        // Toggle the class off and on to restart the animation
        view.el.classList.remove('fadeAway');
        // Force a reflow
        void view.el.getBoundingClientRect();
        // Re-add the fadeAway class to restart the animation
        view.el.classList.add('fadeAway');
      }
    });

    // Assuming crtData is always updated with the full tree data
    const parents = this.getParentNodes(this.crtData.nodes, element.attributes.nodeId);

    if (parents) {
      // Remove the fade class from the element being highlighted
      const view = element.findView(this.paper);
      if (view) {
        view.el.classList.remove('fadeAway');
      }

      // Remove fade from the nodes in the parents array
      parents.forEach(node => {
        const element = this.elements[node.id];
        if (!element) {
          return;
        }
        const view = element.findView(this.paper);
        if (view) {
          view.el.classList.remove('fadeAway');
        }
      });
    }
  }

  getParentNodes = (
    nodes: LtpCurrentRealityTreeDataNode[], // Pass in crt.nodes here
    currentNodeId: string,
    parentNodes: LtpCurrentRealityTreeDataNode[] = []
  ): LtpCurrentRealityTreeDataNode[] | undefined => {
    for (const node of nodes) {
      // Check if the current node is a direct child of this node
      const isDirectChild =
        node.andChildren?.some(
          (child: LtpCurrentRealityTreeDataNode) => child.id === currentNodeId
        ) ||
        node.orChildren?.some(
          (child: LtpCurrentRealityTreeDataNode) => child.id === currentNodeId
        );

      if (isDirectChild) {
        parentNodes.push(node);
        // Call recursively with the parent node's ID
        return this.getParentNodes(nodes, node.id, parentNodes);
      }

      // Recursively check in andChildren and orChildren
      const andChildrenResult = node.andChildren
        ? this.getParentNodes(node.andChildren, currentNodeId, parentNodes)
        : undefined;
      const orChildrenResult = node.orChildren
        ? this.getParentNodes(node.orChildren, currentNodeId, parentNodes)
        : undefined;

      if (andChildrenResult || orChildrenResult) {
        // If either returns a result, we found the parent node
        if (!parentNodes.includes(node)) {
          parentNodes.push(node);
        }
        return parentNodes;
      }
    }

    return parentNodes.length === 0 ? undefined : parentNodes;
  };

  private findParentNode = (
    nodes: LtpCurrentRealityTreeDataNode[],
    childId: string
  ): LtpCurrentRealityTreeDataNode | null => {
    console.log(`Finding parent for child ID: ${childId}`);
    for (const node of nodes) {
      console.log(`Checking if node ID: ${node.id} is parent of ${childId}`);
      if (this.isParentNode(node, childId)) {
        console.log(`Found parent ID: ${node.id} for child ID: ${childId}`);
        return node;
      }

      // Check if any children have the node as a child
      const foundParentInAndChildren = node.andChildren ? this.findParentNode(node.andChildren, childId) : null;
      if (foundParentInAndChildren) {
        return foundParentInAndChildren;
      }

      const foundParentInOrChildren = node.orChildren ? this.findParentNode(node.orChildren, childId) : null;
      if (foundParentInOrChildren) {
        return foundParentInOrChildren;
      }
    }
    console.log(`No parent found for child ID: ${childId}`);
    return null;
  };

  private isParentNode = (node: LtpCurrentRealityTreeDataNode, childId: string): boolean => {
    // Check in 'andChildren'
    if (node.andChildren && node.andChildren.some(child => child.id === childId)) {
      return true;
    }
    // Check in 'orChildren'
    if (node.orChildren && node.orChildren.some(child => child.id === childId)) {
      return true;
    }
    // Not found in this node's direct children
    return false;
  };

  private findNode = (
    nodes: LtpCurrentRealityTreeDataNode[],
    id: string
  ): LtpCurrentRealityTreeDataNode | null => {
    for (const node of nodes) {
      console.log(`Checking node ID: ${node.id}`);
      if (node.id === id) {
        console.log(`Node found with ID: ${id}`);
        return node;
      }
      if (node.andChildren) {
        const foundInAndChildren = this.findNode(node.andChildren, id);
        if (foundInAndChildren) {
          console.log(`Node found in 'andChildren' with ID: ${id}`);
          return foundInAndChildren;
        }
      }
      if (node.orChildren) {
        const foundInOrChildren = this.findNode(node.orChildren, id);
        if (foundInOrChildren) {
          console.log(`Node found in 'orChildren' with ID: ${id}`);
          return foundInOrChildren;
        }
      }
    }
    console.log(`No node found with ID: ${id}`);
    return null;
  };

  private async initializeJointJS(): Promise<void> {
    const paperContainer = this.shadowRoot?.getElementById(
      'paper-container'
    ) as HTMLElement;

    if (!paperContainer) {
      console.error('Paper container not found');
      return;
    }

    this.graph = new dia.Graph({}, { cellNamespace: this.jointNamespace });
    this.paper = new dia.Paper({
      //@ts-ignore
      elementView: () => MyShapeView,
      el: paperContainer,
      model: this.graph,
      cellViewNamespace: this.jointNamespace,
      width: '100%',
      height: '100%',
      gridSize: 10,
      panning: {
        enabled: false, // Initially disabled
        modifiers: 'mouseMiddle', // Enable panning with the middle mouse button
      },
      zoom: {
        enabled: true, // Initially disabled
        mousewheel: false, // Enable mouse wheel zooming
        wheelEnabled: true, // Enable touchpad pinch zooming
        max: 2, // Set max zoom level
        min: 0.2, // Set min zoom level
        step: 0.2, // Set zoom step increment
      },
      async: true,
      frozen: true,
      sorting: dia.Paper.sorting.APPROX,
      background: { color: 'var(--md-sys-color-surface)' },
      clickThreshold: 10,
      defaultConnector: {
        name: 'rounded',
        // Add attributes for the arrowheads to point upwards
      },
      defaultRouter: {
        name: 'orthogonal',
        args: {
          // Make sure the links go from bottom to top
          startDirections: ['bottom'],
          endDirections: ['top'],
        },
      },
    });

    this.paper.on('element:pointerclick', elementView => {
      debugger;
//      this.selectElement((elementView as any).model as dia.Element);
    });

    this.paper.on('element:pointerdblclick', (cellView: dia.ElementView, evt: dia.Event) => {
      const element = cellView.model as dia.Element;
      if (evt.shiftKey) {
        // Handle zoom out with Shift key held down
        this.handleNodeDoubleClick(element, true);  // Passing true for zooming out
      } if (evt.shiftKey && evt.ctrlKey) {
        // Handle zoom in if Shift key is not held down
        this.handleNodeDoubleClick(element);
      } else {
        this.highlightBranch(element);
      }
    });

    this.paper.on('blank:pointerclick', (elementView, evt) => {
      //this.updatePaperSize();
    });

    // Initialize SVG styles for the paper
    V(paperContainer as any).prepend(
      V('style', {
        type: 'text/css',
      }).text(`
        .joint-element .selection {
            stroke: var(--md-sys-color-surface);
        }
        .joint-link .selection {
            stroke: var(--md-sys-color-surface);
            stroke-dasharray: 5;
            stroke-dashoffset: 10;
            animation: dash 0.5s infinite linear;
        }
        @keyframes dash {
            to {
                stroke-dashoffset: 0;
            }
        }
      `)
    );

    Object.assign(this.jointNamespace, {
      myShapeGroup: {
        MyShape,
        MyShapeView,
      },
      standard: {
        Rectangle: shapes.standard.Rectangle,
      },
    });

    this.paper.unfreeze();
    this.updatePaperSize();

    await this.updateComplete;

    const paperEl = this.paper.el;

    paperEl.addEventListener('mousedown', (event: MouseEvent) => {
      // Middle mouse button is pressed
      if (event.button === 1) {
        this.panning = true;
        this.lastClientX = event.clientX;
        this.lastClientY = event.clientY;
        paperEl.style.cursor = 'move'; // Optional: Change the cursor to a move icon
        event.preventDefault(); // Prevent any default behavior
      }
    });

    paperEl.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.panning) {
        const dx = event.clientX - this.lastClientX;
        const dy = event.clientY - this.lastClientY;

        this.lastClientX = event.clientX;
        this.lastClientY = event.clientY;

        // Manually apply the translation to the paper's viewport
        const currentTranslate = this.paper.translate();
        this.paper.translate(
          currentTranslate.tx + dx,
          currentTranslate.ty + dy
        );
      }
    });

    // Listen for mouse up on the paper element itself
    paperEl.addEventListener('mouseup', (event: MouseEvent) => {
      if (this.panning && event.button === 1) {
        this.panning = false;
        paperEl.style.cursor = 'default'; // Reset the cursor
      }
    });

    // Optionally, listen for the mouse leaving the paper area to also cancel panning
    paperEl.addEventListener('mouseleave', (event: MouseEvent) => {
      if (this.panning) {
        this.panning = false;
        paperEl.style.cursor = 'default'; // Reset the cursor
      }
    });
  }

  private applyDirectedGraphLayout(): void {
    layout.DirectedGraph.layout(this.graph, {
      setLinkVertices: true,
      align: 'UR',
      ranker: 'longest-path',
      rankDir: 'BT', // Adjust as needed
      marginX: 50,
      marginY: 50,
      nodeSep: 120,
      edgeSep: 120,
      rankSep: 120,
    });

    // Additional manual adjustments if needed
    this.graph.getElements().forEach(element => {
      // Adjust positions manually if necessary
    });

    // Translate the graph to ensure consistency in positioning
    const bbox = this.graph.getBBox();
    const diffX = 100 - bbox.x - bbox.width / 2;
    const diffY = 100 - bbox.y - bbox.height / 2;
    this.graph.translate(diffX, diffY);

    //this.updatePaperSize();
  }

  private centerParentNodeOnScreen(parentNodeId: string): void {
    const parentNode = this.elements[parentNodeId];
    if (!parentNode) {
      console.error(`Parent node with ID ${parentNodeId} not found.`);
      return;
    }

    // First, we need to get the current scale so that we can account for it in our calculations
    const currentScale = this.paper.scale().sx; // Assuming uniform scaling for simplicity; sx and sy are the same

    // Fetch the bounding box of the parent node (which includes sub-elements like labels)
    const parentNodeBBox = parentNode.getBBox();

    // Compute the dimensions of the paper's visible area
    const paperSize = this.paper.getComputedSize();

    // Calculate the center of the parent node's bounding box in the coordinates of the current viewport
    const bboxCenterX = parentNodeBBox.x + parentNodeBBox.width / 2;
    const bboxCenterY = parentNodeBBox.y + parentNodeBBox.height / 2;

    // Calculate the center of the paper's visible area
    const paperCenterX = paperSize.width / 2;
    const paperCenterY = paperSize.height / 2;

    // Calculate the desired translation to put the center of the bounding box in the center of the paper
    // We need to account for the current scale because the translation is in unscaled coordinates
    const desiredTx = paperCenterX - bboxCenterX * currentScale;
    const desiredTy = paperCenterY - bboxCenterY * currentScale;

    // Translate the paper by the calculated amount
    this.paper.translate(desiredTx - 107 / 2, desiredTy - 185 / 2);
  }

  private updatePaperSize(): void {
    if (!this.paper) {
      console.warn('Paper not initialized');
      return;
    }

    // Automatically adjust the viewport to fit all the content
    this.paper.transformToFitContent({
      padding: 78,
      minScaleX: 0.2,
      minScaleY: 0.2,
      maxScaleX: 1.1,
      maxScaleY: 1.1,
      preserveAspectRatio: true,
      contentArea: this.graph.getBBox(),
      verticalAlign: 'top',
      horizontalAlign: 'middle',
    });
  }

  private createElement(node: LtpCurrentRealityTreeDataNode): dia.Element {
    //@ts-ignore
    const el = new MyShape({
      // position: { x: Math.random() * 600, y: Math.random() * 400 },
      label: node.description,
      text: node.description,
      nodeId: node.id,
      nodeType: node.type,
      crtId: this.crtData?.id,
      isRootCause: node.isRootCause,
      attrs: {
        //cause: node.description,
      },
      type: 'html.Element',
    });
    el.addTo(this.graph);
    return el;
  }

  private updateGraphWithCRTData(crtData: LtpCurrentRealityTreeData): void {
    // Clear the existing graph elements
    this.graph.clear();
    this.elements = {};

    console.error(
      'Updating graph with CRT data:',
      JSON.stringify(crtData, null, 2)
    ); // Log the entire data being processed

    // Function to recursively create elements/nodes
    const createNodes = (nodeData: LtpCurrentRealityTreeDataNode) => {
      console.log('Creating node for:', nodeData.id); // Log the ID of the node being processed

      const el = this.createElement(nodeData);
      this.elements[nodeData.id] = el;

      const processChildren = (children: LtpCurrentRealityTreeDataNode[]) => {
        children.forEach(childNode => {
          createNodes(childNode); // Recursive call
        });
      };

      if (nodeData.andChildren) {
        processChildren(nodeData.andChildren);
      }
      if (nodeData.orChildren) {
        processChildren(nodeData.orChildren);
      }
    };

    // Create all elements/nodes
    crtData.nodes.forEach(createNodes);

    // Create links for all 'andChildren' and 'orChildren'
    const createLinks = (
      source: dia.Element,
      children: LtpCurrentRealityTreeDataNode[]
    ) => {
      children.forEach(childNode => {
        const targetElement = this.elements[childNode.id];
        if (!targetElement) {
          console.error(
            `Target element not found for node ID: ${childNode.id}`
          );
          return;
        }

        console.log('Creating link from', source.id, 'to', childNode.id); // Log the source and target IDs
        this.createLink(source, targetElement);

        // Recursively create links for nested children
        if (childNode.andChildren) {
          createLinks(targetElement, childNode.andChildren);
        }
        if (childNode.orChildren) {
          createLinks(targetElement, childNode.orChildren);
        }
      });
    };

    crtData.nodes.forEach(node => {
      const sourceElement = this.elements[node.id];
      if (node.andChildren) {
        createLinks(sourceElement, node.andChildren);
      }
      if (node.orChildren) {
        createLinks(sourceElement, node.orChildren);
      }
    });

    setTimeout(() => {
      this.applyDirectedGraphLayout();
      this.updatePaperSize();
    });
  }

  // Function to create a link/edge
  private createLink(source: dia.Element, target: dia.Element): dia.Link {
    if (!source || !target) {
      console.error(`source or target is null ${source} ${target}`);
      return;
    }
    const l = new shapes.standard.Link({
      source: { id: target.id },
      target: { id: source.id },
      attrs: {
        '.connection': {
          stroke: 'var(--md-sys-color-on-surface)',
          'stroke-width': 2,
        },
        '.marker-target': {
          fill: 'var(--md-sys-color-on-surface)',
          d: 'M 10 -5 L 0 0 L 10 5 z',
          // Make sure the marker is at the start of the path (bottom of the source)
          'ref-x': 0.5,
          'ref-y': 0,
        },
      },
      z: 1,
      router: {
        name: 'orthogonal',
        args: {
          startDirections: ['top'],
          endDirections: ['bottom'],
        },
      },
      connector: { name: 'rounded' },
    });

    this.graph.addCell(l);
    return l;
  }

  private selectElement(el: dia.Element | null): void {
    debugger;
    // Deselect the current selection if any
    if (this.selection) {
      this.unhighlightCell(this.selection);
      this.graph.getLinks().forEach(link => this.unhighlightCell(link));
    }

    // Select and highlight the new element
    if (el) {
      this.highlightCell(el);
      this.selection = el;
    } else {
      this.selection = null;
    }
  }

  private highlightCell(cell: Cell): void {
    const view = cell.findView(this.paper);
    if (view) {
      highlighters.addClass.add(
        view,
        cell.isElement() ? 'body' : 'line',
        'selection',
        { className: 'selection' }
      );
    }
  }

  private unhighlightCell(cell: Cell): void {
    const view = cell.findView(this.paper);
    if (view) {
      highlighters.addClass.remove(view, 'selection');
    }
  }

  addNodes(parentNodeId: string, nodes: LtpCurrentRealityTreeDataNode[]): void {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      console.error('No nodes provided to add');
      return;
    }

    const findAndUpdateParentNode = (
      nodeDataArray: LtpCurrentRealityTreeDataNode[],
      parentNodeId: string
    ) => {
      for (const nodeData of nodeDataArray) {
        if (nodeData.id === parentNodeId) {
          // Found the parent node, update its andChildren
          nodeData.andChildren = nodeData.andChildren || [];
          nodeData.andChildren.push(...nodes);
          return true;
        }
        // Recursively search in andChildren and orChildren
        if (
          nodeData.andChildren &&
          findAndUpdateParentNode(nodeData.andChildren, parentNodeId)
        )
          return true;
        if (
          nodeData.orChildren &&
          findAndUpdateParentNode(nodeData.orChildren, parentNodeId)
        )
          return true;
      }
      return false;
    };

    // Start the search from the root nodes
    if (!findAndUpdateParentNode(this.crtData.nodes, parentNodeId)) {
      console.error(`Parent node with ID ${parentNodeId} not found in crtData`);
      return;
    }

    const parentNode = this.elements[parentNodeId];

    if (!parentNode) {
      console.error(`Parent node with ID ${parentNodeId} not found`);
      return;
    }

    nodes.forEach(node => {
      node.andChildren = [];
      node.orChildren = [];
      const newNode = this.createElement(node);
      this.elements[node.id] = newNode;

      // Create a link from the parent node to the new node
      this.createLink(parentNode, newNode);
    });

    this.applyDirectedGraphLayout();
    setTimeout(() => {
      this.centerParentNodeOnScreen(parentNodeId);
    }, 10);
  }

  static get styles() {
    return [
      super.styles,
      css`
        .causeContainer {
          color: var(--md-sys-color-on-secondary-container);
          background-color: var(--md-sys-color-secondary-container);
          border-radius: 16px;
          padding: 0;
        }

        .rootCauseContainer {
          color: var(--md-sys-color-on-primary-container);
          background-color: var(--md-sys-color-primary-container);
          border-radius: 8px;
          padding: 0;
        }

        .udeContainer {
          color: var(--md-sys-color-on-tertiary-container);
          background-color: var(--md-sys-color-tertiary-container);
          border-radius: 8px;
          padding: 0;
        }

        /* Define your component styles here */
        .jointJSCanvas {
          width: 100vw !important;
          height: calc(100vh - 90px) !important;
          overflow-x: auto !important;
          overflow-y: auto !important;
          /* styles for the JointJS canvas */
        }

        .controlPanel {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          margin: 0 0;
          width: 100%;
          position: absolute;
          top: 64px;
          left: 0;
          width: 100%;
          height: 56px;
          padding: 0;
          padding-top: 4px;
          opacity: 1;
          background: transparent;
          color: var(--md-sys-color-on-surface-variant);
        }

        .controlPanelContainer {
          margin: 0 0;
          position: absolute;
          top: 64px;
          left: 0;
          width: 100%;
          height: 62px;
          padding: 0;
          opacity: 0.5;
          background: var(--md-sys-color-surface-variant);
        }

        md-filled-tonal-icon-button {
          margin-left: 8px;
          margin-right: 8px;
        }

        .firstButton {
          margin-left: 16px;
        }

        .lastButton {
          margin-right: 16px;
        }

        @keyframes fadeAwayAnimation {
          0% {
            opacity: 1;
          }
          8% {
            opacity: 0.1;
          }
          100% {
            opacity: 1;
          }
        }

        .fadeAway {
          animation: fadeAwayAnimation 60.5s;
        }

      `,
    ];
  }

  pan(direction: string): void {
    const currentTranslate = this.paper.translate();
    let dx = 0;
    let dy = 0;

    switch (direction) {
      case 'left':
        dx = 25;
        break;
      case 'right':
        dx = -25;
        break;
      case 'up':
        dy = 25;
        break;
      case 'down':
        dy = -25;
        break;
    }

    this.paper.translate(currentTranslate.tx + dx, currentTranslate.ty + dy);
  }

  render() {
    return html`
      <div class="controlPanelContainer"></div>
      <div class="controlPanel">
        <md-filled-tonal-icon-button @click="${this.zoomIn}" class="firstButton"
          ><md-icon>zoom_in</md-icon></md-filled-tonal-icon-button
        >
        <md-filled-tonal-icon-button @click="${this.zoomOut}"
          ><md-icon>zoom_out</md-icon></md-filled-tonal-icon-button
        >
        <md-filled-tonal-icon-button @click="${this.resetZoom}"
          ><md-icon>center_focus_strong</md-icon></md-filled-tonal-icon-button
        >
        <md-filled-tonal-icon-button @click="${this.updatePaperSize}"
          ><md-icon>zoom_out_map</md-icon></md-filled-tonal-icon-button
        >

        <div class="flex"></div>
        <md-icon-button @click="${()=>this.pan('left')}"
          ><md-icon>arrow_back</md-icon></md-icon-button
        >

        <md-icon-button @click="${()=>this.pan('up')}"
          ><md-icon>arrow_upward</md-icon></md-icon-button
        >

        <md-icon-button @click="${()=>this.pan('down')}"
          ><md-icon>arrow_downward</md-icon></md-icon-button
        >

        <md-icon-button @click="${()=>this.pan('right')}" class="lastButton"
          ><md-icon>arrow_forward</md-icon></md-icon-button
        >
      </div>
      <div class="jointJSCanvas" id="paper-container"></div>
    `;
  }
}
