export interface Option {
  id: number;
  name: string;
}

export type SortChoice = -1 | 0 | 1 | 2; // -1: first, 1: second, 0: like both, 2: no opinion

/**
 * Calculate the total progress of the sorting process
 * @param totalItems Total number of items being sorted
 * @param finishedComparisons Number of comparisons completed
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  totalItems: number,
  finishedComparisons: number,
): number {
  if (totalItems <= 1) return 100;

  const totalComparisons = (totalItems * (totalItems - 1)) / 2;
  return Math.floor((finishedComparisons / totalComparisons) * 100);
}

/**
 * Initialize a list for sorting
 * @param n Number of items to sort
 * @returns Initial list structure
 */
export function initializeList(n: number): number[][] {
  const list: number[][] = [];
  for (let i = 0; i < n; i++) {
    list[i] = [i];
  }
  return list;
}

/**
 * Sort a list based on user choice
 * @param lstMember Current list state
 * @param cmp1 First comparison index
 * @param cmp2 Second comparison index
 * @param head1 First head index
 * @param head2 Second head index
 * @param choice User's choice (-1: first, 1: second, 0: like both, 2: no opinion)
 * @returns Updated list state and indices
 */
export function sortList(
  lstMember: number[][],
  cmp1: number,
  cmp2: number,
  head1: number,
  head2: number,
  choice: SortChoice,
): [number[][], number, number, number, number] {
  let winner: number;
  let loser: number;

  // Handle the choice
  if (choice === -1) {
    winner = cmp1;
    loser = cmp2;
  } else if (choice === 1) {
    winner = cmp2;
    loser = cmp1;
  } else {
    // For choices 0 (like both) and 2 (no opinion), treat them as equal
    // Move to next comparison without changing the order
    return moveToNextComparison(lstMember, cmp1, cmp2, head1, head2);
  }

  // Combine the arrays, winner's elements come first
  const newLstMember = [...lstMember];
  newLstMember[winner] = [
    ...lstMember[winner].slice(0, head1 + 1),
    ...lstMember[loser].slice(head2),
  ];
  newLstMember[loser] = lstMember[loser].slice(0, head2);

  return moveToNextComparison(newLstMember, cmp1, cmp2, head1, head2);
}

/**
 * Move to the next comparison in the sorting process
 * @param lstMember Current list state
 * @param cmp1 First comparison index
 * @param cmp2 Second comparison index
 * @param head1 First head index
 * @param head2 Second head index
 * @returns Updated list state and indices
 */
function moveToNextComparison(
  lstMember: number[][],
  cmp1: number,
  cmp2: number,
  head1: number,
  head2: number,
): [number[][], number, number, number, number] {
  let newCmp1 = cmp1;
  let newCmp2 = cmp2;
  let newHead1 = head1;
  let newHead2 = head2;

  while (newCmp1 < lstMember.length - 1) {
    // Move head2 forward
    if (newHead2 < lstMember[newCmp2].length - 1) {
      newHead2++;
      break;
    }

    // Move head1 forward and reset head2
    newHead2 = 0;
    if (newHead1 < lstMember[newCmp1].length - 1) {
      newHead1++;
      break;
    }

    // Move to next comparison pair
    newHead1 = 0;
    newCmp2++;
    if (newCmp2 === lstMember.length) {
      newCmp1++;
      newCmp2 = newCmp1 + 1;
    }
  }

  return [lstMember, newCmp1, newCmp2, newHead1, newHead2];
} 