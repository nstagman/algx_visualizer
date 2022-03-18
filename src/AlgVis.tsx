import './AlgVis.css'
import { AlgXMatrix, AlgXNode, buildSudMatrix, buildTest, decodeSolution } from './AlgX';
import { JSXElement, Component, createSignal, createEffect, onMount } from 'solid-js';


type NodeDrawInfo = { row: number, col: number, focused: boolean, covered: boolean, solution: boolean }
type LinkDrawInfo = {
  dir: 'up' | 'down' | 'left' | 'right',
  draw: boolean, //enable drawing flag
  animating: boolean, //link is currently animating
  reverse: boolean, //'unlink' animation is occuring
  pct: number, //percent animation complete
  start?: Date //TODO - needed for constant line drawing speed?
}

const AlgXAnimator: Component<any> = (props: any): JSXElement => {
  //hardcoded vars for visualization size
  const nodeSize = 9;
  const lineWidth = 1;
  const linkLen = nodeSize*3;
  const gridSize = nodeSize + linkLen
  const animationStep = 20;
  const animationAwaitTime = animationStep * 5;
  //component state and reference variables
  let canvas: any;
  let context: CanvasRenderingContext2D;
  let animationComplete: any | null = null;
  let stepComplete: any | null = null;
  let stepMode: boolean = false;
  //solidjs reactive signals to update size of canvas
  const [getWidth, setWidth] = createSignal(0);
  const [getHeight, setHeight] = createSignal(0);

  //testing only - getMatrix needs to be passed in as a prop from the user interactive portion
  const [getMatrix, setMatrix] = createSignal(buildTest());

  //solidjs effect - this causes initCanvas to run anytime a signal used by initCanvas (getMatrix) changes
  createEffect(() => {
    initCanvas();
  });

  //solidjs built-in effect, runs one time after the first render of this component
  onMount(() => {
    initCanvas();
    context = canvas.getContext('2d');
    updateCanvas();
  });

  //reactively set canvas size based on matrix size
  const initCanvas = (): void => {
    setWidth(gridSize * getMatrix().cols.length + gridSize*2);
    setHeight(gridSize * getMatrix().rows.length + gridSize*2);
  };

  //canvas main loop - draws and animates the matrix on the canvas
  const updateCanvas = (): void => {
    updateAnimationStatus();
    drawMatrix();
    requestAnimationFrame(updateCanvas);
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
    context.clearRect(0, 0, getWidth(), getHeight());
    context.save()
    context.translate(2*gridSize, 2*gridSize);
    //draw each node
    getMatrix().allNodeMap((node: AlgXNode): void => {
      drawNode(node.nodeInfo);
    });
    //draw all 4 links of each node
    getMatrix().allNodeMap((node: AlgXNode): void => {
      drawLink(node.linkInfo.up, node.nodeInfo, node.up.nodeInfo);
      drawLink(node.linkInfo.down, node.nodeInfo, node.down.nodeInfo);
      drawLink(node.linkInfo.left, node.nodeInfo, node.left.nodeInfo);
      drawLink(node.linkInfo.right, node.nodeInfo, node.right.nodeInfo);
    });
    context.restore();
  };

  const drawNode = (node: NodeDrawInfo):void => {
    context.fillStyle = !node.focused ? '#000000' : '#FFFF00';
    context.beginPath();
    context.arc(node.col * gridSize + nodeSize/2, node.row * gridSize + nodeSize/2, nodeSize/2, 0, 2*Math.PI);
    context.fill();
    context.strokeStyle = '#000000';
    context.beginPath();
    context.arc(node.col * gridSize + nodeSize/2, node.row * gridSize + nodeSize/2, nodeSize/2, 0, 2*Math.PI);
    context.stroke();
    // context.fillRect(node.col * gridSize, node.row * gridSize, nodeSize, nodeSize);
  };

  const drawLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo):void => {
    if(!link.draw){ return; }
    context.strokeStyle = '#FF0000';
    const wrapping = //determine if this link wraps around matrix
      link.dir === 'up' && n2.row > n1.row ||
      link.dir === 'down' && n2.row < n1.row ||
      link.dir === 'left' && n2.col > n1.col ||
      link.dir === 'right' && n2.col < n1.col;
    if(!link.animating){ drawStaticLink(link, n1, n2, wrapping); }
    else{ drawAnimatedLink(link, n1, n2, wrapping); }
  };

  const drawStaticLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo, wrap: boolean): void => {
    if(link.pct <= 0){ return; }
    context.beginPath();
    context.lineWidth = lineWidth;
    if(!wrap){
      switch(link.dir){
        case 'up':
          context.moveTo(...nodeTop(n1));
          context.lineTo(...nodeBottom(n2));
          break;
        case 'down':
          context.moveTo(...nodeBottom(n1));
          context.lineTo(...nodeTop(n2));
          break;
        case 'left':
          context.moveTo(...nodeLeft(n1));
          context.lineTo(...nodeRight(n2));
          break;
        case 'right':
          context.moveTo(...nodeRight(n1));
          context.lineTo(...nodeLeft(n2));
          break;
        default:
      }
    }
    else{ //TODO - handle wrapping graphic
      switch(link.dir){
        case 'up':
          break;
        case 'down':
          break;
        case 'left':
          break;
        case 'right':
          break;
        default:
      }
    }
    context.stroke()
  };

  const drawAnimatedLink = (link: LinkDrawInfo, n1: NodeDrawInfo, n2: NodeDrawInfo, wrap: boolean): void => {
    context.beginPath();
    context.lineWidth = lineWidth;
    if(!link.reverse){ link.pct = link.pct + animationStep >= 100 ? 100 : link.pct + animationStep; }
    else{ link.pct = link.pct - animationStep <= 0 ? 0 : link.pct - animationStep; }
    let x, y, lineLength;
    if(!wrap){
      switch(link.dir){
        case 'up':
          lineLength = (n1.row - n2.row) * gridSize - nodeSize;
          lineLength *= link.pct/100;
          [x, y] = nodeTop(n1);
          context.moveTo(x, y);
          context.lineTo(x, y - lineLength);
          break;
        case 'down':
          lineLength = (n2.row - n1.row) * gridSize - nodeSize;
          lineLength *= link.pct/100;
          [x, y] = nodeBottom(n1);
          context.moveTo(x, y);
          context.lineTo(x, y + lineLength);
          break;
        case 'left':
          lineLength = (n1.col - n2.col) * gridSize - nodeSize;
          lineLength *= link.pct/100;
          [x, y] = nodeLeft(n1);
          context.moveTo(x, y);
          context.lineTo(x - lineLength, y);
          break;
        case 'right':
          lineLength = (n2.col - n1.col) * gridSize - nodeSize;
          lineLength *= link.pct/100;
          [x, y] = nodeRight(n1);
          context.moveTo(x, y);
          context.lineTo(x + lineLength, y);
          break;
        default:
      }
    }
    else{ //TODO - handle wrapping animation
      switch(link.dir){
        case 'up':
          break;
        case 'down':
          break;
        case 'left':
          break;
        case 'right':
          break;
        default:
      }
    }
    context.stroke()
    if(!link.reverse && link.pct >= 100){ 
      link.animating = false; 
      link.draw = true;
    }
    else if(link.reverse && link.pct <= 0){ 
      link.animating = false;
      link.draw = false; //don't draw links that have been retracted
    }
  };

    //translates matrix position to a tuple of canvas coordinates of a node
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

   const solveCB = async (event: MouseEvent): Promise<void> => {
    let puzzle: Array<number> = [];
    for(const cell of props.boardState){
      puzzle.push(cell.getValue());
    }
    setMatrix(buildSudMatrix(puzzle));
    for(const update of getMatrix().animatedAlgXSearch()){
      await new Promise(r => setTimeout(r, 50));
    }
  };

  const testCB = async (event: MouseEvent): Promise<void> => {
    setMatrix(buildTest());
    for(const update of getMatrix().animatedAlgXSearch()){
      if(update === 0){ //no timeout specified - wait for animator to finish this step
        await (animationComplete = getExposedPromise());
        animationComplete = null;
      }
      else{ //wait for a set time instead of the animator before continuing
        await new Promise((resolve) => {setTimeout(resolve, (update/100)*animationAwaitTime)});
      }
      if(stepMode){
        await (stepComplete = getExposedPromise());
        stepComplete = null;
      }
    }
    console.log(getMatrix().solution)
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

  return(
    <div>
      <div>
        <button onClick={solveCB}> solve </button>
        <button onClick={testCB}> test </button>
        <button onClick={stepCB}> step </button>
        <button onClick={enableStepModeCB}> stepMode </button>
      </div>
      <canvas ref={canvas} width={getWidth()} height={getHeight()}/>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
