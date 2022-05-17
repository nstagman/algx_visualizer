import './AlgVis.css'
import { AlgXNode, buildMatrix, buildSudMatrix, decodeSolution } from './AlgX';
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
  const canvasColor = '#ffffff';
  const nodeColor = '#2f78ec';
  const nodeCoveredColor = 'rgb(165, 178, 206)';
  const nodeFocusedColor = 'rgb(209, 150, 0)';
  const nodeSolutionColor = 'rgb(54, 216, 108)';
  const linkColor = '#000000';

  const hz = 60; //target fps
  const tickRate = 1000/hz; //normalized animation update time

  //solidjs reactive signals for runtime updates
  const [nodeSize, setNodeSize] = createSignal(9);
  const [width, setWidth] = createSignal(1);
  const [height, setHeight] = createSignal(1);
  const [matrix, setMatrix] = createSignal(buildMatrix([0,0], 1, 1));
  const [solution, setSolution] = createSignal(matrix().solution.slice());
  const [phase, setPhase] = createSignal(matrix().phase);
  const [play, setPlay] = createSignal(false);

  //component state variables
  let linkLen = nodeSize();
  let gridSize = nodeSize() + linkLen
  let drawLinks: boolean = true;
  let canvas: any;
  let ctx: CanvasRenderingContext2D;
  let lastUpdate: number;
  let elapsedTicks: number = 0;
  let animationComplete: any = null;
  let animationStep = 5;
  let stepComplete: any = null;
  let searching: boolean = false;
  let scaleSlider: any;
  let speedSlider: any;
  let drawLinksBox: any;
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
    searching = false;
    setPlay(false);
    if(stepComplete !== null){ stepComplete.resolve(true); }
    if(animationComplete !== null){ animationComplete.resolve(true); }
  };

  //updates the canvas size to draw full matrix
  const updateCanvasSize = (): void => {
    untrack(() => { updateNodeSize(); });
    linkLen = nodeSize();
    gridSize = nodeSize() + linkLen;
    setWidth(gridSize * matrix().cols.length + gridSize*2.5);
    setHeight(gridSize * matrix().rows.length + gridSize*2.5);
    setSolution(matrix().solution.slice());
    setPhase(matrix().phase);
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
    drawLinksBox.checked = true;
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

    matrix().allNodeMap((node: AlgXNode): void => {
      drawNode(node.nodeInfo);
    });

    ctx.beginPath()
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = 1;
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
    if(node.solution){ ctx.fillStyle = nodeSolutionColor; }
    if(node.focused){ ctx.fillStyle = nodeFocusedColor; }
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

    if(drawLinks){
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

    if(drawLinks){
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

    if(drawLinks){
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

    if(drawLinks){
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
  const solve = async (): Promise<void> => {
    for(const update of matrix().animatedAlgXSearch()){
      if(!turbo) { setSolution(matrix().solution.slice()); }
      setPhase(matrix().phase);
      if(turbo && play()){
        //check if solution has been updated
        const eq = solution().length === matrix().solution.length && 
          solution().every((v, i) => v === matrix().solution[i])
        if(!eq){ //if solution has changed then wait a short amount of time
          setSolution(matrix().solution.slice());
          await new Promise(res => setTimeout(res, 50))
        }
      }
      else if((update === 0 || !play()) && !turbo){ //no timeout specified - wait for animator to finish this step
        animationComplete = exposedPromise();
        await animationComplete;
        animationComplete = null;
      }
      if(!searching) { break; }
      if(!play()){
        stepComplete = exposedPromise();
        await stepComplete;
        stepComplete = null;
      }
    }
  };

  const playCB = async (event: MouseEvent): Promise<void> => {
    if(!searching){
      searching = true;
      setPlay(true);
      await solve();
      return;
    }
    if(!play() && stepComplete !== null){
      setPlay(true);
      stepComplete.resolve(true);
    }
    else if(play()){
      setPlay(false);
    }
  }

  const stepCB = (event: MouseEvent): void => {
    if(!play() && stepComplete !== null){
      stepComplete.resolve(true);
    }
    else if(play()){
      setPlay(false);
    }
  };

  const restartCB = (event: MouseEvent): void => {
    props.UIState[0].setManValue(props.UIState[0].manValue());
  };

  const updateNodeSize = (): void => {
    const base = matrix().rows.length > 300 ? 1 : 3
    switch(Number(scaleSlider.value)){
      case 1:
        setNodeSize(base);
        break;
      case 2:
        setNodeSize(base+2);
        break;
      case 3:
        setNodeSize(base+4);
        break;
      case 4:
        setNodeSize(base+6);
        break;
      case 5:
        setNodeSize(base+8);
        break;
      case 6:
        setNodeSize(base+10);
        break;
      default:
    }
  }

  const scaleSliderCB = (event: Event): void => {
    updateNodeSize();
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

  const drawLinksCB = (event: MouseEvent): void => {
    drawLinks = drawLinksBox.checked;
  };

  //returns a promise object with exposed resolve and reject handles
  //this is used to let the canvas update loop tell the AlgXSearch that animation has finished
  const exposedPromise = (): any => {
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
      <div className='inputs'>
        <button id='solveBtn' classList={{play: play(), pause: !play()}} onClick={playCB}> Solve </button>
        <button id='stepBtn' onClick={stepCB}> step </button>
        <button id='restartBtn' onClick={restartCB}> restart </button>
        <label id='scaleL' for='scale'>scale</label>
        <label id='speedL' for='speed'>speed</label>
        <input type='range' id='scale' ref={scaleSlider} min='1' max='6' onInput={scaleSliderCB}/>
        <input type='range' id='speed' ref={speedSlider} min='1' max='5' onInput={speedSliderCB}/>
        <label id='drawLinksL' for='drawLinks'>links</label>
        <input type='checkbox' id='drawLinks' ref={drawLinksBox} onClick={drawLinksCB}/>
      </div>
      <div className='legend'>
        <div id='uncoveredText'>Uncovered Node</div>
        <div id='uncoveredColor'></div>
        <div id='coveredText'>Covered Node</div>
        <div id='coveredColor'></div>
        <div id='solutionText'>Partial Solution</div>
        <div id='solutionColor'></div>
      </div>
      <div className='solutionContainer'>
        <span id='phase'>{phase().length > 0 ? phase() : '\u00A0'}</span>
        <span id='solution'>{solution().length > 0 ? (solution().join(' ')) + '\u00A0'.repeat(10) : '\u00A0'.repeat(10)}</span>
      </div>
      <div className='canvasContainer'>
        <canvas ref={canvas} width={width()} height={height()}/>
      </div>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
