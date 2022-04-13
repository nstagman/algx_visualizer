import './AlgVis.css'
import { AlgXMatrix, AlgXNode, buildMatrix, buildSudMatrix, buildTest, decodeSolution } from './AlgX';
import { JSXElement, Component, createSignal, createEffect, onMount, For } from 'solid-js';


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
  const nodeSize = 9;
  const lineWidth = 1;
  const linkLen = nodeSize;
  const gridSize = nodeSize + linkLen
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
  let stepComplete: any | null = null;
  let stepMode: boolean = false;

  //solidjs reactive signals for runtime updates
  const [getWidth, setWidth] = createSignal(0);
  const [getHeight, setHeight] = createSignal(0);
  const [getMatrix, setMatrix] = createSignal(buildMatrix([0,0,0,0,], 2, 2));
  const [getSolution, setSolution] = createSignal({equals: false});
  const [getAnimationStep, setAnimationStep] = createSignal(5); //% increase in link length per animation tick

  //reactively set canvas size based on matrix size
  const initCanvas = (): void => {
    setMatrix(buildSudMatrix(props.UIState.map((idx: any) => {return idx.getValue(); })));
    setWidth(gridSize * getMatrix().cols.length + gridSize*2.5);
    setHeight(gridSize * props.getMatrix.rows.length + gridSize*2.5);
    setSolution(props.getMatrix.solution);
  };

  //solidjs effect - this causes initCanvas to run anytime a solidjs signal used by initCanvas (getMatrix) changes
  createEffect(() => {
    initCanvas();
  });

  //solidjs built-in effect, runs one time after the first render of this component
  onMount(() => {
    ctx = canvas.getContext('2d');
    initCanvas();
    lastUpdate = performance.now();
    updateCanvas();
  });

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
    const animating = props.getMatrix.allNodeMap((node: AlgXNode): boolean => {
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
    props.getMatrix.allNodeMap((node: AlgXNode): void => {
      drawNode(node.nodeInfo);
    });

    //draw all 4 links of each node
    ctx.beginPath()
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = lineWidth;
    props.getMatrix.allNodeMap((node: AlgXNode): void => {
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
    x -= nodeSize/2;
    ctx.beginPath();
    ctx.rect(x, y, nodeSize, nodeSize);
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
    line1Length = wrapping ? gridSize*n1.row + 1.5*gridSize : (n1.row - n2.row) * gridSize - nodeSize;
    line2Length = wrapping ? gridSize*(props.getMatrix.rows.length - n2.row) - 0.5*gridSize: 0;
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
    line1Length = wrapping ? gridSize*(props.getMatrix.rows.length - n1.row) - 0.5*gridSize: (n2.row - n1.row) * gridSize - nodeSize;
    line2Length = wrapping ? gridSize*n2.row + 1.5*gridSize : 0;
    currentLength = (line1Length + line2Length) * link.pct/100;
    //move to bottom of node and draw the current length of link downward
    [x,y] = nodeBottom(n1);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + (currentLength < line1Length ? currentLength : line1Length));

    //draw second line for wrapping
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
    line1Length = wrapping ? gridSize*n1.col + 1.5*gridSize : (n1.col - n2.col) * gridSize - nodeSize;
    line2Length = wrapping ? gridSize*(props.getMatrix.cols.length - n2.col) - 0.5*gridSize : 0;
    currentLength = (line1Length + line2Length) * link.pct/100;
    //move to left of node and draw the current length of link leftward
    [x,y] = nodeLeft(n1);
    ctx.moveTo(x, y);
    ctx.lineTo(x - (currentLength < line1Length ? currentLength : line1Length), y);

    //draw second line for wrapping
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
    line1Length = wrapping ? gridSize*(props.getMatrix.cols.length - n1.col) - 0.5*gridSize: (n2.col - n1.col) * gridSize - nodeSize;
    line2Length = wrapping ? gridSize*n2.col + 1.5*gridSize : 0;
    currentLength = (line1Length + line2Length) * link.pct/100;
    //move to right of node and draw the current length of link rightward
    [x,y] = nodeRight(n1);
    ctx.moveTo(x, y);
    ctx.lineTo(x + (currentLength < line1Length ? currentLength : line1Length), y);

    //draw second line for wrapping
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
      link.pct = link.pct + elapsedTicks*getAnimationStep() >= 100 ? 100 : link.pct + elapsedTicks*getAnimationStep();
    }
    else{
      link.pct = link.pct - elapsedTicks*getAnimationStep() <= 0 ? 0 : link.pct - elapsedTicks*getAnimationStep();
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
    return [node.col*gridSize + nodeSize/2, node.row*gridSize + nodeSize/2];
  };
  const nodeTop = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize/2, node.row*gridSize];
  };
  const nodeBottom = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize/2, node.row*gridSize + nodeSize];
  };
  const nodeLeft = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize, node.row*gridSize + nodeSize/2];
  };
  const nodeRight = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize, node.row*gridSize + nodeSize/2];
  };

  //button callbacks
  const solveCB = async (event: MouseEvent): Promise<void> => {
    // let puzzle: Array<number> = [];
    // for(const cell of props.boardState){
    //   puzzle.push(cell.getValue());
    // }
    // setMatrix(buildSudMatrix(puzzle));
    for(const update of props.getMatrix.animatedAlgXSearch()){
      if(update === 0 || stepMode){ //no timeout specified - wait for animator to finish this step
        await (animationComplete = getExposedPromise());
        animationComplete = null;
      }
      if(stepMode){
        await (stepComplete = getExposedPromise());
        stepComplete = null;
      }
    }
  };
  const testCB = async (event: MouseEvent): Promise<void> => {
    // setMatrix(buildTest());
    for(const update of props.getMatrix.animatedAlgXSearch()){
      setSolution((props.getMatrix.solution));
      if(update === 0 || stepMode){ //no timeout specified - wait for animator to finish this step
        await (animationComplete = getExposedPromise());
        animationComplete = null;
      }
      if(stepMode){
        await (stepComplete = getExposedPromise());
        stepComplete = null;
      }
    }
    console.log(getSolution())
  };
  const stepCB = (event: MouseEvent): void => {
    if(stepComplete !== null){ stepComplete.resolve(true); }
  };
  const enableStepModeCB = (event: MouseEvent): void => {
    stepMode = stepMode ? false : true;
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
        <button onClick={testCB}> test </button>
        <button onClick={stepCB}> step </button>
        <button onClick={enableStepModeCB}> stepMode </button>
      </div>
      <div className='solution'>
        {getSolution().toString()}
      </div>
      <canvas ref={canvas} width={getWidth()} height={getHeight()}/>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
