import './AlgVis.css'
import { AlgXMatrix, buildMatrix, decodeSolution } from './AlgX';
import { JSXElement, Component, createEffect, onMount } from 'solid-js';


type NodeDrawInfo = { row: number, col: number }
type LinkDrawInfo = { props?: any}

const AlgXAnimator: Component<any> = (props: any): JSXElement => {
  const nodeSize = 7;
  const linkLen = 8;
  const gridSize = nodeSize + linkLen
  const width = 16 * 4 * gridSize;
  const height = 16 * 4 * gridSize;
  let canvas: any;
  let context: CanvasRenderingContext2D;
  let matrix: AlgXMatrix;

  onMount(() => {
    context = canvas.getContext('2d');
  });

  const nodeCenter = (node: NodeDrawInfo): [number, number] => {
    return [node.col*gridSize + nodeSize/2, node.row*gridSize + nodeSize/2];
  };
  
  const drawNode = (node: NodeDrawInfo) => {
    context.fillRect(node.col * gridSize, node.row * gridSize, nodeSize, nodeSize);
  };

  const drawLink = (n1: NodeDrawInfo, n2: NodeDrawInfo) => {
    context.moveTo(...nodeCenter(n1));
    context.lineTo(...nodeCenter(n2));
    context.stroke();
  };

  const drawMatrix = () => {
    context.clearRect(0, 0, width, height);
    for(const col of matrix.root.iterateRight()){
      for(const node of col.iterateDown()){
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
    console.log(puzzle.length)
    matrix = buildMatrix(puzzle);
    drawMatrix()
    await new Promise(r => setTimeout(r, 250));
    drawMatrix()
    await new Promise(r => setTimeout(r, 250));
    drawMatrix()
    await new Promise(r => setTimeout(r, 250));
    drawMatrix()
    await new Promise(r => setTimeout(r, 250));
    drawMatrix()
    await new Promise(r => setTimeout(r, 250));
    drawMatrix()
    await new Promise(r => setTimeout(r, 250));
    // for(const update of matrix.animatedAlgXSearch()){
    //   drawMatrix();
    //   // await new Promise(r => setTimeout(r, 250));
    // }
    console.log(decodeSolution(matrix.algXSearch()));
    // drawMatrix();
  };

  return(
    <div>
      <canvas ref={canvas} width={width} height={height}/>
      <button onClick={solveCB}> solve </button>
    </div>
  );
}


export { AlgXAnimator, NodeDrawInfo, LinkDrawInfo };
