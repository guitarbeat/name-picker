var namMember = [
    "option 1",
    "option 2",
    "option 3",
    "option 4",
    "option 5"
];

var lstMember = [];
var parent = [];
var equal = [];
var rec = [];
var cmp1, cmp2;
var head1, head2;
var nrec;

var numQuestion;
var totalSize;
var finishSize;
var finishFlag;

function initList() {
    let n = 0;
    lstMember[n] = [...namMember.keys()];
    parent[n] = -1;
    totalSize = 0;
    n++;

    lstMember.forEach((list, i) => {
        if (list.length >= 2) {
            const mid = Math.ceil(list.length / 2);
            lstMember[n] = list.slice(0, mid);
            totalSize += lstMember[n].length;
            parent[n] = i;
            n++;

            lstMember[n] = list.slice(mid);
            totalSize += lstMember[n].length;
            parent[n] = i;
            n++;
        }
    });

    rec = Array(namMember.length).fill(0);
    nrec = 0;
    equal = Array(namMember.length + 1).fill(-1);

    cmp1 = lstMember.length - 2;
    cmp2 = lstMember.length - 1;
    head1 = 0;
    head2 = 0;
    numQuestion = 1;
    finishSize = 0;
    finishFlag = 0;
}

function sortList(flag) {
    const addRecord = (list, head) => {
        rec[nrec] = list[head];
        head++;
        nrec++;
        finishSize++;
        while (equal[rec[nrec - 1]] !== -1) {
            rec[nrec] = list[head];
            head++;
            nrec++;
            finishSize++;
        }
        return head;
    };

    if (flag < 0) {
        head1 = addRecord(lstMember[cmp1], head1);
    } else if (flag > 0) {
        head2 = addRecord(lstMember[cmp2], head2);
    } else {
        head1 = addRecord(lstMember[cmp1], head1);
        equal[rec[nrec - 1]] = lstMember[cmp2][head2];
        head2 = addRecord(lstMember[cmp2], head2);
    }

    if (head1 === lstMember[cmp1].length || head2 === lstMember[cmp2].length) {
        while (head1 < lstMember[cmp1].length) head1 = addRecord(lstMember[cmp1], head1);
        while (head2 < lstMember[cmp2].length) head2 = addRecord(lstMember[cmp2], head2);
    }

    if (head1 === lstMember[cmp1].length && head2 === lstMember[cmp2].length) {
        lstMember[parent[cmp1]] = rec.slice(0, lstMember[cmp1].length + lstMember[cmp2].length);
        lstMember.splice(-2, 2);
        cmp1 -= 2;
        cmp2 -= 2;
        head1 = 0;
        head2 = 0;
    }

    if (cmp1 < 0) {
        document.getElementById("battleNumber").innerHTML = `battle #${numQuestion - 1}<br>${Math.floor((finishSize * 100) / totalSize)}% sorted.`;
        showResult();
        finishFlag = 1;
    } else {
        showImage();
    }
}

function showResult() {
    let ranking = 1;
    let sameRank = 1;
    let str = "<table style=\"width:200px; font-size:18px; line-height:120%; margin:auto; border:1px solid #000; border-collapse:collapse\">";
    str += "<tr><td style=\"color:#fff; background:#e097d9; text-align:center;\">rank</td><td style=\"color:#fff; background:#e097d9; text-align:center;\">options</td></tr>";

    lstMember[0].forEach((index, i) => {
        str += `<tr><td style=\"border:1px solid #000; text-align:center;\">${ranking}</td><td style=\"border:1px solid #000; padding-left:5px;\">${namMember[index]}</td></tr>`;
        if (i < namMember.length - 1 && equal[index] !== lstMember[0][i + 1]) {
            ranking += sameRank;
            sameRank = 1;
        } else {
            sameRank++;
        }
    });

    str += "</table>";
    document.getElementById("resultField").innerHTML = str;
}

function showImage() {
    document.getElementById("battleNumber").innerHTML = `battle #${numQuestion}<br>${Math.floor((finishSize * 100) / totalSize)}% sorted.`;
    document.getElementById("leftField").innerHTML = toNameFace(lstMember[cmp1][head1]);
    document.getElementById("rightField").innerHTML = toNameFace(lstMember[cmp2][head2]);
    numQuestion++;
}

function toNameFace(n) {
    return namMember[n];
}

let userName = "";

function startQuiz() {
    const nameInput = document.getElementById("userName").value.trim();
    if (!nameInput) {
        alert("Please enter your name to start the quiz.");
        return;
    }
    userName = nameInput;
    document.querySelector(".user-input").style.display = "none";
    document.getElementById("quizSection").style.display = "block";

    // Initialize the quiz
    initList();
    showImage();
}

function showResult() {
    let ranking = 1;
    let sameRank = 1;
    let str = `<h2>Results for ${userName}</h2>`;
    str += "<table style=\"width:200px; font-size:18px; line-height:120%; margin:auto; border:1px solid #000; border-collapse:collapse\">";
    str += "<tr><td style=\"color:#fff; background:#e097d9; text-align:center;\">Rank</td><td style=\"color:#fff; background:#e097d9; text-align:center;\">Options</td></tr>";

    lstMember[0].forEach((index, i) => {
        str += `<tr><td style=\"border:1px solid #000; text-align:center;\">${ranking}</td><td style=\"border:1px solid #000; padding-left:5px;\">${namMember[index]}</td></tr>`;
        if (i < namMember.length - 1 && equal[index] !== lstMember[0][i + 1]) {
            ranking += sameRank;
            sameRank = 1;
        } else {
            sameRank++;
        }
    });

    str += "</table>";
    document.getElementById("resultField").innerHTML = str;

    // Optionally save the results
    saveResults(userName, rec);
}

function saveResults(name, results) {
    console.log("Saving results for:", name);
    console.log("Results:", results);
    // Implement backend or local storage saving here
}
