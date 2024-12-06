export interface Option {
  id: number;
  name: string;
}

export type SortChoice = -1 | 0 | 1 | 2;  // -1: first, 1: second, 0: like both, 2: no opinion

/**
 * Calculate the total progress of the sorting process
 * @param totalItems Total number of items being sorted
 * @param finishedComparisons Number of comparisons completed
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  totalItems: number,
  finishedComparisons: number
): number {
  if (totalItems <= 1) return 100;
  
  // Calculate total number of comparisons needed
  // For n items, we need approximately n*log2(n) comparisons
  // This accounts for potential ties and no opinions
  const totalComparisons = Math.ceil(totalItems * Math.log2(totalItems));
  
  // Calculate progress percentage, ensuring we don't exceed 100%
  const progress = Math.min(Math.round((finishedComparisons / totalComparisons) * 100), 100);
  
  // Return at least 1% if we've started but not yet made any comparisons
  return progress < 1 && finishedComparisons > 0 ? 1 : progress;
}

/**
 * Initialize the sorting list with shuffled indices
 * @param length Number of items to sort
 * @returns 2D array of indices representing the tournament brackets
 */
export function initializeList(length: number): number[][] {
  if (length <= 0) {
    throw new Error("Cannot initialize sorting with length <= 0");
  }

  if (length === 1) {
    return [[0]];
  }

  const indices = Array.from({ length }, (_, i) => i);
  
  // Shuffle the initial array
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Split into pairs for initial comparisons
  const lstMember: number[][] = [];
  for (let i = 0; i < indices.length; i += 2) {
    if (i + 1 < indices.length) {
      lstMember.push([indices[i], indices[i + 1]]);
    } else {
      lstMember.push([indices[i]]);
    }
  }
  
  return lstMember;
}

/**
 * Get the next pair of items to compare
 * @param lstMember Current state of the tournament
 * @param isDoubleElimination Whether to use double elimination rules
 * @param isRoundRobin Whether to use round robin rules
 * @returns Next comparison state or null if complete
 */
export function getNextComparison(
  lstMember: number[][],
  isDoubleElimination: boolean = false,
  isRoundRobin: boolean = false
): { cmp1: number; cmp2: number; head1: number; head2: number } | null {
  if (!lstMember || lstMember.length <= 1) {
    return null;
  }

  if (isRoundRobin) {
    // In round robin, everyone plays against everyone
    for (let i = 0; i < lstMember.length; i++) {
      for (let j = i + 1; j < lstMember.length; j++) {
        if (lstMember[i].length > 0 && lstMember[j].length > 0) {
          return { cmp1: i, cmp2: j, head1: 0, head2: 0 };
        }
      }
    }
  } else {
    // Single or double elimination
    for (let i = 0; i < lstMember.length - 1; i++) {
      const list1 = lstMember[i];
      const list2 = lstMember[i + 1];
      
      if (list1 && list2 && list1.length > 0 && list2.length > 0) {
        return { cmp1: i, cmp2: i + 1, head1: 0, head2: 0 };
      }
    }

    if (isDoubleElimination) {
      // Add losers bracket logic
      const losers = lstMember.filter(list => list.length === 1);
      if (losers.length > 1) {
        return { cmp1: lstMember.indexOf(losers[0]), cmp2: lstMember.indexOf(losers[1]), head1: 0, head2: 0 };
      }
    }
  }

  return null;
}

/**
 * Sort two items based on user choice
 * @param choice -1: first item preferred, 1: second item preferred,
 *               0: like both equally (keep both with higher rank),
 *               2: no opinion (keep both with lower rank)
 * @returns Tuple of [lstMember, cmp1, cmp2, head1, head2]
 */
export function sortList(
  lstMember: number[][],
  cmp1: number,
  cmp2: number,
  head1: number,
  head2: number,
  choice: SortChoice
): [number[][], number, number, number, number] {
  // Create a deep copy of lstMember to avoid mutating state
  const newLstMember = lstMember.map(sublist => [...sublist]);
  
  const list1 = newLstMember[cmp1];
  const list2 = newLstMember[cmp2];
  
  if (!list1 || !list2) {
    return [newLstMember, cmp1 - 1, cmp2 - 1, 0, 0];
  }

  const mergedList: number[] = [];
  
  // Handle the current pair being compared
  if (choice === 0) { // Like both equally
    // For equal preference, keep both items at the same rank
    // Add them in their original order to maintain consistency
    mergedList.push(list1[head1], list2[head2]);
  } else if (choice === 2) { // No opinion
    // For no opinion, maintain original order but mark them as lower priority
    // We'll add them to the end of the merged list
    const remaining = [...list1.slice(0, head1), ...list1.slice(head1 + 1)];
    const remaining2 = [...list2.slice(0, head2), ...list2.slice(head2 + 1)];
    mergedList.push(...remaining, list1[head1], ...remaining2, list2[head2]);
  } else if (choice < 0) { // First item preferred
    mergedList.push(list1[head1]);
    if (head2 < list2.length) mergedList.push(list2[head2]);
  } else { // Second item preferred
    mergedList.push(list2[head2]);
    if (head1 < list1.length) mergedList.push(list1[head1]);
  }

  // Add remaining items from both lists that weren't part of the comparison
  for (let i = 0; i < list1.length; i++) {
    if (i !== head1 && !mergedList.includes(list1[i])) {
      mergedList.push(list1[i]);
    }
  }
  for (let i = 0; i < list2.length; i++) {
    if (i !== head2 && !mergedList.includes(list2[i])) {
      mergedList.push(list2[i]);
    }
  }

  // Replace the two lists with the merged result
  newLstMember[cmp1] = mergedList;
  newLstMember.splice(cmp2, 1);

  // Check if we've completed a round
  if (newLstMember.length === 1) {
    // If we have only one list left with multiple items, start next round
    if (newLstMember[0].length > 1) {
      const nextRound = [];
      const currentList = newLstMember[0];
      
      // Create new pairs for next round, handling odd number of items
      for (let i = 0; i < currentList.length; i += 2) {
        if (i + 1 < currentList.length) {
          nextRound.push([currentList[i], currentList[i + 1]]);
        } else {
          // If we have an odd item out, it automatically advances
          nextRound.push([currentList[i]]);
        }
      }
      
      // Start with the last two groups in the next round
      const newCmp1 = Math.max(0, nextRound.length - 2);
      const newCmp2 = Math.min(nextRound.length - 1, newCmp1 + 1);
      return [nextRound, newCmp1, newCmp2, 0, 0];
    }
    // Sorting is complete
    return [newLstMember, -1, -1, 0, 0];
  }

  // Move to next comparison in current round
  if (head2 < list2.length - 1) {
    return [newLstMember, cmp1, cmp2, head1, head2 + 1];
  } else if (head1 < list1.length - 1) {
    return [newLstMember, cmp1, cmp2, head1 + 1, 0];
  }
  
  // Move to next pair of lists
  return [newLstMember, cmp1 - 1, cmp1, 0, 0];
}
