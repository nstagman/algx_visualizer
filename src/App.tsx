import './App.css'
import { Component, createSignal, onMount, batch } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { AlgXAnimator } from './AlgVis';


const AlgorithmVisualizer: Component = () => {
  const [isSudoku, setIsSudoku] = createSignal(false);
  const [rows, setRows] = createSignal(6);
  const [cols, setCols] = createSignal(7);
  const [boardState, initBoardState] = createBoardState(rows() * cols());

  const initApp = () => {
    setRows(6);
    setCols(7);
    setIsSudoku(false);
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
  };

  const fxf = () => {
    if(!isSudoku() || rows() !== 4) {
      batch(() => {
        setIsSudoku(true);
        setRows(4);
        setCols(4);
        initBoardState(16);
      });
    }
  };

  const nxn = () => {
    if(!isSudoku() || rows() !== 9){
      batch(() => {
        setIsSudoku(true);
        setRows(9);
        setCols(9);
        initBoardState(81);
      });
    }
  };

  const customMatrix = () => {
    if(isSudoku()){
      setRows(6);
      setCols(7);
      batch(() => {
        setIsSudoku(false);
        initBoardState(rows() * cols());
      });
    }
  };

  initApp();

  return (
    <div className='VisualizerApp'>
      <div className='UXBlock'>
          <button onClick={customMatrix}> custom </button>
          <button onClick={fxf}> 4x4 </button>
          <button onClick={nxn}> 9x9 </button>
          <PuzzleBoard
            boardState={boardState()}
            sudoku={isSudoku()}
            rows={rows()}
            cols={cols()}
            enableInput={true}
          />
      </div>
      <AlgXAnimator 
        UIState={boardState()}
        sudoku={isSudoku()}
        rows={rows()}
        cols={cols()}
      />
    </div>
  );
};

export default AlgorithmVisualizer;