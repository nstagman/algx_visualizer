import './App.css'
import { Component, createSignal, onMount } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { AlgXAnimator } from './AlgVis';


const AlgorithmVisualizer: Component = () => {
  const [boardSize, setBoardSize] = createSignal(16);
  const [rows, setRows] = createSignal(4);
  const [cols, setCols] = createSignal(4);
  const [boardState, initBoardState] = createBoardState(boardSize());

  // function initApp(){
  //   setRows(6);
  //   setCols(7);
  //   initCustomMatrixState(6*7);
  //   customMatrixState()[0].setValue(1)
  //   customMatrixState()[4].setValue(1)
  //   customMatrixState()[7].setValue(1)
  //   customMatrixState()[8].setValue(1)
  //   customMatrixState()[11].setValue(1)
  //   customMatrixState()[18].setValue(1)
  //   customMatrixState()[19].setValue(1)
  //   customMatrixState()[21].setValue(1)
  //   customMatrixState()[24].setValue(1)
  //   customMatrixState()[26].setValue(1)
  //   customMatrixState()[27].setValue(1)
  //   customMatrixState()[30].setValue(1)
  //   customMatrixState()[31].setValue(1)
  //   customMatrixState()[34].setValue(1)
  //   customMatrixState()[35].setValue(1)
  //   customMatrixState()[37].setValue(1)
  //   customMatrixState()[41].setValue(1)
  //   const mat: Array<number> = customMatrixState().map(
  //     (idx) => { return idx.getValue(); }
  //   );
  // }

  // initApp();

  function fxf(){
    if(boardSize() !== 16) {
      setBoardSize(16);
      setRows(4);
      setCols(4);
      initBoardState(16);
    }
  }

  function nxn(){
    if(boardSize() !== 81){
      setBoardSize(81);
      setRows(9);
      setCols(9);
      initBoardState(81);
    }
  }

  function customMatrix(){
    if(boardSize() !== 0){
      setBoardSize(0);
      setRows(6);
      setCols(7);
      initBoardState(rows() * cols());
    }
  }

  return (
    <div className='VisualizerApp'>
      <div className='UXBlock'>
          <button onClick={customMatrix}> custom </button>
          <button onClick={fxf}> 4x4 </button>
          <button onClick={nxn}> 9x9 </button>
          <PuzzleBoard
            boardState={boardState()}
            sudoku={boardSize() > 0}
            rows={rows()}
            cols={cols()}
            enableInput={true}
          />
      </div>
      <AlgXAnimator UIState={boardState()} />
    </div>
  );
};

export default AlgorithmVisualizer;