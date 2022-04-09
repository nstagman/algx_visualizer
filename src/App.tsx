import './App.css'
import { Component, createSignal, Show } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { CustomMatrix, createMatrixState } from './CustomMatrix';
import { AlgXAnimator } from './AlgVis';


const AlgorithmVisualizer: Component = () => {
  const [boardSize, setBoardSize] = createSignal(16);
  const [boardState, initBoardState] = createBoardState(boardSize());
  const [matrixState, initMatrixState] = createMatrixState(42);
  const [rows, setRows] = createSignal(6);
  const [cols, setCols] = createSignal(7);

  function fxf(){
    if(boardSize() !== 16) {
      setBoardSize(16);
      initBoardState(16);
    }
  }

  function nxn(){
    if(boardSize() !== 81){
      setBoardSize(81);
      initBoardState(81);
    }
  }

  function customMatrix(){
    if(boardSize() !== 0){
      setBoardSize(0);
      initMatrixState(42);
    }
  }

  return (
    <div className='AlgorithmVisualizer'>
      <div className='UXBlock'>
          <button onClick={customMatrix}> custom </button>
          <button onClick={fxf}> 4x4 </button>
          <button onClick={nxn}> 9x9 </button>
        {boardSize() != 0 ? 
          <PuzzleBoard boardState={boardState()} dim={Math.sqrt(boardState().length)}/> : 
          <CustomMatrix matrixState={matrixState()} rows={rows()} cols={cols()}/>
        }
      </div>
      <AlgXAnimator boardState={boardState()} />
    </div>
  );
};

export default AlgorithmVisualizer;