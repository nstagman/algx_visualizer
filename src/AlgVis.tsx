import './AlgVis.css'
import { AlgXMatrix, buildSudMatrix, buildTest, decodeSolution } from './AlgX';
import { JSXElement, Component, createSignal, createEffect, onMount } from 'solid-js';


type NodeDrawInfo = { row: number, col: number, focused: boolean }
type LinkDrawInfo = { animating: boolean, reverse: boolean, draw: boolean, pct: number, start?: Date }

const AlgXAnimator: Component<any> = (props: any): JSXElement => {
  //hardcoded vars for visualization size
  const nodeSize = 9;
  const linkLen = nodeSize*3;
  const gridSize = nodeSize + linkLen
  //solidjs reactive signals to update size of canvas
  const [getWidth, setWidth] = createSignal(0);
  const [getHeight, setHeight] = createSignal(0);
  let canvas: any;
  let context: CanvasRenderingContext2D;
  let animationComplete: Promise<boolean>;

  //testing only - getMatrix needs to be passed in as a prop from the user interactive portion
  const [getMatrix, setMatrix] = createSignal(buildTest());

  //solidjs effect - this causes initCanvas to run anytime a signal used by initCanvas (getMatrix) changes
  createEffect(() => {
    initCanvas();
  });

  //solidjs built-in effect, runs one-time after the first render
  onMount(() => {
    initCanvas();
    context = canvas.getContext('2d');
    animateMatrix();
  });

  //reactively set canvas size based on matrix size
  const initCanvas = (): void => {
    setWidth(gridSize * getMatrix().cols.length + gridSize*2);
    setHeight(gridSize * getMatrix().rows.length + gridSize*2);
  };

  //animation loop - draws the matrix on the canvas
  const animateMatrix = (): void => {
    drawMatrix();
    requestAnimationFrame(animateMatrix);
  };

  //translates matrix position to a tuple of coordinates for the center of a node
  const nodeCenter = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize/2, node.row*gridSize + nodeSize/2];
  };
  
  const drawNode = (node: NodeDrawInfo):void => {
    // context.beginPath();
    // context.arc(node.col * gridSize +nodeSize/2, node.row * gridSize + nodeSize/2, nodeSize, 0, 2*Math.PI);
    // context.stroke();
    context.fillRect(node.col * gridSize, node.row * gridSize, nodeSize, nodeSize);
  };

  const drawLink = (n1: NodeDrawInfo, n2: NodeDrawInfo):void => {
    context.beginPath();
    context.moveTo(...nodeCenter(n1));
    context.lineTo(...nodeCenter(n2));
    context.stroke()
  };

  const drawMatrix = (): void => {
    context.clearRect(0, 0, getWidth(), getHeight());
    context.save()
    context.translate(2*gridSize, 2*gridSize);
    for(const col of getMatrix().root.iterateRight(false)){
      for(const node of col.iterateDown(false)){
        drawNode(node.nodeInfo);
        if(node.right.col >= 0){ drawLink(node.nodeInfo, node.right.nodeInfo); }
        if(node.down.col >= 0){ drawLink(node.nodeInfo, node.down.nodeInfo); }
      }
    }
    context.restore();
  };

   const solveCB = async (event: MouseEvent): Promise<void> => {
    let puzzle: Array<number> = [];
    props.boardState.forEach((cell: any) => {
      puzzle.push(cell.getValue());
    });
    setMatrix(buildSudMatrix(puzzle));
    for(const update of getMatrix().animatedAlgXSearch()){
      await new Promise(r => setTimeout(r, 50));
    }
  };

  const testCB = async (event: MouseEvent): Promise<void> => {
    setMatrix(buildTest());
    for(const update of getMatrix().animatedAlgXSearch()){
      await new Promise(r => setTimeout(r, 250));
    }
  };

  return(
    <div>
      <div>
        <button onClick={solveCB}> solve </button>
        <button onClick={testCB}> test </button>
      </div>
      <canvas ref={canvas} width={getWidth()} height={getHeight()}/>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
