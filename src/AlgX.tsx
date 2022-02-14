

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
    this.rows.forEach((node: AlgxNode, i: number) => {
      node.right = node;
      node.left = node;
      node.down = i < this.rows.length - 1 ? this.rows[i+1] : this.root;
      node.up = i > 0 ? this.rows[i-1] : this.root;
    });
    this.cols.forEach((node: AlgxNode, i: number) => {
      node.up = node;
      node.down = node;
      node.right = i < this.cols.length - 1 ? this.cols[i+1] : this.root;
      node.left = i > 0 ? this.cols[i-1] : this.root;
    });
    //initialize links for root
    this.root.right = this.cols[0];
    this.root.left = this.cols[this.cols.length-1];
    this.root.down = this.rows[0];
    this.root.up = this.rows[this.rows.length-1];
  }

  insertRow(coords: Array<[number, number]>): void {

  }

  removeRow(row: number): void {

  }

  cover(node: AlgxNode): void {

  }

  uncover(node: AlgxNode): void {

  }

  algXSearch(): boolean {
    return false;
  }

  isEmpty(): boolean {
    return this.root.right === this.root;
  }
}