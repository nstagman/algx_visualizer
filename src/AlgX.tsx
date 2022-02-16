

class AlgXNode {
  readonly row: number;
  readonly col: number;
  count: number;
  aniRow: number;
  aniCol: number
  up!: AlgXNode;
  down!: AlgXNode;
  left!: AlgXNode;
  right!: AlgXNode;

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
  *iterateUp(excl: boolean = true): Generator<AlgXNode, void, void> {
    let itr: AlgXNode = this;
    if(!excl){ yield itr; }
    while(itr.up !== this){
      itr = itr.up;
      yield itr;
    }
  }
  *iterateDown(excl: boolean = true): Generator<AlgXNode, void, void> {
    let itr: AlgXNode = this;
    if(!excl){ yield itr; }
    while(itr.down !== this){
      itr = itr.down;
      yield itr;
    }
  }
  *iterateLeft(excl: boolean = true): Generator<AlgXNode, void, void> {
    let itr: AlgXNode = this;
    if(!excl){ yield itr; }
    while(itr.left !== this){
      itr = itr.left;
      yield itr;
    }
  }
  *iterateRight(excl: boolean = true): Generator<AlgXNode, void, void> {
    let itr: AlgXNode = this;
    if(!excl){ yield itr; }
    while(itr.right !== this){
      itr = itr.right;
      yield itr;
    }
  }
}

//Toroidally linked matrix
class AlgXMatrix {
  root: AlgXNode;
  rows: Array<AlgXNode>;
  cols: Array<AlgXNode>;
  solved: boolean;

  constructor(numRows: number, numCols: number){
    this.root = new AlgXNode(-1, -1);
    this.rows = []; //header nodes for rows - added for easier reactivity to user modification of the puzzle
    this.cols = []; //header nodes for cols
    this.solved = false;
    //instantiate row and col headers for matrix
    for(let i=0; i<numRows; i++) { this.rows.push(new AlgXNode(i, -1)); }
    for(let i=0; i<numCols; i++) { this.cols.push(new AlgXNode(-1, i, 0)); }
    //initialize links for row and col headers
    this.rows.forEach((node: AlgXNode, i: number) => {
      node.right = node;
      node.left = node;
      node.down = i < this.rows.length - 1 ? this.rows[i+1] : this.root;
      node.up = i > 0 ? this.rows[i-1] : this.root;
    });
    this.cols.forEach((node: AlgXNode, i: number) => {
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

  //row must be empty and nodes must be in increasing columnal order
  insertRow(row: number, cols: Array<number>): void {
    //return if this row isn't empty
    if(this.rows[row].right !== this.rows[row]){ return; }
    let newRow: Array<AlgXNode> = [];
    //create new nodes for each pair of coords assign up and down links
    cols.forEach((col: number) => {
      let newNode: AlgXNode = new AlgXNode(row, col);
      let itrNode: AlgXNode = this.cols[col];
      for(const n of this.cols[col].iterateDown(false)){
        if(n.down.row === -1 || n.down.row > row){
          itrNode = n;
          break;
        }
      }
      newNode.down = itrNode.down;
      newNode.up = itrNode;
      newNode.down.up = newNode;
      itrNode.down = newNode;
      this.cols[col].count += 1;
      newRow.push(newNode);
    });
    newRow.forEach((node: AlgXNode, i: number) => {
      node.right = i < newRow.length - 1 ? newRow[i+1] : this.rows[node.row];
      node.left = i > 0 ? newRow[i-1] : this.rows[node.row];
    });
    this.rows[newRow[0].row].right = newRow[0];
    this.rows[newRow[0].row].left = newRow[newRow.length-1];
  }

  //adjust all up and down linked nodes of nodes in a row. set row header left and right nodes to itself
  removeRow(row: number): void {
    for(const n of this.rows[row].iterateRight()){
      n.up.down = n.down;
      n.down.up = n.up;
      this.cols[n.col].count -= 1;
    }
    this.rows[row].right = this.rows[row];
    this.rows[row].left = this.rows[row];
  }

  //returns column containing the minimum number of nodes
  selectMinCol(): AlgXNode {
    if(this.isEmpty()){ return this.root; }
    let minNode: AlgXNode = this.root.right;
    let minCount: number = this.root.right.count;
    for(const col of this.root.iterateRight()){
      if(col.count < minCount){
        minNode = col;
        minCount = col.count;
      }
    }
    return minNode;
  }

  //cover a row (partial solution) of the matrix
  //'removes' the column of each node in rowHead from the matrix
  //iterate down each 'removed' column and cover each row
  coverPartialSolution(rowHead: AlgXNode): void {
    //for each node in selected row
    for(const rowNode of rowHead.iterateRight()){
      //'remove' node's column from matrix
      let col = this.cols[rowNode.col];
      col.right.left = col.left;
      col.left.right = col.right;
      //iterate down from node's column header
      for(const colNode of col.iterateDown()){
        this.coverRow(colNode);
      }
    }
  }

  //iterate right from start node and remove each node from its column
  coverRow(startNode: AlgXNode): void {
    for(const node of startNode.iterateRight()){
      //'remove' each node from its column
      node.up.down = node.down;
      node.down.up = node.up;
      if(node.col >= 0){ this.cols[node.col].count -= 1; }
    }
  }

  //performs the cover function in reverse for specified row
  //restoring all columns and associated nodes back into the matrix
  uncoverPartialSolution(rowHead: AlgXNode): void {
    //for each node in selected row
    for(const rowNode of rowHead.iterateLeft()){
      let col = this.cols[rowNode.col];
      //iterate up from node's column header
      for(const colNode of col.iterateUp()){
        this.uncoverRow(colNode);
      }
      //'insert' node's column back into matrix
      col.right.left = col;
      col.left.right = col;
    }
  }

  //iterate left from start node and insert each node back into its column
  uncoverRow(startNode: AlgXNode): void {
    for(const node of startNode.iterateLeft()){
      //'insert' each node back in to its column
      node.up.down = node;
      node.down.up = node;
      if(node.col >= 0){ this.cols[node.col].count += 1; }
    }
  }

  algXSearch(): Array<number> {
    let solutions: Array<number> = []

    const search = (): boolean => {
      if(this.isEmpty()){ //solution exists when matrix is empty
        this.solved = true;
        return true;
      }
      //select col with minimum nodes to continue search
      let selCol: AlgXNode = this.selectMinCol();
      if(selCol.count < 1){ return false; } //this branch has failed

      //iterate down from selected columns
      for(const vItr of selCol.iterateDown()){
        solutions.push(vItr.row); //select next node as partial solution
        this.coverPartialSolution(this.rows[vItr.row]);

        //search again after covering
        //if solution is found on this branch, leave loop and stop
        if(search()){ break; }

        //solution not found on this branch, pop it then uncover the selected partial solution
        solutions.pop();
        this.uncoverPartialSolution(this.rows[vItr.row]);
      }
      return this.solved;
    };

    search();
    return solutions;
  }

  isEmpty(): boolean {
    return this.root.right === this.root;
  }
}

//--- Sudoku specific functions below ---
const oneConstraint = (row: number, dim: number): number => {
  return (row/dim)|0;
};
const rowConstraint = (row: number, dim: number): number => {
  return dim*dim + dim*((row/(dim*dim))|0) + (row % dim);
};
const colConstraint = (row: number, dim: number): number => {
  return 2*(dim*dim) + (row % (dim*dim));
};
const boxConstraint = (row: number, dim: number): number => {
  return 3*(dim*dim) + ((row/(Math.sqrt(dim)*(dim*dim)))|0) * (dim*Math.sqrt(dim)) +
    (((row/(Math.sqrt(dim)*dim))|0) % Math.sqrt(dim)) * dim + (row % dim);
};

const buildMatrix = (puzzle: Array<number>, dim: number): AlgXMatrix => {
  const numRows = dim*dim*dim;
  const numcols = dim*dim*4;
  const matrix = new AlgXMatrix(numRows, numcols);
  puzzle.forEach((cell: number, i: number) => {
    if(cell === 0){
      for(let j=0; j<dim; j++){
        let row = i * dim + j;
        const oc = oneConstraint(row, dim);
        const rc = rowConstraint(row, dim);
        const cc = colConstraint(row, dim);
        const bc = boxConstraint(row, dim);
        matrix.insertRow(row, [oc, rc, cc, bc]);
      }
    }
    else{
      let row = i * dim + cell - 1;
      const oc = oneConstraint(row, dim);
      const rc = rowConstraint(row, dim);
      const cc = colConstraint(row, dim);
      const bc = boxConstraint(row, dim);
      matrix.insertRow(row, [oc, rc, cc, bc]);
    }
  });
  return matrix;
};

const decodeSolution = (solution: Array<number>): Array<number> => {
  let solvedPuzzle: Array<number> = [];
  const dim = Math.sqrt(solution.length);
  for(let i=0; i< solution.length; i++){ solvedPuzzle.push(0); }
  solution.forEach((row: number) => {
    solvedPuzzle[(row/dim)|0] = (row % dim) + 1
  });
  return solvedPuzzle;
};

export { AlgXMatrix, buildMatrix, decodeSolution }
