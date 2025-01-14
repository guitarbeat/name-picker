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
    }

    addPreference(item1, item2, value) {
        const key = `${item1.name}-${item2.name}`;
        this.preferences.set(key, value);
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
        const n = this.items.length;
        
        if (!this.rec || this.rec.length !== n) {
            this.rec = new Array(n).fill(0);
        }
        
        await this.sortRecursive(0, n - 1, compareCallback);
        return this.ranks;
    }

    async sortRecursive(left, right, compareCallback) {
        if (right - left < 1) {
            if (left === right) {
                this.ranks.push(this.items[left]);
            }
            return;
        }

        const mid = Math.floor((left + right) / 2);
        await this.sortRecursive(left, mid, compareCallback);
        await this.sortRecursive(mid + 1, right, compareCallback);
        await this.mergeSubGroups(left, mid, right, compareCallback);
    }

    async mergeSubGroups(left, mid, right, compareCallback) {
        let i = left;
        let j = mid + 1;
        const merged = [];

        while (i <= mid && j <= right) {
            const result = await compareCallback(this.items[i], this.items[j]);

            if (result <= -0.5) {
                merged.push(this.items[i++]);
            } else if (result >= 0.5) {
                merged.push(this.items[j++]);
            } else {
                if (result < 0) {
                    merged.push(this.items[i++]);
                    merged.push(this.items[j++]);
                } else {
                    merged.push(this.items[j++]);
                    merged.push(this.items[i++]);
                }
            }
        }

        while (i <= mid) {
            merged.push(this.items[i++]);
        }
        while (j <= right) {
            merged.push(this.items[j++]);
        }

        for (let k = 0; k < merged.length; k++) {
            this.items[left + k] = merged[k];
            this.currentRankings[left + k] = merged[k];
        }

        if (left === 0 && right === this.items.length - 1) {
            this.ranks = [...merged];
        }
    }
} 