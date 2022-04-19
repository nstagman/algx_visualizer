import './AlgVis.css'
import { AlgXMatrix, AlgXNode, buildMatrix, buildSudMatrix, decodeSolution } from './AlgX';
import { JSXElement, Component, createSignal, createEffect, onMount, batch, untrack } from 'solid-js';


type NodeDrawInfo = { row: number, col: number, focused: boolean, covered: boolean, solution: boolean };
type LinkDrawInfo = {
  dir: 'up' | 'down' | 'left' | 'right',
  draw: boolean, //enable drawing flag
  animating: boolean, //link is currently animating
  reverse: boolean, //'unlink' animation is occuring
  pct: number, //percent animation complete
};

const AlgXAnimator: Component<any> = (props: any): JSXElement => {
  //matrix size
  const[nodeSize, setNodeSize] = createSignal(9);
  const lineWidth = 1;
  let linkLen = nodeSize();
  let gridSize = nodeSize() + linkLen
  //colors
  // const canvasColor = 'rgba(255, 255, 255, 1.0)';
  const canvasColor = 'rgba(0, 0, 0, 1.0)';
  const nodeColor = 'rgba(11, 127, 171, 1.0)';
  const nodeCoveredColor = 'rgba(193, 208, 240, 1.0)';
  const nodeFocusedColor = 'rgba(255, 225, 75, 1.0)';
  const nodeSolutionColor = 'rgba(10, 240, 140, 1.0)';
  const linkColor = 'rgba(153, 51, 51, 1.0)';
  const linkCoveredColor = '#CCCCCC';
  //animation
  const hz = 60; //target fps
  const tickRate = 1000/hz; //normalized animation update time

  //component state and reference variables
  let canvas: any;
  let ctx: CanvasRenderingContext2D;
  let lastUpdate: number;
  let elapsedTicks: number = 0;
  let animationComplete: any | null = null;
  let animationStep = 5;
  let stepComplete: any | null = null;
  let stepMode: boolean = false;
  let scaleSlider: any;
  let speedSlider: any;

  //solidjs reactive signals for runtime updates
  const [getWidth, setWidth] = createSignal(1);
  const [getHeight, setHeight] = createSignal(1);
  const [getMatrix, setMatrix] = createSignal(buildMatrix([0,0], 1, 1));
  const [getSolution, setSolution] = createSignal(getMatrix().solution.slice());

  //solidjs effects runs everytime a signal within the effect is updated
  createEffect(() => {
    initCanvas();
  });
  createEffect(() => {
    updateMatrix();
  });
  createEffect(() => {
    updateUISolution();
  });

  //solidjs built-in effect, runs one time after the first render of this component
  onMount(() => {
    ctx = canvas.getContext('2d');
    scaleSlider.value = 4;
    speedSlider.value = 3;
    updateMatrix();
    initCanvas();
    lastUpdate = performance.now();
    updateCanvas();
  });

  //reactively set canvas size based on matrix size
  const initCanvas = (): void => {
    linkLen = nodeSize();
    gridSize = nodeSize() + linkLen;
    setWidth(gridSize * getMatrix().cols.length + gridSize*2.5);
    setHeight(gridSize * getMatrix().rows.length + gridSize*2.5);
    setSolution(getMatrix().solution.slice());
  };

  //make the constraint matrix react to changes in the UI
  const updateMatrix = (): void => {
    let matrixData: Array<number> = [];
    for(let i=0; i<props.UIState.length; i++){
        matrixData.push(props.UIState[i].manValue());
    }
    if(props.sudoku){ setMatrix(buildSudMatrix(matrixData)); }
    else{ setMatrix(buildMatrix(matrixData, props.rows, props.cols)); }
  };

  //reflect the current partial solution back to the UI
  const updateUISolution = (): void => {
    batch(() => {
      if(!props.sudoku){
        for(const [i, square] of props.UIState.entries()){
          if(getSolution().includes((i/props.cols)|0) && untrack(() => square.manValue()) > 0){
            square.setSolution(true);
          }
          else{ square.setSolution(false); }
        }
      }
      else{
        const decodedSolution: Array<number> = decodeSolution(getSolution(), props.UIState.length);
        for(const [i, sol] of decodedSolution.entries()){
          const square = props.UIState[i];
          if(square != null && untrack(() => square.manValue()) === 0){
            square.setValue(sol);
            if(sol > 0){ square.setSolution(true); }
            else{ square.setSolution(false); }
          }
        }
      }
    });
  };

  //canvas main loop - draws and animates the matrix on the canvas
  const updateCanvas = (): void => {
    requestAnimationFrame(updateCanvas);
    const now = performance.now()
    const dt = (now - lastUpdate);
    if(dt > tickRate){
      elapsedTicks = (dt / tickRate)|0;
      updateAnimationStatus();
      drawMatrix();
      lastUpdate = now;
    }
  };

  //resolves animationComplete Promise if no animation is happening
  const updateAnimationStatus = (): void => {
    if(animationComplete === null) { return; }
    //check if any link is currently animating
    const animating = getMatrix().allNodeMap((node: AlgXNode): boolean => {
      for(const link of Object.values(node.linkInfo)){
        if(link.animating){ return true; }
      }
      return false;
    });

    if(animating){ return; }
    animationComplete.resolve(true);
  };

  const drawMatrix = (): void => {
    //shift canvas coordinates to allow negative node columns and rows (headers)
    ctx.clearRect(0, 0, getWidth(), getHeight());
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, getWidth(), getHeight());
    ctx.save()
    ctx.translate(2*gridSize, 2*gridSize);

    //draw each node
    getMatrix().allNodeMap((node: AlgXNode): void => {
      drawNode(node.nodeInfo);
    });

    //draw all 4 links of each node
    ctx.beginPath()
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = lineWidth;
    getMatrix().allNodeMap((node: AlgXNode): void => {
      drawUpLink(node.linkInfo.up, node.nodeInfo, node.up.nodeInfo);
      drawDownLink(node.linkInfo.down, node.nodeInfo, node.down.nodeInfo);
      drawLeftLink(node.linkInfo.left, node.nodeInfo, node.left.nodeInfo);
      drawRightLink(node.linkInfo.right, node.nodeInfo, node.right.nodeInfo);
    });
    ctx.stroke();
    ctx.restore();
  };

  const drawNode = (node: NodeDrawInfo):void => {
    ctx.fillStyle = nodeColor;
    if(node.covered){ ctx.fillStyle = nodeCoveredColor; }
    if(node.focused){ ctx.fillStyle = nodeFocusedColor; }
    if(node.solution){ ctx.fillStyle = nodeSolutionColor; }
    let x, y;
    [x,y] = nodeTop(node);
    x -= nodeSize()/2;
    ctx.beginPath();
    ctx.rect(x, y, nodeSize(), nodeSize());
    ctx.fill();
  };

  const drawUpLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo): void => {
    if(!link.draw){ return; }

    if(link.animating){ updateLinkAnimationLength(link); }
    let wrapping: boolean; //determine if link wraps around matrix
    let x: number;
    let y: number;
    let currentLength: number; //amount of link to draw this update
    let line1Length: number; //distance between 2 nodes - or distance from node to edge of matrix if wrapping
    let line2Length: number; //used for drawing the second line if the link wraps

    //determine line lengths
    wrapping = n2.row > n1.row;
    line1Length = wrapping ? gridSize*n1.row + 1.5*gridSize : (n1.row - n2.row) * gridSize - nodeSize();
    line2Length = wrapping ? gridSize*(getMatrix().rows.length - n2.row) - 0.5*gridSize: 0;
    currentLength = (line1Length + line2Length) * link.pct/100;
    //move to top of node and draw the current length of link upward
    [x,y] = nodeTop(n1);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - (currentLength < line1Length ? currentLength : line1Length));

    //draw second line if wrapping
    if(currentLength > line1Length && wrapping){
      currentLength -= line1Length; //remove already drawn portion of length
      //move to bottom of matrix and draw remainder of link towards node 2
      [x,y] = nodeBottom(n2);
      y += line2Length;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - currentLength);
    }
    updateLinkAnimationState(link);
  }

  const drawDownLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo): void => {
    if(!link.draw){ return; }

    if(link.animating){ updateLinkAnimationLength(link); }
    let wrapping: boolean; //determine if link wraps around matrix
    let x: number;
    let y: number;
    let currentLength: number; //amount of link to draw this update
    let line1Length: number; //distance between 2 nodes - or distance from node to edge of matrix if wrapping
    let line2Length: number; //used for drawing the second line if the link wraps

    //determine line lengths
    wrapping = n2.row < n1.row;
    line1Length = wrapping ? gridSize*(getMatrix().rows.length - n1.row) - 0.5*gridSize: (n2.row - n1.row) * gridSize - nodeSize();
    line2Length = wrapping ? gridSize*n2.row + 1.5*gridSize : 0;
    currentLength = (line1Length + line2Length) * link.pct/100;
    //move to bottom of node and draw the current length of link downward
    [x,y] = nodeBottom(n1);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + (currentLength < line1Length ? currentLength : line1Length));

    //draw second line if wrapping
    if(currentLength > line1Length && wrapping){
      currentLength -= line1Length; //remove already drawn portion of length
      //move to top of matrix and draw remainder of link towards node 2
      [x,y] = nodeTop(n2);
      y -= line2Length;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + currentLength);
    }
    updateLinkAnimationState(link);
  }

  const drawLeftLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo): void => {
    if(!link.draw){ return; }

    if(link.animating){ updateLinkAnimationLength(link); }
    let wrapping: boolean; //determine if link wraps around matrix
    let x: number;
    let y: number;
    let currentLength: number; //amount of link to draw this update
    let line1Length: number; //distance between 2 nodes - or distance from node to edge of matrix if wrapping
    let line2Length: number; //used for drawing the second line if the link wraps

    //determine line lengths
    wrapping = n2.col > n1.col;
    line1Length = wrapping ? gridSize*n1.col + 1.5*gridSize : (n1.col - n2.col) * gridSize - nodeSize();
    line2Length = wrapping ? gridSize*(getMatrix().cols.length - n2.col) - 0.5*gridSize : 0;
    currentLength = (line1Length + line2Length) * link.pct/100;
    //move to left of node and draw the current length of link leftward
    [x,y] = nodeLeft(n1);
    ctx.moveTo(x, y);
    ctx.lineTo(x - (currentLength < line1Length ? currentLength : line1Length), y);

    //draw second line if wrapping
    if(currentLength > line1Length && wrapping){
      currentLength -= line1Length; //remove already drawn portion of length
      //move to right of matrix and draw remainder of link towards node 2
      [x,y] = nodeRight(n2);
      x += line2Length;
      ctx.moveTo(x, y);
      ctx.lineTo(x - currentLength, y);
    }
    updateLinkAnimationState(link);
  }

  const drawRightLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo): void => {
    if(!link.draw){ return; }

    if(link.animating){ updateLinkAnimationLength(link); }
    let wrapping: boolean; //determine if link wraps around matrix
    let x: number;
    let y: number;
    let currentLength: number; //amount of link to draw this update
    let line1Length: number; //distance between 2 nodes - or distance from node to edge of matrix if wrapping
    let line2Length: number; //used for drawing the second line if the link wraps

    //determine line lengths
    wrapping = n2.col < n1.col;
    line1Length = wrapping ? gridSize*(getMatrix().cols.length - n1.col) - 0.5*gridSize: (n2.col - n1.col) * gridSize - nodeSize();
    line2Length = wrapping ? gridSize*n2.col + 1.5*gridSize : 0;
    currentLength = (line1Length + line2Length) * link.pct/100;
    //move to right of node and draw the current length of link rightward
    [x,y] = nodeRight(n1);
    ctx.moveTo(x, y);
    ctx.lineTo(x + (currentLength < line1Length ? currentLength : line1Length), y);

    //draw second line if wrapping
    if(currentLength > line1Length && wrapping){
      currentLength -= line1Length; //remove already drawn portion of length
      //move to left of matrix and draw remainder of link towards node 2
      [x,y] = nodeLeft(n2);
      x -= line2Length;
      ctx.moveTo(x, y);
      ctx.lineTo(x + currentLength, y);
    }
    updateLinkAnimationState(link);
  }

  //modify link.pct based on the animationStep value
  const updateLinkAnimationLength = (link: LinkDrawInfo): void => {
    if(!link.reverse){
      link.pct = link.pct + elapsedTicks*animationStep >= 100 ? 100 : link.pct + elapsedTicks*animationStep;
    }
    else{
      link.pct = link.pct - elapsedTicks*animationStep <= 0 ? 0 : link.pct - elapsedTicks*animationStep;
    }
  }

  //update link state variables
  const updateLinkAnimationState = (link: LinkDrawInfo): void => {
    if(!link.reverse && link.pct >= 100){
      link.animating = false; 
      link.draw = true;
      link.pct = 100;
    }
    else if(link.reverse && link.pct <= 0){
      link.animating = false;
      link.pct = 0;
      link.reverse = false;
    }
    if(link.pct === 0){
      link.draw = false; //don't draw links that have been retracted
    }
  }

  //translates matrix row, col position to a tuple of canvas coordinates for a given node
  const nodeCenter = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize()/2, node.row*gridSize + nodeSize()/2];
  };
  const nodeTop = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize()/2, node.row*gridSize];
  };
  const nodeBottom = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize()/2, node.row*gridSize + nodeSize()];
  };
  const nodeLeft = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize, node.row*gridSize + nodeSize()/2];
  };
  const nodeRight = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize(), node.row*gridSize + nodeSize()/2];
  };

  //button callbacks
  const solveCB = async (event: MouseEvent): Promise<void> => {
    for(const update of getMatrix().animatedAlgXSearch()){
      if(update === 0 || stepMode){ //no timeout specified - wait for animator to finish this step
        await (animationComplete = getExposedPromise());
        animationComplete = null;
      }
      if(stepMode){
        await (stepComplete = getExposedPromise());
        stepComplete = null;
      }
      setSolution(getMatrix().solution.slice());
    }
  };
  const stepCB = (event: MouseEvent): void => {
    if(stepComplete !== null){ stepComplete.resolve(true); }
  };
  const enableStepModeCB = (event: MouseEvent): void => {
    stepMode = stepMode ? false : true;
  };
  const scaleSliderCB = (event: Event): void => {
    const val = Number(scaleSlider.value);
    switch(val){
      case 1:
        setNodeSize(3);
        break;
      case 2:
        setNodeSize(5);
        break;
      case 3:
        setNodeSize(7);
        break;
      case 4:
        setNodeSize(9);
        break;
      case 5:
        setNodeSize(11);
        break;
      default:
    }
  };
  const speedSliderCB = (event: Event): void => {
    const val = Number(speedSlider.value);
    switch(val){
      case 1:
        animationStep = 1;
        break;
      case 2:
        animationStep = 2;
        break;
      case 3:
        animationStep = 5;
        break;
      case 4:
        animationStep = 10;
        break;
      case 5:
        animationStep = 100;
        break;
      default:
    }
  };

  //returns a promise object with exposed resolve and reject handles
  //this is used to let the canvas update loop resolve a promise created by the AlgXSearch executor
  const getExposedPromise = (): any => {
    let res, rej, promise: any;
    promise = new Promise((_res, _rej) => {
      res = _res;
      rej = _rej;
    });
    promise.resolve = res;
    promise.reject = rej;
    return promise;
  };

  //return the solidjs component
  return(
    <div className='Animator'>
      <div>
        <button onClick={solveCB}> solve </button>
        <button onClick={stepCB}> step </button>
        <button onClick={enableStepModeCB}> stepMode </button>
        <input type='range' id='scale' ref={scaleSlider} min='1' max='5' onInput={scaleSliderCB}/>
        <input type='range' id='speed' ref={speedSlider} min='1' max='5' onInput={speedSliderCB}/>
      </div>
      <div className='solution'>
        {getSolution().length > 0 ? getSolution().join(' ') : '\u00A0'}
      </div>
      <canvas ref={canvas} width={getWidth()} height={getHeight()}/>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
