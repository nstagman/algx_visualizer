import './App.css'
import { Component, createSignal, onMount } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { AlgXAnimator } from './AlgVis';


const AlgorithmVisualizer: Component = () => {
  const [boardSize, setBoardSize] = createSignal(16);
  const [rows, setRows] = createSignal(4);
  const [cols, setCols] = createSignal(4);
  const [boardState, initBoardState] = createBoardState(boardSize());

  function initApp(){
    setRows(6);
    setCols(7);
    setBoardSize(0);
    initBoardState(rows() * cols());
    boardState()[0].setValue(1);
    boardState()[3].setValue(1);
    boardState()[6].setValue(1);
    boardState()[7].setValue(1);
    boardState()[10].setValue(1);
    boardState()[17].setValue(1);
    boardState()[18].setValue(1);
    boardState()[20].setValue(1);
    boardState()[23].setValue(1);
    boardState()[25].setValue(1);
    boardState()[26].setValue(1);
    boardState()[29].setValue(1);
    boardState()[30].setValue(1);
    boardState()[33].setValue(1);
    boardState()[34].setValue(1);
    boardState()[36].setValue(1);
    boardState()[41].setValue(1);
  }

  initApp();

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
      <AlgXAnimator 
        UIState={boardState()}
        sudoku={boardSize() > 0}
        rows={rows()}
        cols={cols()}
      />
    </div>
  );
};

export default AlgorithmVisualizer;