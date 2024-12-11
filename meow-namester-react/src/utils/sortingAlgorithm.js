/**
 * @module PreferenceSorter
 * @description A class that implements a merge sort algorithm with custom comparisons
 * for sorting cat names based on user preferences.
 */

export class PreferenceSorter {
    constructor(items) {
        this.namMember = [...items];
        this.nrec = 0;
        this.rec = new Array(items.length);
        this.ranks = [];
        console.log('PreferenceSorter initialized with items:', items);
    }

    async sort(compareCallback) {
        console.log('Starting sort process with items:', this.namMember);
        const n = this.namMember.length;
        for (let i = 0; i < n; i++) {
            this.rec[i] = 0;
        }
        let mid = Math.floor(n / 2);
        await this.sortRecursive(0, n - 1, compareCallback);
        console.log('Sort completed. Final ranks:', this.ranks);
        return this.ranks;
    }

    async sortRecursive(left, right, compareCallback) {
        if (right - left < 1) {
            if (left === right) {
                this.ranks.push(this.namMember[left]);
                console.log(`Added single item to ranks: ${this.namMember[left]}`);
            }
            return;
        }

        const mid = Math.floor((left + right) / 2);
        console.log(`Splitting array at indices ${left}-${mid} and ${mid + 1}-${right}`);
        await this.sortRecursive(left, mid, compareCallback);
        await this.sortRecursive(mid + 1, right, compareCallback);
        await this.mergeSubGroups(left, mid, right, compareCallback);
    }

    async mergeSubGroups(left, mid, right, compareCallback) {
        console.log(`Merging subarrays: ${left}-${mid} with ${mid + 1}-${right}`);
        let i = left;
        let j = mid + 1;
        const merged = [];

        while (i <= mid && j <= right) {
            console.log(`Comparing ${this.namMember[i]} with ${this.namMember[j]}`);
            const result = await compareCallback(this.namMember[i], this.namMember[j]);
            console.log(`Comparison result: ${result}`);

            if (result <= -0.5) {  // First name preferred
                console.log(`${this.namMember[i]} preferred over ${this.namMember[j]}`);
                merged.push(this.namMember[i++]);  // Add preferred name first
            } else if (result >= 0.5) {  // Second name preferred
                console.log(`${this.namMember[j]} preferred over ${this.namMember[i]}`);
                merged.push(this.namMember[j++]);  // Add preferred name first
            } else {
                // Handle near-ties with slight preference
                console.log(`Near tie between ${this.namMember[i]} and ${this.namMember[j]}`);
                if (result < 0) {
                    merged.push(this.namMember[i++]);
                    merged.push(this.namMember[j++]);
                } else {
                    merged.push(this.namMember[j++]);
                    merged.push(this.namMember[i++]);
                }
            }
        }

        // Add remaining elements
        while (i <= mid) {
            console.log(`Adding remaining left item: ${this.namMember[i]}`);
            merged.push(this.namMember[i++]);
        }
        while (j <= right) {
            console.log(`Adding remaining right item: ${this.namMember[j]}`);
            merged.push(this.namMember[j++]);
        }

        // Update original array
        for (let k = 0; k < merged.length; k++) {
            this.namMember[left + k] = merged[k];
        }

        // Only update ranks at the final merge
        if (left === 0 && right === this.namMember.length - 1) {
            this.ranks = [...merged];
        }

        console.log(`Merged result: ${merged.join(', ')}`);
    }
}
