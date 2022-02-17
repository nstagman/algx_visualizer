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

  const solveCB = (event: MouseEvent): void => {
    let puzzle: Array<number> = [];
    props.boardState.forEach((cell: any) => {
      puzzle.push(cell.getValue());
    });
    matrix = buildMatrix(puzzle);
    console.log(decodeSolution(matrix.algXSearch()));
  }

  const drawNode = (r: number, c: number) => {
    context.fillRect(c*gridSize, r*gridSize, nodeSize, nodeSize)
  }

  const drawLink = (r1: number, c1: number, r2: number, c2: number) => {
    console.log('draw link')
  }

  const removeLink = (r1: number, c1: number, r2: number, c2: number) => {
    console.log('remove link')
  }

  return(
    <div>
      <canvas ref={canvas} width={width} height={height}/>
      <button onClick={solveCB}> solve </button>
    </div>
    
  )
}


export { AlgxAnimator };
