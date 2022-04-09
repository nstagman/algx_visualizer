import './CustomMatrix.css'
import { JSXElement, Component, For, createSignal } from 'solid-js';


/**Object representing the state of an index in the matrix */
type MatrixIndexState = {
  index: number,
  getValue: () => number,
  setValue: (v: 0 | 1) => number
};

/**Returns array of MatrixIndexState with specified size*/
function _initMatrixState(size: number) {
  const matrixIndexState: Array<MatrixIndexState> = [];
  for(let i=0; i<size; i++){
    const [g, s] = createSignal(0);
    matrixIndexState.push({index: i, getValue: g, setValue: s});
  }
  return matrixIndexState;
}

/**Returns getter, setter functions for getting and creating a new CustomMatrix indexState prop (MatrixIndexState[])*/
function createMatrixState(size?: number): [() => MatrixIndexState[], (size: number) => MatrixIndexState[]] {
  const [getter, set] = createSignal(_initMatrixState(size != null ? size : 0));
  const setter = (s: number) => { return set(_initMatrixState(s)) };
  return [getter, setter];
}

/**Component for an index in the matrix.  Requires prop: MatrixIndexState Object */
const MatrixIndex: Component<any> = (props: any): JSXElement => {
  //create array of allowable numbers in this matrix
  const allowableKeys: Array<number> = [0, 1];

  //filter input for allowable numbers
  const keyDownCB = (event: KeyboardEvent) => {
    if(allowableKeys.includes(Number(event.key), 0)){
      props.setValue(Number(event.key)); //set value to key if in allowableKeys
    }
    else if(event.key === 'Delete' || event.key === 'Backspace'){
      props.setValue(0); //no number is represented with a value of 0
    }
  };

  return(
    <div
      id={'i' + props.index}
      className={'MatrixIndex'}
      tabIndex={0} //makes focusable
      onKeyDown={keyDownCB}
    >
      {props.getValue() > 0 ? props.getValue() : '\u00A0' /*render unicode nbsp character instead of 0*/}
    </div>
  );
};

/**Component representing a custom binary matrix.  Requires 'matrixState' prop: MatrixIndexState[] */
const CustomMatrix: Component<any> = (props: any): JSXElement => {
  //allow arrow keys to adjust index focus
  const arrowKeys: Array<string> = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const keyDownCB = (event: KeyboardEvent) => {
    const ID = Number((event.target as HTMLInputElement).id.replace('i', ''));
    switch(arrowKeys.indexOf(event.key)){
      case 0:
        if(ID - props.rows >= 0){ document.getElementById('i' + String(ID - props.cols+1))?.focus(); }
        break;
      case 1:
        if(ID + props.cols-1 < props.rows * props.cols){ document.getElementById('i' + String(ID + props.cols-1))?.focus(); }
        break;
      case 2:
        if(ID > 0){ document.getElementById('i' + String(ID - 1))?.focus(); }
        break;
      case 3:
        if(ID <= props.rows * props.cols){ document.getElementById('i' + String(ID + 1))?.focus(); }
        break;
      default:
    }
    event.preventDefault();
    event.stopPropagation();
  }

  return(
    <div 
      className='CustomMatrix'
      onKeyDown={keyDownCB}
      style={{
        'grid-template-columns': `repeat(${props.rows}, auto)`
      }}
    >
      <For each={props.matrixState}>
        { (indexState) => <MatrixIndex {...indexState} />}
      </For>
    </div>
  );
};


export { CustomMatrix, createMatrixState };