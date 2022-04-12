import './App.css'
import { Component, createSignal, onMount } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { CustomMatrix, createMatrixState } from './CustomMatrix';
import { AlgXAnimator } from './AlgVis';
import { buildMatrix, buildSudMatrix } from './AlgX';


const AlgorithmVisualizer: Component = () => {
  const [boardSize, setBoardSize] = createSignal(0);
  const [boardState, initBoardState] = createBoardState(boardSize());
  const [rows, setRows] = createSignal(0);
  const [cols, setCols] = createSignal(0);
  const [customMatrixState, initCustomMatrixState] = createMatrixState(rows() * cols());
  const [algXMatrix, initAlgXMatrix] = createSignal();

  function initApp(){
    setRows(6);
    setCols(7);
    initCustomMatrixState(6*7);
    customMatrixState()[0].setValue(1)
    customMatrixState()[4].setValue(1)
    customMatrixState()[7].setValue(1)
    customMatrixState()[8].setValue(1)
    customMatrixState()[11].setValue(1)
    customMatrixState()[18].setValue(1)
    customMatrixState()[19].setValue(1)
    customMatrixState()[21].setValue(1)
    customMatrixState()[24].setValue(1)
    customMatrixState()[26].setValue(1)
    customMatrixState()[27].setValue(1)
    customMatrixState()[30].setValue(1)
    customMatrixState()[31].setValue(1)
    customMatrixState()[34].setValue(1)
    customMatrixState()[35].setValue(1)
    customMatrixState()[37].setValue(1)
    customMatrixState()[41].setValue(1)
    console.log(customMatrixState().map(
      (idx) => { return idx.getValue(); }
    ))
    initAlgXMatrix(buildMatrix(customMatrixState().map(
      (idx) => { return idx.getValue(); }
    ),
    rows(),
    cols()
    ))
  }

  initApp();
  
  // onMount(() => {
  //   setRows(6);
  //   setCols(7);
  //   initCustomMatrixState(6*7);
  //   initAlgXMatrix(buildMatrix(customMatrixState().map(
  //     (idx) => { return idx.getValue(); }
  //   ),
  //   rows(),
  //   cols()
  //   ))
  // });

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
      initCustomMatrixState(rows() * cols());
    }
  }

  return (
    <div className='VisualizerApp'>
      <div className='UXBlock'>
          <button onClick={customMatrix}> custom </button>
          <button onClick={fxf}> 4x4 </button>
          <button onClick={nxn}> 9x9 </button>
        {boardSize() != 0
          ? <PuzzleBoard boardState={boardState()} dim={Math.sqrt(boardState().length)}/>
          : <CustomMatrix matrixState={customMatrixState()} rows={rows()} cols={cols()}/>
        }
      </div>
      <AlgXAnimator getMatrix={algXMatrix()} />
    </div>
  );
};

export default AlgorithmVisualizer;