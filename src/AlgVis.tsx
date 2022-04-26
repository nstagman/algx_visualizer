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
  const canvasColor = 'rgba(0, 0, 0, 1.0)';
  const nodeColor = 'rgba(11, 127, 171, 1.0)';
  const nodeCoveredColor = 'rgba(193, 208, 240, 1.0)';
  const nodeFocusedColor = 'rgba(255, 225, 75, 1.0)';
  const nodeSolutionColor = 'rgba(10, 240, 140, 1.0)';
  const linkColor = 'rgba(153, 51, 51, 1.0)';
  const linkCoveredColor = '#CCCCCC';
  const lineWidth = 1;
  const hz = 60; //target fps
  const tickRate = 1000/hz; //normalized animation update time

  //solidjs reactive signals for runtime updates
  const [nodeSize, setNodeSize] = createSignal(9);
  const [width, setWidth] = createSignal(1);
  const [height, setHeight] = createSignal(1);
  const [matrix, setMatrix] = createSignal(buildMatrix([0,0], 1, 1));
  const [solution, setSolution] = createSignal(matrix().solution.slice());

  //component state variables
  let linkLen = nodeSize();
  let gridSize = nodeSize() + linkLen
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
  let turbo: boolean = false; //skip animation and only update on solution change


  //solidjs effects - tracks signals used and runs each time a signal within the effect is updated
  createEffect(() => { updateMatrix(); }); //create new constarint matrix when UI is modified by user
  createEffect(() => { updateCanvasSize(); }); //set canvas size based on matrix size and user-set scale value
  createEffect(() => { updateUISolution(); }); //reflect the current partial solution back to the UI

  //creates new constraint matrix
  const updateMatrix = (): void => {
    let matrixData: Array<number> = [];
    for(let i=0; i<props.UIState.length; i++){
        matrixData.push(props.UIState[i].manValue());
    }
    if(props.sudoku){ setMatrix(buildSudMatrix(matrixData)); }
    else{ setMatrix(buildMatrix(matrixData, props.rows, props.cols)); }
  };

  //updates the canvas size to draw full matrix
  const updateCanvasSize = (): void => {
    linkLen = nodeSize();
    gridSize = nodeSize() + linkLen;
    setWidth(gridSize * matrix().cols.length + gridSize*2.5);
    setHeight(gridSize * matrix().rows.length + gridSize*2.5);
    setSolution(matrix().solution.slice());
  };

  //updates the solution flag for each square in the UI board
  const updateUISolution = (): void => {
    batch(() => {
      if(!props.sudoku){
        for(const [i, square] of props.UIState.entries()){
          if(solution().includes((i/props.cols)|0) && untrack(() => square.manValue()) > 0){
            square.setSolution(true);
          }
          else{ square.setSolution(false); }
        }
      }
      else{
        const decodedSolution: Array<number> = decodeSolution(solution(), props.UIState.length);
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

  //solidjs built-in effect, runs one time after the first render of this component
  //this is the entry point for the animator
  onMount(() => {
    ctx = canvas.getContext('2d');
    scaleSlider.value = 4;
    speedSlider.value = 2;
    updateMatrix();
    updateCanvasSize();
    lastUpdate = performance.now();
    updateCanvas();
  });

  //canvas main loop - draws the matrix on the canvas
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
    const animating = matrix().allNodeMap((node: AlgXNode): boolean => {
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
    ctx.clearRect(0, 0, width(), height());
    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, width(), height());
    ctx.save()
    ctx.translate(2*gridSize, 2*gridSize);

    //draw each node
    matrix().allNodeMap((node: AlgXNode): void => {
      drawNode(node.nodeInfo);
    });

    //draw all 4 links of each node
    ctx.beginPath()
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = lineWidth;
    matrix().allNodeMap((node: AlgXNode): void => {
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
    let [x,y] = nodeTop(node);
    x -= nodeSize()/2;
    ctx.beginPath();
    ctx.rect(x, y, nodeSize(), nodeSize());
    ctx.fill();
  };

  const drawUpLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo): void => {
    if(!link.draw){ return; }

    if(link.animating){ updateLinkAnimationLength(link); }

    //determine line lengths
    let wrapping = n2.row > n1.row;
    let line1Length = wrapping ? gridSize*n1.row + 1.5*gridSize : (n1.row - n2.row) * gridSize - nodeSize();
    let line2Length = wrapping ? gridSize*(matrix().rows.length - n2.row) - 0.5*gridSize: 0;
    let currentLength = (line1Length + line2Length) * link.pct/100;

    //move to top of node and draw the current length of link upward
    let [x,y] = nodeTop(n1);
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

    //determine line lengths
    let wrapping = n2.row < n1.row;
    let line1Length = wrapping ? gridSize*(matrix().rows.length - n1.row) - 0.5*gridSize: (n2.row - n1.row) * gridSize - nodeSize();
    let line2Length = wrapping ? gridSize*n2.row + 1.5*gridSize : 0;
    let currentLength = (line1Length + line2Length) * link.pct/100;

    //move to bottom of node and draw the current length of link downward
    let [x,y] = nodeBottom(n1);
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

    //determine line lengths
    let wrapping = n2.col > n1.col;
    let line1Length = wrapping ? gridSize*n1.col + 1.5*gridSize : (n1.col - n2.col) * gridSize - nodeSize();
    let line2Length = wrapping ? gridSize*(matrix().cols.length - n2.col) - 0.5*gridSize : 0;
    let currentLength = (line1Length + line2Length) * link.pct/100;

    //move to left of node and draw the current length of link leftward
    let [x,y] = nodeLeft(n1);
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

    //determine line lengths
    let wrapping = n2.col < n1.col;
    let line1Length = wrapping ? gridSize*(matrix().cols.length - n1.col) - 0.5*gridSize: (n2.col - n1.col) * gridSize - nodeSize();
    let line2Length = wrapping ? gridSize*n2.col + 1.5*gridSize : 0;
    let currentLength = (line1Length + line2Length) * link.pct/100;

    //move to right of node and draw the current length of link rightward
    let [x,y] = nodeRight(n1);
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
    if(link.pct === 0 && !link.animating){
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
    for(const update of matrix().animatedAlgXSearch()){
      if(turbo && !stepMode){
        //check if solution has been updated
        const eq = solution().length === matrix().solution.length && 
          solution().every((v, i) => v === matrix().solution[i])
        if(!eq){ //if solution has changed then wait a short amount of time
          await new Promise(res => setTimeout(res, 50))
        }
      }
      else if((update === 0 || stepMode) && !turbo){ //no timeout specified - wait for animator to finish this step
        animationComplete = getExposedPromise();
        await animationComplete;
        animationComplete = null;
      }
      if(stepMode){
        stepComplete = getExposedPromise();
        await stepComplete;
        stepComplete = null;
      }
      setSolution(matrix().solution.slice());
    }
  };
  const stepCB = (event: MouseEvent): void => {
    if(stepComplete !== null){ stepComplete.resolve(true); }
  };
  const enableStepModeCB = (event: MouseEvent): void => {
    stepMode = stepMode ? false : true;
  };
  const scaleSliderCB = (event: Event): void => {
    switch(Number(scaleSlider.value)){
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
      case 6:
        setNodeSize(13);
        break;
      default:
    }
  };
  const speedSliderCB = (event: Event): void => {
    turbo = false;
    switch(Number(speedSlider.value)){
      case 1:
        animationStep = 2.5;
        break;
      case 2:
        animationStep = 5;
        break;
      case 3:
        animationStep = 10;
        break;
      case 4:
        animationStep = 100;
        break;
      case 5:
        animationStep = 100;
        turbo = true;
        break;
      default:
    }
  };

  //returns a promise object with exposed resolve and reject handles
  //this is used to let the canvas update loop tell the AlgXSearch that animation has finished
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
        <input type='range' id='scale' ref={scaleSlider} min='1' max='6' onInput={scaleSliderCB}/>
        <input type='range' id='speed' ref={speedSlider} min='1' max='5' onInput={speedSliderCB}/>
      </div>
      <div className='solution'>
        {solution().length > 0 ? solution().join(' ') : '\u00A0'}
      </div>
      <canvas ref={canvas} width={width()} height={height()}/>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
