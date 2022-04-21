import './PuzzleBoard.css'
import { JSXElement, Component, For, createSignal, Show } from 'solid-js';


/**Object representing the state of a square in the puzzle */
type PuzzleSquareState = {
  squareNum: number,
  getValue: () => number, //get value set by algx
  setValue: (v: number) => number, //fn for algx to set value
  manValue: () => number, //get value set through ui
  setManValue: (v: number) => number, //fn to set value with ui
  isSolution: () => boolean, //get solution flag
  setSolution: (v: boolean) => boolean //set solution flag
};

/**Returns array of PuzzleBoardState with specified size*/
function _initBoardState(size: number) {
  const puzzleBoardState: Array<PuzzleSquareState> = [];
  for(let i=0; i<size; i++){
    const [gv, sv] = createSignal(0);
    const [mv, smv] = createSignal(0, {equals: false});
    const [gs, ss] = createSignal(false);
    puzzleBoardState.push({
      squareNum: i,
      getValue: gv,
      setValue: sv,
      manValue: mv,
      setManValue: smv,
      isSolution: gs,
      setSolution: ss,
    });
  }
  return puzzleBoardState;
}

/**Returns getter, setter functions for getting and creating a new PuzzleBoard boardState prop (PuzzleSquareState[])*/
function createBoardState(size?: number, kwargs?: Object): [() => PuzzleSquareState[], (size: number) => PuzzleSquareState[]] {
  const [getter, set] = createSignal(_initBoardState(size != null ? size : 0), kwargs);
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
    if(allowableKeys.includes(Number(event.key), 0)){
      props.setManValue(Number(event.key)); //set value to key if in allowableKeys
      props.setValue(0);
      props.setSolution(false);
    }
    else if(event.key === 'Delete' || event.key === 'Backspace'){
      props.setManValue(0); //no number is represented with a value of 0
      props.setValue(0);
      props.setSolution(false);
    }
  };

  //determine the text to show inside this square
  let inner;
  if(props.sudoku){ inner =
    <Show when={props.manValue() > 0} fallback={props.getValue() > 0 ? props.getValue() : '\u00A0'}>
      {props.manValue() > 0 ? props.manValue() : '\u00A0'}
    </Show>
  }
  else{ inner =
    <Show when={props.manValue() > 0} fallback={props.getValue()}>
      {props.manValue()}
    </Show>
  }

  return(
    <div
      id={'sq' + props.squareNum }
      classList={{
        PuzzleSquare: props.sudoku,
        MatrixIndex: !props.sudoku,
        Solution: props.isSolution()
      }}
      tabIndex={0} //makes focusable
      onKeyDown={keyDownCB}
      style={{
        "margin-right": `${rmargin ? "2px" : "0px"}`,
        "margin-bottom": `${bmargin ? "2px" : "0px"}`
      }}
    >
      {inner}
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
        { (squareState) =>
          <PuzzleSquare
            {...squareState}
            sudoku={props.sudoku}
            maxVal={props.sudoku ? props.rows : 1}
          />
        }
      </For>
    </div>
  );
};


export { PuzzleBoard, createBoardState };