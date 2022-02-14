

class AlgxNode {
  readonly row: number;
  readonly col: number;
  count: number;
  aniRow: number;
  aniCol: number
  up!: AlgxNode;
  down!: AlgxNode;
  left!: AlgxNode;
  right!: AlgxNode;

  //**up, down, left, right fields must be initialized after instantiation */
  constructor(row: number, col: number, count: number = -1){
      this.row = row;
      this.col = col;
      this.count = count;
      this.aniRow = row;
      this.aniCol = col;
  }

  //Generators to iterate full circle from this node
  //If excl is true, this node will not be yielded
  *iterateUp(excl: boolean = true): Generator<AlgxNode, void, void> {
    let itr: AlgxNode = this;
    if(!excl){ yield itr; }
    while(itr.up !== this){
      itr = itr.up;
      yield itr;
    }
  }
  *iterateDown(excl: boolean = true): Generator<AlgxNode, void, void> {
    let itr: AlgxNode = this;
    if(!excl){ yield itr; }
    while(itr.down !== this){
      itr = itr.down;
      yield itr;
    }
  }
  *iterateLeft(excl: boolean = true): Generator<AlgxNode, void, void> {
    let itr: AlgxNode = this;
    if(!excl){ yield itr; }
    while(itr.left !== this){
      itr = itr.left;
      yield itr;
    }
  }
  *iterateRight(excl: boolean = true): Generator<AlgxNode, void, void> {
    let itr: AlgxNode = this;
    if(!excl){ yield itr; }
    while(itr.right !== this){
      itr = itr.right;
      yield itr;
    }
  }
}

class AlgX_Matrix {
  root: AlgxNode;
  rows: Array<AlgxNode>;
  cols: Array<AlgxNode>;
  solved: boolean;

  constructor(numRows: number, numCols: number){
    this.root = new AlgxNode(-1, -1);
    this.rows = [];
    this.cols = [];
    this.solved = false;
    //instantiate row and col headers for matrix
    for(let i=0; i<numRows; i++) { this.rows.push(new AlgxNode(i, -1)); }
    for(let i=0; i<numCols; i++) { this.cols.push(new AlgxNode(-1, i, 0)); }
    //initialize links for row and col headers
    
  }
}