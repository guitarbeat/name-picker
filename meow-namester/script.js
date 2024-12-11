// Global variables
var namMember = [];
var lstMember = [];
var parent = [];
var equal = [];
var rec = [];
var cmp1 = 0, cmp2 = 0;
var head1 = 0, head2 = 0;
var nrec = 0;
var numQuestion = 0;
var totalSize = 0;
var finishSize = 0;
var finishFlag = false;

// Load options from a text file
fetch('options.txt')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load options.txt');
        }
        return response.text();
    })
    .then(data => {
        namMember = data.split('\n').filter(option => option.trim() !== '');
        if (namMember.length > 1) {
            initList();
            showImage();
        } else {
            console.error('Insufficient options to perform sorting.');
        }
    })
    .catch(error => {
        console.error('Error loading options:', error);
        alert('There was an error loading the options. Please try again later.');
    });

function initList() {
    lstMember = [...namMember.keys()].map(() => []);
    parent = Array(lstMember.length).fill(-1);
    equal = Array(namMember.length + 1).fill(-1);
    totalSize = 0;
    nrec = 0;
    cmp1 = lstMember.length - 2;
    cmp2 = lstMember.length - 1;
    head1 = 0;
    head2 = 0;
    numQuestion = 1;
    finishSize = 0;
    finishFlag = false;

    lstMember.forEach((list, i) => {
        if (i < lstMember.length - 1) {
            list.push(i);
        }
    });
}

function showImage() {
    if (lstMember[cmp1] && lstMember[cmp2] && head1 < lstMember[cmp1].length && head2 < lstMember[cmp2].length) {
        document.getElementById("battleNumber").innerHTML = `battle #${numQuestion}<br>${Math.floor((finishSize * 100) / totalSize)}% sorted.`;
        document.getElementById("leftField").innerHTML = toNameFace(lstMember[cmp1][head1]);
        document.getElementById("rightField").innerHTML = toNameFace(lstMember[cmp2][head2]);
        numQuestion++;
    } else {
        console.error('Invalid indices for lstMember:', cmp1, head1, cmp2, head2);
    }
}

function toNameFace(n) {
    return namMember[n] || '';
}

function sortList(flag) {
    if (flag === -1) {
        head1 = addRecord(lstMember[cmp1], head1);
    } else if (flag === 1) {
        head2 = addRecord(lstMember[cmp2], head2);
    } else {
        head1 = addRecord(lstMember[cmp1], head1);
        equal[rec[nrec - 1]] = lstMember[cmp2][head2];
        head2 = addRecord(lstMember[cmp2], head2);
    }

    if (head1 === lstMember[cmp1].length || head2 === lstMember[cmp2].length) {
        while (head1 < lstMember[cmp1].length) head1 = addRecord(lstMember[cmp1], head1);
        while (head2 < lstMember[cmp2].length) head2 = addRecord(lstMember[cmp2], head2);

        lstMember[parent[cmp1]] = rec.slice(0, lstMember[cmp1].length + lstMember[cmp2].length);
        cmp1 -= 2;
        cmp2 -= 2;
        head1 = 0;
        head2 = 0;
    }

    if (cmp1 < 0) {
        finishFlag = true;
        showResult();
    } else {
        showImage();
    }
}

function addRecord(list, head) {
    rec[nrec++] = list[head++];
    return head;
}

function showResult() {
    const resultField = document.getElementById('resultField');
    if (resultField) {
        resultField.innerHTML = `<p>Sorting complete! Check your results.</p>`;
    }
}

function saveResults(name, results) {
    const resultsData = {
        name: name,
        results: results
    };
    console.log('Saving results:', resultsData);
    localStorage.setItem(`results_${name}`, JSON.stringify(resultsData));
    const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `results_${name}.json`;
    console.log('Triggering download for:', link.download);
    link.click();

    const resultField = document.getElementById('resultField');
    if (resultField) {
        resultField.innerHTML = `<p>Results saved as <strong>${link.download}</strong>. Check your downloads folder.</p>`;
    }
}

function startQuiz() {
    let userName = document.getElementById('userName').value;
    if (userName.trim() === '') {
        alert('Please enter your name to start the quiz.');
        return;
    }

    // Check if results for this user already exist
    const existingResults = localStorage.getItem(`results_${userName}`);
    if (existingResults) {
        if (!confirm('You have existing results. Would you like to update them?')) {
            return;
        }
    }

    document.getElementById('quizSection').style.display = 'block';
    document.querySelector('.user-input').style.display = 'none';
    // Initialize the quiz
    initList();
    showImage();
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('startQuiz').addEventListener('click', startQuiz);
    document.getElementById('leftField').addEventListener('click', () => {
        if (!finishFlag) sortList(-1);
    });
    document.getElementById('rightField').addEventListener('click', () => {
        if (!finishFlag) sortList(1);
    });
    document.querySelectorAll('.middleField').forEach(field => {
        field.addEventListener('click', () => {
            if (!finishFlag) sortList(0);
        });
    });
});
