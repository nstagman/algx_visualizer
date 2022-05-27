import './App.css'
import { Component, createSignal, batch, Show } from 'solid-js';
import { PuzzleBoard, createBoardState} from './PuzzleBoard';
import { AlgXAnimator } from './AlgXAnimator';


const VisualizerApp: Component = () => {
  const [rows, setRows] = createSignal(6);
  const [cols, setCols] = createSignal(7);
  const [boardState, setBoardState] = createBoardState(rows() * cols(), {equals: false});
  enum UIType { matrix, fxf, nxn };
  const [UI, setUI] = createSignal(UIType.matrix);

  let fxfBak: Array<number> = [];
  let nxnBak: Array<number> = [];
  let customBak: Array<number> = [];
  let rowsBak: number;
  let colsBak: number;


  //create and write values for the initial binary matrix
  const initApp = () => {
    setRows(6);
    setCols(7);
    setUI(UIType.matrix);
    setBoardState(rows() * cols());
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
    nxn();
    boardState()[4].setManValue(7);
    boardState()[5].setManValue(4);
    boardState()[8].setManValue(5);
    boardState()[15].setManValue(2);
    boardState()[21].setManValue(3);
    boardState()[23].setManValue(5);
    boardState()[25].setManValue(7);
    boardState()[26].setManValue(6);
    boardState()[29].setManValue(9);
    boardState()[30].setManValue(4);
    boardState()[32].setManValue(2);
    boardState()[34].setManValue(8);
    boardState()[36].setManValue(1);
    boardState()[37].setManValue(8);
    boardState()[40].setManValue(6);
    boardState()[46].setManValue(3);
    boardState()[54].setManValue(2);
    boardState()[57].setManValue(5);
    boardState()[60].setManValue(8);
    boardState()[63].setManValue(3);
    boardState()[64].setManValue(5);
    boardState()[68].setManValue(1);
    boardState()[74].setManValue(8);
    boardState()[78].setManValue(9);
    fxf();
    boardState()[1].setManValue(1);
    boardState()[2].setManValue(3);
    boardState()[4].setManValue(2);
    boardState()[11].setManValue(3);
    boardState()[13].setManValue(2);
    customMatrix();
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
    batch(() => {
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
    });
  };

  //change ui to 4x4 sudoku
  const fxf = () => {
    if(UI() !== UIType.fxf) {
      storeBoardState();
      batch(() => {
        setUI(UIType.fxf);
        setRows(4);
        setCols(4);
        setBoardState(16);
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
        setBoardState(81);
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
        setBoardState(rows()* cols());
      });
      restoreBoardState();
    }
  };

  initApp();

  const matrixDesc = 'Modify the binary matrix, then click \'Solve\' to search for an Exact Cover. \
                      An exact cover is a set of rows where each column is represented exactly once.'
  const sudDesc = 'Enter a sudoku puzzle, then click \'Solve\' to search for a solution. \
                   The sudoku is automatically translated to the binary constraint matrix on the right.'
  return (
    <div className='VisualizerApp'>
      <div className='UXBlock'>
        <div className='btns'>
          <div id='sudcontainer'>
            <div id='sudtitle'>Sudoku</div>
          </div>
          <button id='mat' classList={{selected: UI() === UIType.matrix}} onClick={customMatrix}> matrix </button>
          <button id='fxf' classList={{selected: UI() === UIType.fxf}} onClick={fxf}> 4 x 4 </button>
          <button id='nxn' classList={{selected: UI() === UIType.nxn}} onClick={nxn}> 9 x 9 </button>
        </div>
        <PuzzleBoard
          boardState={boardState()}
          sudoku={UI() === UIType.fxf || UI() === UIType.nxn}
          rows={rows()}
          cols={cols()}
        />
        <div id='help'>
          {UI()===UIType.matrix ? matrixDesc : sudDesc}
        </div>
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

export default VisualizerApp;