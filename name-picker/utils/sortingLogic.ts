export interface Option {
  id: number;
  name: string;
}

export function initializeList(options: Option[]): number[][] {
  const n = options.length;
  const lstMember: number[][] = [options.map((_, i) => i)];
  
  // Shuffle the initial array to ensure random comparisons
  for (let i = lstMember[0].length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lstMember[0][i], lstMember[0][j]] = [lstMember[0][j], lstMember[0][i]];
  }
  
  for (let i = 0; i < lstMember.length; i++) {
    if (lstMember[i].length >= 2) {
      const mid = Math.ceil(lstMember[i].length / 2);
      lstMember.push(lstMember[i].slice(0, mid));
      lstMember.push(lstMember[i].slice(mid));
    }
  }
  
  return lstMember;
}

export function getNextComparison(
  lstMember: number[][],
  cmp1: number,
  cmp2: number,
  head1: number,
  head2: number,
  options: Option[]
): [number, number, number, number] | null {
  if (cmp1 < 0 || cmp2 >= lstMember.length) return null;
  
  while (cmp1 >= 0 && cmp2 < lstMember.length) {
    if (head1 < lstMember[cmp1].length && head2 < lstMember[cmp2].length) {
      const leftIndex = lstMember[cmp1][head1];
      const rightIndex = lstMember[cmp2][head2];
      
      if (options[leftIndex].id !== options[rightIndex].id) {
        return [cmp1, cmp2, head1, head2];
      }
    }
    
    head2++;
    if (head2 >= lstMember[cmp2].length) {
      head1++;
      head2 = 0;
    }
    
    if (head1 >= lstMember[cmp1].length) {
      cmp1--;
      cmp2--;
      head1 = 0;
      head2 = 0;
    }
  }
  
  return null;
}

export function sortList(
  lstMember: number[][],
  cmp1: number,
  cmp2: number,
  head1: number,
  head2: number,
  choice: number
): [number[][], number, number, number, number, number] {
  const rec: number[] = [];
  let nrec = 0;
  
  if (choice === 2) { // No Opinion - move both items to the end
    if (head1 < lstMember[cmp1].length) {
      rec[nrec] = lstMember[cmp1][head1];
      head1++;
      nrec++;
    }
    if (head2 < lstMember[cmp2].length) {
      rec[nrec] = lstMember[cmp2][head2];
      head2++;
      nrec++;
    }
  } else if (choice < 0) {
    rec[nrec] = lstMember[cmp1][head1];
    head1++;
    nrec++;
  } else if (choice > 0 && choice !== 2) {
    rec[nrec] = lstMember[cmp2][head2];
    head2++;
    nrec++;
  } else { // Equal preference (choice === 0)
    rec[nrec] = lstMember[cmp1][head1];
    head1++;
    nrec++;
    if (head2 < lstMember[cmp2].length) {
      rec[nrec] = lstMember[cmp2][head2];
      head2++;
      nrec++;
    }
  }
  
  while (head1 < lstMember[cmp1].length && head2 === lstMember[cmp2].length) {
    rec[nrec] = lstMember[cmp1][head1];
    head1++;
    nrec++;
  }
  
  while (head1 === lstMember[cmp1].length && head2 < lstMember[cmp2].length) {
    rec[nrec] = lstMember[cmp2][head2];
    head2++;
    nrec++;
  }
  
  if (head1 === lstMember[cmp1].length && head2 === lstMember[cmp2].length) {
    lstMember[cmp1] = rec;
    if (cmp2 < lstMember.length) {
      lstMember.splice(cmp2, 1);
    }
    cmp1 = cmp1 - 1;
    cmp2 = cmp2 - 1;
    head1 = 0;
    head2 = 0;
  }
  
  return [lstMember, cmp1, cmp2, head1, head2, nrec];
}
