# Exact Cover Visualizer

### An animated [Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X) search to visualize the solving an exact cover problem.

#### The [visualizer-app](https://nstagman.github.io/algx_visualizer/) can solve a user modified binary matrix as well as 4x4 and 9x9 sudoku puzzles.

##### The sudoku puzzles are automatically converted from their standard form into a binary constraint matrix to be solved by algorithm x. Each row of these matrices represents a single candidate in one square of the puzzle and each column represents a constraint for the puzzle (e.g., a '3' in the second row). This translates to the 4x4 sudoku having a 64x64 constraint matrix, and the 9x9 sudoku having a 729x324 matrix. The app limits the 9x9 constraint matrix to a reasonable size so it can still be animated on the canvas.

#### The algorithm visualization was achieved by animating the constraint matrix on an html canvas. [Solidjs](https://www.solidjs.com/) was leveraged to give the app its reactivity.