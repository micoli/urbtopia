const GAP = 0.4
const ROW_ASPECT = 1.6

export interface Cell {
  width: number
  depth: number
}

export interface Position {
  x: number
  z: number
}

// Packs cells in rows, largest first at the back (-Z) and smallest last at the front (+Z); each cell takes only the room it needs.
export function layoutOverview(cells: Cell[]): Position[] {
  const order = cells.map((_, index) => index).sort((a, b) => Math.max(cells[b]!.width, cells[b]!.depth) - Math.max(cells[a]!.width, cells[a]!.depth))
  const totalArea = cells.reduce((sum, { width, depth }) => sum + (width + GAP) * (depth + GAP), 0)
  const rowWidth = Math.max(Math.sqrt(totalArea) * ROW_ASPECT, ...cells.map(({ width }) => width + GAP))

  const rows: number[][] = []
  let used = 0
  for (const index of order) {
    const width = cells[index]!.width + GAP
    if (!rows.length || used + width > rowWidth) {
      rows.push([])
      used = 0
    }
    rows[rows.length - 1]!.push(index)
    used += width
  }

  const positions: Position[] = cells.map(() => ({ x: 0, z: 0 }))
  let rowStart = 0
  for (const row of rows) {
    const rowDepth = Math.max(...row.map((index) => cells[index]!.depth)) + GAP
    const width = row.reduce((sum, index) => sum + cells[index]!.width + GAP, 0)
    let cursor = -width / 2
    for (const index of row) {
      const cell = cells[index]!
      positions[index] = { x: cursor + (cell.width + GAP) / 2, z: rowStart + rowDepth - (cell.depth + GAP) / 2 }
      cursor += cell.width + GAP
    }
    rowStart += rowDepth
  }
  return positions
}
