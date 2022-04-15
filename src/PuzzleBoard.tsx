import './PuzzleBoard.css'
import { JSXElement, Component, For, createSignal } from 'solid-js';


/**Object representing the state of a square in the puzzle */
type PuzzleSquareState = {
  squareNum: number,
  getValue: () => number,
  setValue: (v: number) => number,
  getComputed: () => boolean,
  setComputed: (v: boolean) => boolean
};

/**Returns array of PuzzleBoardState with specified size*/
function _initBoardState(size: number) {
  const puzzleBoardState: Array<PuzzleSquareState> = [];
  for(let i=0; i<size; i++){
    const [gv, sv] = createSignal(0);
    const [gc, sc] = createSignal(false);
    puzzleBoardState.push({squareNum: i, getValue: gv, setValue: sv, getComputed: gc, setComputed: sc});
  }
  return puzzleBoardState;
}

/**Returns getter, setter functions for getting and creating a new PuzzleBoard boardState prop (PuzzleSquareState[])*/
function createBoardState(size?: number): [() => PuzzleSquareState[], (size: number) => PuzzleSquareState[]] {
  const [getter, set] = createSignal(_initBoardState(size != null ? size : 0));
  const setter = (s: number) => { return set(_initBoardState(s)) };
  return [getter, setter];
}

/**Component for a square in the puzzle.  Requires prop: PuzzleSquareState Object */
const PuzzleSquare: Component<any> = (props: any): JSXElement => {
  //determine if this square needs increased right or bottom margins
  const rmargin = props.sudoku && (props.squareNum + 1) % Math.sqrt(props.maxVal) === 0;
  const bmargin = props.sudoku && (props.squareNum + props.maxVal) % (props.maxVal * Math.sqrt(props.maxVal)) < props.maxVal;

  //create array of allowable numbers in this puzzle
  const allowableKeys: Array<number> = [];
  for(let i=0; i <= props.maxVal; i++){
    allowableKeys.push(i);
  }

  //filter input for allowable numbers
  const keyDownCB = (event: KeyboardEvent) => {
    if(!props.enableInput) { return; }
    if(allowableKeys.includes(Number(event.key), 0)){
      props.setValue(Number(event.key)); //set value to key if in allowableKeys
      props.setComputed(false);
    }
    else if(event.key === 'Delete' || event.key === 'Backspace'){
      props.setValue(0); //no number is represented with a value of 0
      props.setComputed(false);
    }
  };

  return(
    <div
      id={'sq' + props.squareNum}
      className={props.sudoku ? 'PuzzleSquare' : 'MatrixIndex'}
      tabIndex={0} //makes focusable
      onKeyDown={keyDownCB}
      style={{
        "margin-right": `${rmargin ? "2px" : "0px"}`,
        "margin-bottom": `${bmargin ? "2px" : "0px"}`
      }}
    >
      {/*write the unicode nbsp character instead of 0 for sudoku puzzles*/}
      {props.sudoku
      ? props.getValue() > 0 ? props.getValue() : '\u00A0'
      : props.getValue()}
    </div>
  );
};

/**Component representing a sudoku puzzle.  Requires 'boardState' prop: PuzzleBoardState[] */
const PuzzleBoard: Component<any> = (props: any): JSXElement => {
  //allow arrow keys to adjust square focus
  const arrowKeys: Array<string> = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const keyDownCB = (event: KeyboardEvent) => {
    const sqID = Number((event.target as HTMLInputElement).id.replace('sq', ''));
    switch(arrowKeys.indexOf(event.key)){
      case 0:
        if(sqID - props.rows >= 0){ document.getElementById('sq' + String(sqID - props.cols))?.focus(); }
        break;
      case 1:
        if(sqID + props.cols-1 < props.rows * props.cols){ document.getElementById('sq' + String(sqID + props.cols))?.focus(); }
        break;
      case 2:
        if(sqID > 0){ document.getElementById('sq' + String(sqID - 1))?.focus(); }
        break;
      case 3:
        if(sqID <= props.rows * props.cols){ document.getElementById('sq' + String(sqID + 1))?.focus(); }
        break;
      default:
    }
    event.preventDefault();
    event.stopPropagation();
  }

  return(
    <div 
      className={props.sudoku ? 'PuzzleBoard' : 'CustomMatrix'}
      onKeyDown={keyDownCB}
      style={{
        'grid-template-columns': `repeat(${props.cols}, auto)`
      }}
    >
      <For each={props.boardState}>
        { (squareState) => <PuzzleSquare 
                            {...squareState} 
                            sudoku={props.sudoku} 
                            maxVal={props.sudoku ? props.rows : 1} 
                            enableInput={props.enableInput}
                            />
        }
      </For>
    </div>
  );
};


export { PuzzleBoard, createBoardState };