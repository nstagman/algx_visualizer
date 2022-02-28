import { NodeDrawInfo, LinkDrawInfo } from './AlgVis';


class AlgXNode {
  readonly row: number;
  readonly col: number;
  count: number;
  up!: AlgXNode;
  down!: AlgXNode;
  left!: AlgXNode;
  right!: AlgXNode;
  //track animation properties on the nodes
  nodeInfo: NodeDrawInfo;
  linkInfo: { up: LinkDrawInfo, down: LinkDrawInfo, left: LinkDrawInfo, right: LinkDrawInfo };

  //**up, down, left, right fields must be initialized after instantiation */
  constructor(row: number, col: number, count: number = -1){
    this.row = row;
    this.col = col;
    this.count = count;
    this.nodeInfo = { row: row, col: col, focused: false };
    this.linkInfo = {
      up: this.getInitLinkInfo(),
      down: this.getInitLinkInfo(),
      left: this.getInitLinkInfo(),
      right: this.getInitLinkInfo()
    };
  }

  //returns initialized link animation info that represents a static fully drawn link
  getInitLinkInfo(): LinkDrawInfo {
    return { animating: false, reverse: false, draw: true, pct: 100, start: undefined }
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
  solution: Array<number>;

  constructor(numRows: number, numCols: number){
    this.root = new AlgXNode(-1, -1);
    this.rows = []; //header nodes for rows - added for easier reactivity to user modification of the puzzle
    this.cols = []; //header nodes for cols
    this.solved = false;
    this.solution = [];
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

  //returns whether the matrix is empty
  isEmpty(): boolean {
    return this.root.right === this.root;
  }

  //#region Matrix Manipulation
  //inserts a row of nodes into the matrix
  //row must be empty and nodes must be in increasing columnal order
  insertRow(row: number, cols: Array<number>): void {
    //return if this row isn't empty
    if(this.rows[row].right !== this.rows[row]){ return; }
    let newRow: Array<AlgXNode> = [];
    //create new nodes for each pair of coords assign up and down links
    cols.forEach((col: number) => {
      let newNode: AlgXNode = new AlgXNode(row, col);
      let itrNode: AlgXNode = this.cols[col];
      //search down from col header to find row
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
    //iterate through new row and set left and right links
    newRow.forEach((node: AlgXNode, i: number) => {
      node.right = i < newRow.length - 1 ? newRow[i+1] : this.rows[node.row];
      node.left = i > 0 ? newRow[i-1] : this.rows[node.row];
    });
    //set left and right links of row header
    this.rows[newRow[0].row].right = newRow[0];
    this.rows[newRow[0].row].left = newRow[newRow.length-1];
  }

  //remove a row of nodes from the matrix
  //adjust all up and down linked nodes of nodes in a row. set row header left and right nodes to itself
  removeRow(row: number): void {
    for(const n of this.rows[row].iterateRight()){
      n.up.down = n.down;
      n.down.up = n.up;
      this.cols[n.col].count -= 1;
      n.left.right = this.rows[row];
      n.left = this.rows[row];
      
    }
    this.rows[row].right = this.rows[row];
    this.rows[row].left = this.rows[row];
  }

  //add a single node into the matrix
  addNode(row: number, col: number): void {
    const newNode = new AlgXNode(row, col);
    //add node into the row at correct column
    let n: AlgXNode = this.rows[row];
    for(const itr of this.rows[row].iterateRight()){
      if(itr.right.col == -1 || itr.right.col > col){
        n = itr;
        break;
      }
    }
    newNode.right = n.right;
    newNode.left = n;
    newNode.right.left = newNode;
    n.right = newNode;

    //add node to column at correct row
    n = this.cols[col];
    for(const itr of this.cols[col].iterateDown()){
      if(itr.down.row == -1 || itr.down.row > row){
        n = itr;
        break;
      }
    }
    newNode.down = n.down;
    newNode.up = n;
    newNode.down.up = newNode;
    newNode.down = newNode;
    this.cols[col].count += 1;
  }

  //removes a single node from the matrix
  removeNode(row: number, col: number): void {
    for(const node of this.rows[row].iterateRight()){
      if(node.col == col){
        node.up.down = node.down;
        node.down.up = node.up;
        node.left.right = node.right;
        node.right.left = node.left;
        break;
      }
    }
  }
//#endregion

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

  //#region Standard AlgX functions
  //cover a row (partial solution) of the matrix
  //'removes' the column of each node in rowHead from the matrix
  //iterate down each 'removed' column and cover each row
  coverPartialSolution(selectedRow: AlgXNode): void {
    //for each node in selected row
    for(const node of selectedRow.iterateRight()){
      //'remove' node's column from matrix
      let coverCol = this.cols[node.col];
      coverCol.right.left = coverCol.left;
      coverCol.left.right = coverCol.right;
      //iterate down from node's column header
      for(const colNode of coverCol.iterateDown()){
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
      //don't attempt to access the row-headers column
      if(node.col >= 0){ this.cols[node.col].count -= 1; }
    }
  }

  //performs the cover function in reverse for specified row
  //restoring all columns and associated nodes back into the matrix
  uncoverPartialSolution(selectedRow: AlgXNode): void {
    //for each node in selected row
    for(const node of selectedRow.iterateLeft()){
      let uncoverCol = this.cols[node.col];
      //iterate up from node's column header
      for(const colNode of uncoverCol.iterateUp()){
        this.uncoverRow(colNode);
      }
      //'insert' node's column back into matrix
      uncoverCol.right.left = uncoverCol;
      uncoverCol.left.right = uncoverCol;
    }
  }

  //iterate left from start node and insert each node back into its column
  uncoverRow(startNode: AlgXNode): void {
    for(const node of startNode.iterateLeft()){
      //'insert' each node back in to its column
      node.up.down = node;
      node.down.up = node;
      //don't attempt to access the row-headers column
      if(node.col >= 0){ this.cols[node.col].count += 1; }
    }
  }

  //Perform algorithm X to search for an exact cover of the matrix
  algXSearch(): Array<number> {
    let solutions: Array<number> = []
    //recursive search function
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
  //#endregion

  //algorithm X search as a generator to hook into the animator
  //all cover/uncover functions are inlined in this generator to give granular control of the animation
  *animatedAlgXSearch(): Generator<any, boolean, any> {
    //recursive search function
    if(this.isEmpty()){ //solution exists when matrix is empty
      this.solved = true;
      return true;
    }
    //select col with minimum nodes to continue search
    let selCol: AlgXNode = this.selectMinCol();
    if(selCol.count < 1){ return false; } //this branch has failed

    //iterate down from selected columns
    for(const solSearchNode of selCol.iterateDown()){
      this.solution.push(solSearchNode.row);

      // -- Cover Partial Solution
      //for each node in selected row
      for(const node of solSearchNode.iterateRight(false)){
        if(node.col < 0){ continue; }
        let coverCol = this.cols[node.col];
        //iterate down from covered column header
        for(const coverColNode of coverCol.iterateDown()){
          //cover each row
          for(const node of coverColNode.iterateRight()){
            //update animation info for unlinking the links
            node.linkInfo.up.draw = false;
            node.linkInfo.down.draw = false;
            node.up.linkInfo.down.animating = true;
            node.up.linkInfo.down.reverse = true;
            node.up.linkInfo.down.pct = 0;
            node.down.linkInfo.up.animating = true;
            node.down.linkInfo.up.reverse = true;
            node.down.linkInfo.up.pct = 0;
            yield;
            //update animation info for relinking newly assigned links
            node.up.down = node.down;
            node.down.up = node.up;
            node.up.linkInfo.down.animating = true;
            node.up.linkInfo.down.reverse = false;
            node.up.linkInfo.down.pct = 0;
            node.down.linkInfo.up.draw = false;
            //don't attempt to access the row-headers column
            if(node.col >= 0){ this.cols[node.col].count -= 1; }
            yield;
          }
        }
        //cover each nodes column - 'remove' node's column from matrix
        coverCol.right.left = coverCol.left;
        coverCol.left.right = coverCol.right;
      }

      //search again after covering
      //if solution is found on this branch, leave loop and stop
      for(const yieldVal of this.animatedAlgXSearch()){ yield yieldVal; }
      if(this.solved){ break; }

      // -- Uncover Partial Solution
      //for each node in selected row
      this.solution.pop();
      for(const node of solSearchNode.iterateLeft()){
        if(node.col < 0){ continue; }
        let uncoverCol = this.cols[node.col];
        //iterate up from column header
        for(const colNode of uncoverCol.iterateUp()){
          //uncover each row
          for(const node of colNode.iterateLeft(false)){
            //'insert' each node back in to its column
            //update animation for unlinking links
            node.up.linkInfo.down.animating = true;
            node.up.linkInfo.down.reverse = true;
            node.up.linkInfo.down.pct = 0;
            yield;
            //update animation info for relinking newly assigned links
            node.up.down = node;
            node.down.up = node;
            node.up.linkInfo.down.animating = true;
            node.up.linkInfo.down.reverse = false;
            node.up.linkInfo.down.pct = 0;
            node.down.linkInfo.up.animating = true;
            node.down.linkInfo.up.reverse = false;
            node.down.linkInfo.up.pct = 0;
            node.down.linkInfo.up.draw = true;
            //don't attempt to access the row-headers column
            if(node.col >= 0){ this.cols[node.col].count += 1; }
            yield;
            //let the links be drawn since we are now doubly linked again
            node.linkInfo.up.draw = true;
            node.linkInfo.down.draw = true;
          }
        }
        //'insert' node's column back into matrix
        uncoverCol.right.left = uncoverCol;
        uncoverCol.left.right = uncoverCol;
      }
    }
    return this.solved;
  }
}

const buildTest = (): AlgXMatrix => {
  const matrix = new AlgXMatrix(6, 7);
  matrix.insertRow(0, [0,3,6]);
  matrix.insertRow(1, [0,3]);
  matrix.insertRow(2, [3,4,6]);
  matrix.insertRow(3, [2,4,5]);
  matrix.insertRow(4, [1,2,5,6]);
  matrix.insertRow(5, [1,6]);
  // matrix.addNode(0,0);
  // matrix.addNode(0,3);
  // matrix.addNode(0,6);
  // matrix.addNode(1,0);
  // matrix.addNode(1,3);
  // matrix.addNode(2,3);
  // matrix.addNode(2,4);
  // matrix.addNode(2,6);
  // matrix.addNode(3,2);
  // matrix.addNode(3,4);
  // matrix.addNode(3,5);
  // matrix.addNode(4,1);
  // matrix.addNode(4,2);
  // matrix.addNode(4,5);
  // matrix.addNode(4,6);
  // matrix.addNode(5,1);
  // matrix.addNode(5,6);
  return matrix;
};

//#region Sudoku Specific Functions
//constraint functions - returns column of node for a constraint when given the row and puzzle dimension
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

const buildSudMatrix = (puzzle: Array<number>): AlgXMatrix => {
  const dim: number = Math.sqrt(puzzle.length);
  const numRows = dim*dim*dim;
  const numcols = dim*dim*4;
  const matrix = new AlgXMatrix(numRows, numcols);
  puzzle.forEach((squareValue: number, i: number) => {
    if(squareValue === 0){
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
      let row = i * dim + squareValue - 1;
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
//#endregion

export { AlgXMatrix, buildSudMatrix, buildTest, decodeSolution }
