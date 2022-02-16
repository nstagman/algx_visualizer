import './AlgVis.css'
import { AlgXMatrix, buildMatrix, decodeSolution } from './AlgX';
import { JSXElement, Component, createEffect, onMount } from 'solid-js';


const AlgxAnimator: Component<any> = (props: any): JSXElement => {
  const nodeSize = 12;
  const linkLen = 12;
  const gridSize = nodeSize + linkLen
  const width = 10 * gridSize;
  const height = 6 * gridSize;
  let canvas: any;
  let context: CanvasRenderingContext2D;
  let matrix: AlgXMatrix;
  let puzzle: Array<number>;
  onMount(() => {
    context = canvas.getContext('2d');
  });

  createEffect(() => {
    puzzle = [];
    props.boardState.forEach((cell: any) => {
      puzzle.push(cell.getValue());
    });
    matrix = buildMatrix(puzzle, Math.sqrt(puzzle.length));
    console.log(decodeSolution(matrix.algXSearch()));
  });

  const drawNode = (r: number, c: number) => {
    context.fillRect(c*gridSize, r*gridSize, nodeSize, nodeSize)
  }

  const drawLink = (r1: number, c1: number, r2: number, c2: number) => {
    console.log('dl click')
  }

  return(
    <canvas ref={canvas} width={width} height={height}/>
  )
}


export { AlgxAnimator };
