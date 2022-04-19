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
    this.nodeInfo = { row: row, col: col, focused: false, covered: false, solution: false };
    this.linkInfo = {
      up: this.getInitLinkInfo('up'),
      down: this.getInitLinkInfo('down'),
      left: this.getInitLinkInfo('left'),
      right: this.getInitLinkInfo('right')
    };
  }

  //returns initialized link animation info that represents a static fully drawn link
  getInitLinkInfo(dir: 'up' | 'down' | 'left' | 'right'): LinkDrawInfo {
    return { dir: dir, animating: false, reverse: false, draw: true, pct: 100 }
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
  focusedNode: AlgXNode;
  focusedCol?: number;

  constructor(numRows: number, numCols: number){
    this.root = new AlgXNode(-1, -1);
    this.rows = []; //header nodes for rows - added for easier reactivity to user modification of the puzzle
    this.cols = []; //header nodes for cols
    this.solved = false;
    this.solution = [];
    this.focusedNode = this.root;

    //instantiate row and col headers for matrix
    for(let i=0; i<numRows; i++) { this.rows.push(new AlgXNode(i, -1)); }
    for(let i=0; i<numCols; i++) { this.cols.push(new AlgXNode(-1, i, 0)); }

    //initialize links for row and col headers
    for(const [i, node] of this.rows.entries()){
      node.right = node;
      node.left = node;
      node.down = i < this.rows.length - 1 ? this.rows[i+1] : this.root;
      node.up = i > 0 ? this.rows[i-1] : this.root;
    }
    for(const [i, node] of this.cols.entries()){
      node.up = node;
      node.down = node;
      node.right = i < this.cols.length - 1 ? this.cols[i+1] : this.root;
      node.left = i > 0 ? this.cols[i-1] : this.root;
    }
    //initialize links for root
    this.root.right = this.cols[0];
    this.root.left = this.cols[this.cols.length-1];
    this.root.down = this.rows[0];
    this.root.up = this.rows[this.rows.length-1];
  }

  //iterate over every node in the matrix (left-to-right, top-to-bottom) and apply function fn to each node
  allNodeMap(fn: (node: AlgXNode) => any): any {
    //apply to root
    let rval = fn(this.root);
    //apply to column headers
    for(const node of this.cols) {
      rval ||= fn(node);
    }
    //apply to each row
    for(const row of this.rows){
      for(const node of row.iterateRight(false)){
        rval ||= fn(node);
      }
    }
    return rval;
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

    //create new nodes for each pair of coords assign up and down links
    let newRow: Array<AlgXNode> = [];
    for(const col of cols){
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
    }

    //assign left and right links for each node in the row
    for(const [i, node] of newRow.entries()){
      node.right = i < newRow.length - 1 ? newRow[i+1] : this.rows[node.row];
      node.left = i > 0 ? newRow[i-1] : this.rows[node.row];
    }
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
  //yeilding 0 defers resumption of this search to the animator
  //yielding a non zero value specifies a percentage of time that should be awaited before resumption
  *animatedAlgXSearch(): Generator<number, boolean, any> {
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
        if(node.col < 0){ continue; } //skip row headers

        //unlink column header
        let coverCol = this.cols[node.col];
        this.focusNode(coverCol);
        coverCol.linkInfo.left.draw = false;
        coverCol.linkInfo.right.draw = false;
        this.unlinkAniUpdate(coverCol.left.linkInfo.right);
        this.unlinkAniUpdate(coverCol.right.linkInfo.left);
        yield 0;

        //relink new links around header
        coverCol.right.left = coverCol.left;
        coverCol.left.right = coverCol.right;
        this.relinkAniUpdate(coverCol.left.linkInfo.right);
        coverCol.right.linkInfo.left.draw = false;
        coverCol.nodeInfo.covered = true;
        yield 0;

        //highlight partial solution
        for(const node of this.rows[solSearchNode.row].iterateRight(false)){
          node.nodeInfo.solution = true;
        }

        //iterate down from covered column header
        for(const colNode of coverCol.iterateDown()){
          //cover each row
          this.focusNode(colNode);
          for(const rowNode of colNode.iterateRight()){
            //update animation info for unlinking the links of each node in the row
            rowNode.linkInfo.up.draw = false;
            rowNode.linkInfo.down.draw = false;
            this.unlinkAniUpdate(rowNode.up.linkInfo.down);
            this.unlinkAniUpdate(rowNode.down.linkInfo.up);
          }
          yield 0;

          //update animation info for relinking newly assigned links around the row
          for(const rowNode of colNode.iterateRight()){
            rowNode.up.down = rowNode.down;
            rowNode.down.up = rowNode.up;
            this.relinkAniUpdate(rowNode.up.linkInfo.down);
            rowNode.down.linkInfo.up.draw = false;
            //don't attempt to access the row-headers column
            if(rowNode.col >= 0){ this.cols[rowNode.col].count -= 1; }
          }
          yield 0;

          //update covered status after all links are relinked
          for(const rowNode of colNode.iterateRight(false)){
            rowNode.nodeInfo.covered = true;
          }
        }
      }

      //search again after covering
      //if solution is found on this branch, leave loop and stop
      for(const yieldVal of this.animatedAlgXSearch()){ yield yieldVal; }
      if(this.solved){ break; }

      // -- Uncover Partial Solution
      //for each node in selected row
      for(const node of solSearchNode.left.iterateLeft(false)){
        if(node.col < 0){ continue; }

        //'insert' node's column back into matrix
        //unlink nodes around column header
        let uncoverCol = this.cols[node.col];
        this.focusNode(uncoverCol);
        this.unlinkAniUpdate(uncoverCol.left.linkInfo.right);
        yield 0;

        //relink column header
        uncoverCol.right.left = uncoverCol;
        uncoverCol.left.right = uncoverCol;
        this.relinkAniUpdate(uncoverCol.left.linkInfo.right);
        this.relinkAniUpdate(uncoverCol.right.linkInfo.left);
        uncoverCol.nodeInfo.covered = false;
        yield 0;
        uncoverCol.linkInfo.left.draw = true;
        uncoverCol.linkInfo.right.draw = true;

        //iterate up from column header
        for(const colNode of uncoverCol.iterateUp()){
          //uncover each row
          //unlink nodes around each node of row
          this.focusNode(colNode);
          for(const rowNode of colNode.iterateLeft()){
            //update animation for unlinking links
            rowNode.up.linkInfo.down.draw = false;
            rowNode.down.linkInfo.up.draw = false;
            this.unlinkAniUpdate(rowNode.up.linkInfo.down);
          }
          yield 0;

          //relink each node in the row
          for(const rowNode of colNode.iterateLeft()){
            //'insert' each node back in to its column
            //update animation info for relinking newly assigned links
            rowNode.up.down = rowNode;
            rowNode.down.up = rowNode;
            this.relinkAniUpdate(rowNode.up.linkInfo.down);
            this.relinkAniUpdate(rowNode.down.linkInfo.up);
            //don't attempt to access the row-headers column
            if(rowNode.col >= 0){ this.cols[rowNode.col].count += 1; }
          }
          yield 0;

          //remove covered status after relinking nodes
          for(const rowNode of colNode.iterateLeft()){
            //let the links be drawn since we are now doubly linked again
            rowNode.linkInfo.up.draw = true;
            rowNode.linkInfo.down.draw = true;
            rowNode.nodeInfo.covered = false;
            if(rowNode.row === solSearchNode.row){
              rowNode.nodeInfo.solution = false;
            }
          }
          colNode.nodeInfo.covered = false;
          if(colNode.row === solSearchNode.row){
            colNode.nodeInfo.solution = false;
          }
        }
      }
      this.solution.pop();
    }
    this.focusNode(this.root)
    yield 0;
    return this.solved;
  }

  //updates link animation info for unlinking a specified link
  unlinkAniUpdate(link: LinkDrawInfo): void{
    link.draw = true;
    link.animating = true;
    link.reverse = true;
    link.pct = 100;
  }

  //updates link animation info for relinking a specified link
  relinkAniUpdate(link: LinkDrawInfo): void{
    link.draw = true;
    link.animating = true;
    link.reverse = false;
    link.pct = 0;
  }

  //sets the specified node to be focused
  focusNode(node: AlgXNode): void {
    this.focusedNode.nodeInfo.focused = false;
    this.focusedNode = node;
    node.nodeInfo.focused = true;
  }
}

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

//convert array of ints representing a sudoku puzzle into AlgXMatrix
const buildSudMatrix = (puzzle: Array<number>): AlgXMatrix => {
  const dim: number = Math.sqrt(puzzle.length);
  const numRows = dim*dim*dim;
  const numcols = dim*dim*4;
  const matrix = new AlgXMatrix(numRows, numcols);
  for(const [i, squareValue] of puzzle.entries()){
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
  }
  return matrix;
};

//convert array of numbers representing a binary matrix into an AlgXMatrix
const buildMatrix = (matrixData: Array<Number>, numRows: number, numCols: number): AlgXMatrix => {
  const matrix = new AlgXMatrix(numRows, numCols);
  let colNodes: Array<number>;
  for(let i=0; i<numRows; i++){
    colNodes = [];
    for(let j=0; j<numCols; j++){
      if(matrixData[i*numCols+j] > 0) { colNodes.push(j); }
    }
    if(colNodes.length > 0){ matrix.insertRow(i, colNodes); }
  }
  return matrix;
};

//returns array representing a sudoku board from a given AlgXMatrix solution
const decodeSolution = (solution: Array<number>, length:number): Array<number> => {
  let solvedPuzzle: Array<number> = [];
  const dim = Math.sqrt(length);
  for(let i=0; i< length; i++){ solvedPuzzle.push(0); }
  for(const row of solution){
    solvedPuzzle[(row/dim)|0] = (row % dim) + 1
  }
  return solvedPuzzle;
};

export { AlgXMatrix, AlgXNode, buildSudMatrix, buildMatrix, decodeSolution }