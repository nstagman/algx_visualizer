import { Component, createSignal } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { AlgxAnimator } from './AlgVis';


const App: Component = () => {
  let boardSize = 16;
  const [boardState, initBoardState] = createBoardState(boardSize);
  function fxf(){
    if(boardSize !== 16) {
      boardSize = 16;
      initBoardState(16);
    }
  }

  function nxn(){
    if(boardSize !== 81){
      boardSize = 81
      initBoardState(81);
    }
  }

  function printVals(){
    const boardVals: Array<number> = [];
    boardState().forEach(squareState => {
      boardVals.push(squareState.getValue());
    });
    console.log(boardVals);
  }

  return (
    <div className='VizApp'>
      <button onClick={printVals}> print vals </button>
      <button onClick={fxf}> 4x4 </button>
      <button onClick={nxn}> 9x9 </button>
      <PuzzleBoard boardState={boardState()} dim={Math.sqrt(boardState().length)}/>
      <AlgxAnimator boardState={boardState()} />
    </div>
  );
};

export default App;