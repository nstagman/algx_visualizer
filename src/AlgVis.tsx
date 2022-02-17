import './AlgVis.css'
import { AlgXMatrix, buildMatrix, decodeSolution } from './AlgX';
import { JSXElement, Component, createEffect, onMount } from 'solid-js';


type NodeDrawInfo = { row: number, col: number }
type LinkDrawInfo = { startNode: NodeDrawInfo, endNode: NodeDrawInfo }
type AniCBs = {
  drawNodes: (nodes: Array<NodeDrawInfo>) => void,
  drawLinks: (links: Array<LinkDrawInfo>) => void,
  removeNodes: (nodes: Array<NodeDrawInfo>) => void,
  removeLinks: (links: Array<LinkDrawInfo>) => void
}

const AlgxAnimator: Component<any> = (props: any): JSXElement => {
  const nodeSize = 6;
  const linkLen = 8;
  const gridSize = nodeSize + linkLen
  const width = 16 * 4 * gridSize;
  const height = 16 * 4 * gridSize;
  let canvas: any;
  let context: CanvasRenderingContext2D;
  let matrix: AlgXMatrix;

  const drawNodes = (nodes: Array<NodeDrawInfo>) => {
    nodes.forEach((node: NodeDrawInfo) => {
      context.fillRect(node.col*gridSize, node.row*gridSize, nodeSize, nodeSize)
    })
  }
  const drawLinks = (links: Array<LinkDrawInfo>) => {
    console.log('draw link')
  }
  const removeNodes = (nodes: Array<NodeDrawInfo>) => {
    nodes.forEach((node: NodeDrawInfo) => {
      context.fillRect(node.col*gridSize, node.row*gridSize, nodeSize, nodeSize)
    })
  }
  const removeLinks = (links: Array<LinkDrawInfo>) => {
    console.log('remove link')
  }

  const cbs: AniCBs = {
    drawNodes: drawNodes,
    drawLinks: drawLinks,
    removeNodes: removeNodes,
    removeLinks: removeLinks
  }

  const solveCB = (event: MouseEvent): void => {
    let puzzle: Array<number> = [];
    props.boardState.forEach((cell: any) => {
      puzzle.push(cell.getValue());
    });
    matrix = buildMatrix(puzzle, cbs);
    console.log(decodeSolution(matrix.algXSearch()));
  }

  onMount(() => {
    context = canvas.getContext('2d');
  });

  // createEffect(() => {
  //   puzzle = [];
  //   props.boardState.forEach((cell: any) => {
  //     puzzle.push(cell.getValue());
  //   });
  //   matrix = buildMatrix(puzzle, Math.sqrt(puzzle.length));
  //   console.log(decodeSolution(matrix.algXSearch()));
  // });

  return(
    <div>
      <canvas ref={canvas} width={width} height={height}/>
      <button onClick={solveCB}> solve </button>
    </div>
  )
}


export { AlgxAnimator, NodeDrawInfo, LinkDrawInfo, AniCBs };
