import './AlgVis.css'
import { AlgXMatrix, buildMatrix, decodeSolution } from './AlgX';
import { JSXElement, Component, createEffect, onMount } from 'solid-js';


type NodeDrawInfo = { row: number, col: number }
type LinkDrawInfo = { props?: any}

const AlgXAnimator: Component<any> = (props: any): JSXElement => {
  const nodeSize = 5;
  const linkLen = nodeSize + 1;
  const gridSize = nodeSize + linkLen
  const width = 16 * 4 * gridSize + 2 * gridSize;
  const height = 16 * 4 * gridSize + 2 * gridSize;
  let canvas: any;
  let context: CanvasRenderingContext2D;
  let matrix: AlgXMatrix;

  onMount(() => {
    context = canvas.getContext('2d');
    context.translate(2*gridSize, 2*gridSize);
  });

  const nodeCenter = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize/2, node.row*gridSize + nodeSize/2];
  };
  
  const drawNode = (node: NodeDrawInfo) => {
    context.fillRect(node.col * gridSize, node.row * gridSize, nodeSize, nodeSize);
  };

  const drawLink = (n1: NodeDrawInfo, n2: NodeDrawInfo) => {
    context.beginPath();
    context.moveTo(...nodeCenter(n1));
    context.lineTo(...nodeCenter(n2));
    context.stroke()
  };

  const drawMatrix = () => {
    context.clearRect(-2*gridSize, -2*gridSize, width, height);
    for(const col of matrix.root.iterateRight(false)){
      for(const node of col.iterateDown(false)){
        drawNode(node.nodeDrawInfo);
        if(node.right.col >= 0){ drawLink(node.nodeDrawInfo, node.right.nodeDrawInfo); }
        if(node.down.col >= 0){ drawLink(node.nodeDrawInfo, node.down.nodeDrawInfo); }
      }
    }
  };

   const solveCB = async (event: MouseEvent): Promise<void> => {
    let puzzle: Array<number> = [];
    props.boardState.forEach((cell: any) => {
      puzzle.push(cell.getValue());
    });
    matrix = buildMatrix(puzzle);
    for(const update of matrix.animatedAlgXSearch()){
      drawMatrix();
      await new Promise(r => setTimeout(r, 500));
    }
    drawMatrix();
    // console.log(decodeSolution(matrix.algXSearch()))
  };

  return(
    <div>
      <canvas ref={canvas} width={width} height={height}/>
      <button onClick={solveCB}> solve </button>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
