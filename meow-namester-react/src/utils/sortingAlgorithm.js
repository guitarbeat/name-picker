/**
 * @module PreferenceSorter
 * @description A class that implements a merge sort algorithm with custom comparisons
 * for sorting cat names based on user preferences.
 */

export class PreferenceSorter {
    constructor(items) {
        this.items = items;
        this.preferences = new Map();
        this.currentRankings = [...items];
        this.ranks = [];
        this.rec = new Array(items.length).fill(0);
        this.preferenceCache = new Map();
        // Add comparison history
        this.comparisonHistory = [];
    }

    // When comparing items, we'll use the name property for the map key
    addPreference(item1, item2, value) {
        const key = `${item1.name}-${item2.name}`;
        this.preferences.set(key, value);
        // Track comparison in history
        this.comparisonHistory.push({ item1, item2, value, key });
    }

    // Add method to undo last comparison
    async undoLastComparison() {
        if (this.comparisonHistory.length === 0) return;

        const lastComparison = this.comparisonHistory.pop();
        this.preferences.delete(lastComparison.key);
        this.preferenceCache.clear(); // Clear cache since preferences changed
        
        // Reset rankings for recalculation
        this.currentRankings = [...this.items];
        this.ranks = [];
        
        // Recalculate rankings with updated preferences
        if (this.comparisonHistory.length > 0) {
            await this.recalculateRankings();
        }
    }

    // Add method to recalculate rankings
    async recalculateRankings() {
        this.ranks = [];
        this.currentRankings = [...this.items];
        await this.sort(async (item1, item2) => {
            const key = `${item1.name}-${item2.name}`;
            const reverseKey = `${item2.name}-${item1.name}`;
            
            if (this.preferences.has(key)) {
                return this.preferences.get(key);
            } else if (this.preferences.has(reverseKey)) {
                return -this.preferences.get(reverseKey);
            }
            return 0;
        });
    }

    getPreference(item1, item2) {
        const cacheKey = `${item1.name}-${item2.name}`;
        if (this.preferenceCache.has(cacheKey)) {
            return this.preferenceCache.get(cacheKey);
        }

        const key = `${item1.name}-${item2.name}`;
        const reverseKey = `${item2.name}-${item1.name}`;
        let result;
        
        if (this.preferences.has(key)) {
            result = this.preferences.get(key);
        } else if (this.preferences.has(reverseKey)) {
            result = -this.preferences.get(reverseKey);
        } else {
            result = 0;
        }

        this.preferenceCache.set(cacheKey, result);
        return result;
    }

    getCurrentRankings() {
        if (this.ranks.length > 0) {
            return this.ranks;
        }
        return this.currentRankings;
    }

    async sort(compareCallback) {
        console.log('Starting sort process with items:', this.items);
        const n = this.items.length;
        
        if (!this.rec || this.rec.length !== n) {
            this.rec = new Array(n).fill(0);
        }
        
        await this.sortRecursive(0, n - 1, compareCallback);
        console.log('Sort completed. Final ranks:', this.ranks);
        return this.ranks;
    }

    async sortRecursive(left, right, compareCallback) {
        if (right - left < 1) {
            if (left === right) {
                this.ranks.push(this.items[left]);
                console.log(`Added single item to ranks: ${this.items[left].name}`);
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
            console.log(`Comparing ${this.items[i].name} with ${this.items[j].name}`);
            const result = await compareCallback(this.items[i], this.items[j]);
            console.log(`Comparison result: ${result}`);

            if (result <= -0.5) {  // First name preferred
                console.log(`${this.items[i].name} preferred over ${this.items[j].name}`);
                merged.push(this.items[i++]);
            } else if (result >= 0.5) {  // Second name preferred
                console.log(`${this.items[j].name} preferred over ${this.items[i].name}`);
                merged.push(this.items[j++]);
            } else {
                // Handle near-ties with slight preference
                console.log(`Near tie between ${this.items[i].name} and ${this.items[j].name}`);
                if (result < 0) {
                    merged.push(this.items[i++]);
                    merged.push(this.items[j++]);
                } else {
                    merged.push(this.items[j++]);
                    merged.push(this.items[i++]);
                }
            }
        }

        // Add remaining elements
        while (i <= mid) {
            console.log(`Adding remaining left item: ${this.items[i].name}`);
            merged.push(this.items[i++]);
        }
        while (j <= right) {
            console.log(`Adding remaining right item: ${this.items[j].name}`);
            merged.push(this.items[j++]);
        }

        // Update original array
        for (let k = 0; k < merged.length; k++) {
            this.items[left + k] = merged[k];
            this.currentRankings[left + k] = merged[k];
        }

        // Only update ranks at the final merge
        if (left === 0 && right === this.items.length - 1) {
            this.ranks = [...merged];
        }

        console.log(`Merged result: ${merged.map(item => item.name).join(', ')}`);
    }
}
