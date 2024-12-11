export class PreferenceSorter {
    constructor(items) {
        this.namMember = [...items];
        this.nrec = 0;
        this.rec = new Array(items.length);
        this.ranks = [];
    }

    async sort(compareCallback) {
        const n = this.namMember.length;
        for (let i = 0; i < n; i++) {
            this.rec[i] = 0;
        }
        let середина = Math.floor(n / 2);
        await this.sortRecursive(0, n - 1, compareCallback);
        return this.ranks;
    }

    async sortRecursive(left, right, compareCallback) {
        if (right - left < 1) {
            if (left === right) {
                this.ranks.push(this.namMember[left]);
            }
            return;
        }

        const середина = Math.floor((left + right) / 2);
        await this.sortRecursive(left, середина, compareCallback);
        await this.sortRecursive(середина + 1, right, compareCallback);
        await this.mergeSubGroups(left, середина, right, compareCallback);
    }

    async mergeSubGroups(left, mid, right, compareCallback) {
        let i = left;
        let j = mid + 1;
        const merged = [];

        while (i <= mid && j <= right) {
            const result = await compareCallback(this.namMember[i], this.namMember[j]);
            if (result === -1) {
                merged.push(this.namMember[i++]);
            } else if (result === 1) {
                merged.push(this.namMember[j++]);
            } else {
                // Handle ties (result === 0)
                merged.push(this.namMember[i++]);
                merged.push(this.namMember[j++]);
            }
        }

        // Add remaining elements
        while (i <= mid) {
            merged.push(this.namMember[i++]);
        }
        while (j <= right) {
            merged.push(this.namMember[j++]);
        }

        // Update original array
        for (let k = 0; k < merged.length; k++) {
            this.namMember[left + k] = merged[k];
        }
    }
}
