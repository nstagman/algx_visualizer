import './App.css'
import { Component, createSignal, onMount, batch } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { AlgXAnimator } from './AlgVis';


const AlgorithmVisualizer: Component = () => {  let fxfBak: Array<number> = [];
  let nxnBak: Array<number> = [];
  let customBak: Array<number> = [];
  let rowsBak: number;
  let colsBak: number;
  const [rows, setRows] = createSignal(6);
  const [cols, setCols] = createSignal(7);
  const [boardState, initBoardState] = createBoardState(rows() * cols(), {equals: false});
  enum UIType { matrix, fxf, nxn };
  const [UI, setUI] = createSignal(UIType.matrix);


  //create and write values to initial binary matrix
  const initApp = () => {
    setRows(6);
    setCols(7);
    setUI(UIType.matrix);
    initBoardState(rows() * cols());
    boardState()[0].setManValue(1);
    boardState()[3].setManValue(1);
    boardState()[6].setManValue(1);
    boardState()[7].setManValue(1);
    boardState()[10].setManValue(1);
    boardState()[17].setManValue(1);
    boardState()[18].setManValue(1);
    boardState()[20].setManValue(1);
    boardState()[23].setManValue(1);
    boardState()[25].setManValue(1);
    boardState()[26].setManValue(1);
    boardState()[29].setManValue(1);
    boardState()[30].setManValue(1);
    boardState()[33].setManValue(1);
    boardState()[34].setManValue(1);
    boardState()[36].setManValue(1);
    boardState()[41].setManValue(1);
  };

  //store the manually entered values of the current boardstate into respective array
  const storeBoardState = () => {
    if(UI() === UIType.fxf){
      fxfBak = [];
      for(const square of boardState()){
        fxfBak.push(square.manValue())
      }
    }
    else if(UI() === UIType.nxn){
      nxnBak = [];
      for(const square of boardState()){
        nxnBak.push(square.manValue())
      }
    }
    else if(UI() === UIType.matrix){
      customBak = [];
      for(const square of boardState()){
        customBak.push(square.manValue())
      }
      rowsBak = rows();
      colsBak = cols();
    }
  };

  //restore the manually entered values of current boardstate from respective array
  const restoreBoardState = () => {
    if(UI() === UIType.fxf){
      for(const [i, val] of fxfBak.entries()){
        boardState()[i].setManValue(val);
      }
    }
    else if(UI() === UIType.nxn){
      for(const [i, val] of nxnBak.entries()){
        boardState()[i].setManValue(val);
      }
    }
    else if(UI() === UIType.matrix){
      for(const [i, val] of customBak.entries()){
        boardState()[i].setManValue(val);
      }
    }
  };

  //change ui to 4x4 sudoku
  const fxf = () => {
    if(UI() !== UIType.fxf) {
      storeBoardState();
      batch(() => {
        setUI(UIType.fxf);
        setRows(4);
        setCols(4);
        initBoardState(16);
      });
      restoreBoardState();
    }
  };

  //change ui to 9x9 sudoku
  const nxn = () => {
    if(UI() !== UIType.nxn){
      storeBoardState();
      batch(() => {
        setUI(UIType.nxn);
        setRows(9);
        setCols(9);
        initBoardState(81);
      });
      restoreBoardState();
    }
  };

  //change ui to a binary matrix
  const customMatrix = () => {
    if(UI() !== UIType.matrix){
      storeBoardState();
      setRows(rowsBak);
      setCols(colsBak);
      batch(() => {
        setUI(UIType.matrix);
        initBoardState(rows()* cols());
      });
      restoreBoardState();
    }
  };

  initApp();

  return (
    <div className='VisualizerApp'>
      <div className='UXBlock'>
          <button classList={{selected: UI() === UIType.matrix}} onClick={customMatrix}> custom </button>
          <button classList={{selected: UI() === UIType.fxf}} onClick={fxf}> 4x4 </button>
          <button classList={{selected: UI() === UIType.nxn}} onClick={nxn}> 9x9 </button>
          <PuzzleBoard
            boardState={boardState()}
            sudoku={UI() === UIType.fxf || UI() === UIType.nxn}
            rows={rows()}
            cols={cols()}
          />
      </div>
      <AlgXAnimator 
        UIState={boardState()}
        sudoku={UI() === UIType.fxf || UI() === UIType.nxn}
        rows={rows()}
        cols={cols()}
      />
    </div>
  );
};

export default AlgorithmVisualizer;