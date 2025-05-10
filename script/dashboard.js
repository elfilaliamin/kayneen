let stdlist;
let mjrlist;
let abslist;
let options_list;

sendcommand(0);

function updateTable() {
    let list = stdlist;
    let content = "";

    for (let i = 0; i < list.length; i++) {
        let student = list[i];
        let formattedId = student.id.toString().padStart(8, '0');
        let permissionStatus = student.permission === "Not Allowed" ? "Bad" : "Good";

        content += `
        <tr>
            <td>${student.lastname} ${student.first_name}</td>
            <td>${formattedId}</td>
            <td>${student.major}</td>
            <td><span class="status ${permissionStatus === "Good" ? "active" : "inactive"}">${permissionStatus}</span></td>
            <td class="table-action"> 
                <button class="button action1">Allow Student</button>
                <button class="button action2">View Details</button>
            </td>  
        </tr>
        `;
    }

    document.getElementById("table-content").innerHTML = content;
}

function setTodayDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    document.getElementById("date").value = formattedDate;
    const dateInput = document.getElementById("date");
    const this_day = new Date().toISOString().split("T")[0];
    dateInput.max = this_day;
}

function update_major(list){
    let newlist = list.sort((a, b) => a.id - b.id);
    let options = ""; 
    for (let i = 0; i < newlist.length; i++){
        options += `
        <option value="${newlist[i].major}">${newlist[i].major}</option>
        `
    }

    options_list = options;
    document.getElementById("major-list1").innerHTML = "<option value='' selected hidden>Filières</option>" + options;
}

async function loadStudents() {
    stdlist = await git("stdlist.csv");
    mjrlist = await git("mjrlist.csv");
    abslist = await git("abslist.csv");
    console.log("Fetched stdlist rows:", stdlist);
    console.log("Fetched mjrlist rows:", mjrlist);
    console.log("Fetched abslist rows:", abslist);
    document.getElementById("loading").style.display = "none";
    update_major(mjrlist);
    updateTable();
    setTodayDate();
    calculateAttendance(abslist);
}

loadStudents()

document.getElementById("search-student").addEventListener("input", updateTable);

function updateTable() {
    let list = stdlist;
    let searchText = document.getElementById("search-student").value.toLowerCase().trim();
    let content = "";

    for (let i = 0; i < list.length; i++) {
        let student = list[i];
        let fullName = `${student.lastname} ${student.first_name}`.toLowerCase();

        if (fullName.includes(searchText)) {
            let formattedId = student.id.toString().padStart(8, '0');
            let permissionStatus = student.permission === "Not Allowed" ? "Bad" : "Good";

            content += `
            <tr>
                <td>${student.lastname} ${student.first_name}</td>
                <td>${formattedId}</td>
                <td>${student.major}</td>
                <td><span class="status ${permissionStatus === "Good" ? "active" : "inactive"}">${permissionStatus}</span></td>
                <td class="table-action"> 
                    <button class="button action1">Allow Student</button>
                    <button class="button action2">View Details</button>
                </td>  
            </tr>
            `;
        }
    }

    document.getElementById("table-content").innerHTML = content;
}

document.getElementById("major-list1").addEventListener("change", updateTable);

function updateTable() {
    let list = stdlist;
    let searchText = document.getElementById("search-student").value.toLowerCase().trim();
    let selectedMajor = document.getElementById("major-list1").value;
    let content = "";

    for (let i = 0; i < list.length; i++) {
        let student = list[i];
        let fullName = `${student.lastname} ${student.first_name}`.toLowerCase();

        let matchesName = fullName.includes(searchText);
        let matchesMajor = selectedMajor === "" || student.major === selectedMajor;

        if (matchesName && matchesMajor) {
            let formattedId = student.id.toString().padStart(8, '0');
            let permissionStatus = student.permission === "Not Allowed" ? "Bad" : "Good";

            content += `
            <tr>
                <td>${student.lastname} ${student.first_name}</td>
                <td>${formattedId}</td>
                <td>${student.major}</td>
                <td><span class="status ${permissionStatus === "Good" ? "active" : "inactive"}">${permissionStatus}</span></td>
                <td class="table-action"> 
                    <button class="button action1">Allow Student</button>
                    <button class="button action2" onclick="show(${student.id})">View Details</button>
                </td>  
            </tr>
            `;
        }
    }

    document.getElementById("table-content").innerHTML = content;
}

function filterBadStatusRows() {
    const tbody = document.getElementById("table-content");
    const rows = tbody.querySelectorAll("tr");

    rows.forEach(row => {
        const statusCell = row.querySelector("td span.status.inactive");
        if (!statusCell || statusCell.textContent.trim() !== "Bad") {
            row.remove();
        }
    });
}

// Function for the update cards
function calculateAttendance(dataList) {
    const selectedDate = document.getElementById("date").value;
    if (!selectedDate) {
        console.warn("No date selected.");
        return;
    }

    // --- Helper function ---
    function splitIds(str) {
        return str ? str.split("-").map(id => parseInt(id)) : [];
    }

    // 1. Filter entries for the selected date
    const dayEntries = dataList.filter(entry => {
        const [major, date, time] = entry.dtccode.split(":");
        return date === selectedDate;
    });

    const uniqueDayStudents = new Set();
    const dayAbsents = new Set();
    const dayPresents = new Set();

    dayEntries.forEach(entry => {
        splitIds(entry.absents).forEach(id => {
            uniqueDayStudents.add(id);
            dayAbsents.add(id);
        });
        splitIds(entry.presents).forEach(id => {
            uniqueDayStudents.add(id);
            dayPresents.add(id);
        });
    });

    // 2. Calculate start & end of the week (Monday to Sunday)
    const dateObj = new Date(selectedDate);
    const day = dateObj.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(dateObj);
    monday.setDate(dateObj.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Format date to YYYY-MM-DD for comparison
    function formatDate(d) {
        return d.toISOString().split("T")[0];
    }

    const weekStart = formatDate(monday);
    const weekEnd = formatDate(sunday);

    // 3. Filter entries for the week
    const weekEntries = dataList.filter(entry => {
        const date = entry.dtccode.split(":")[1];
        return date >= weekStart && date <= weekEnd;
    });

    const weekStudents = new Set();
    const weekPresents = new Set();

    weekEntries.forEach(entry => {
        splitIds(entry.absents).forEach(id => weekStudents.add(id));
        splitIds(entry.presents).forEach(id => {
            weekStudents.add(id);
            weekPresents.add(id);
        });
    });

    // 4. Output or return the results
    const result = {
        selectedDate,
        day: {
            totalStudents: uniqueDayStudents.size,
            absents: dayAbsents.size,
            presents: dayPresents.size,
        },
        week: {
            from: weekStart,
            to: weekEnd,
            totalStudents: weekStudents.size,
            totalPresents: weekPresents.size
        }
    };

    document.getElementById("abs-today-count").innerHTML = dayAbsents.size;
    document.getElementById("precentage-1").innerHTML = uniqueDayStudents.size > 0 ? `${((dayAbsents.size / uniqueDayStudents.size) * 100).toFixed(0)}%` : "0%";
    document.getElementById("progress-bar-fill-1").style.width = uniqueDayStudents.size > 0 ? `${(dayAbsents.size / uniqueDayStudents.size) * 100}%` : "0%";
    document.getElementById("present-today-count").innerHTML = dayPresents.size;
    document.getElementById("precentage-2").innerHTML = uniqueDayStudents.size > 0 ? `${((dayPresents.size / uniqueDayStudents.size) * 100).toFixed(0)}%` : "0%";
    document.getElementById("progress-bar-fill-2").style.width = uniqueDayStudents.size > 0 ? `${(dayPresents.size / uniqueDayStudents.size) * 100}%` : "0%";
    document.getElementById("present-week-count").innerHTML = weekPresents.size;
    document.getElementById("precentage-3").innerHTML = weekStudents.size > 0 ? `${((weekPresents.size / weekStudents.size) * 100).toFixed(0)}%` : "0%";
    document.getElementById("progress-bar-fill-3").style.width = weekStudents.size > 0 ? `${(weekPresents.size / weekStudents.size) * 100}%` : "0%";
    console.log(result);

}

document.getElementById("date").addEventListener("change", function () {
    calculateAttendance(abslist);
});

function cancel(){
    document.getElementById("overlay").style.display = "none";
    document.getElementById("details").style.display = "none";
}

function show(targetId) {
    const student = stdlist.find(obj => obj.id == targetId);
    if (!student) {
        console.warn(`Student with id ${targetId} not found.`);
        return;
    }

    let content = `
    <div class="details-info-container">
        <img src="../images/upload/${student.img}">
        <div class="details-info">
            <p>Last Name</p>
            <p>Fistname</p>
            <p>Absent Hours</p>
            <p>Authrised Hours</p>
        </div>
        <div class="details-info">
            <p>:</p>
            <p>:</p>
            <p>:</p>
            <p>:</p>
        </div>
        <div class="details-info">
            <p class="semi-bold">${student.lastname}</p>
            <p class="semi-bold">${student.first_name}</p>
            <p class="bold" style="color: var(--red);">${student.abstime !== "" ? student.abstime+"h" : "0h"}</p>
            <p class="bold" style="color: var(--green);">Not Defined</p>
        </div>
    </div>
    <button class="button main-btn" style="width: 100%; margin: auto;" onclick="cancel()">Cancel</button>
    `;

    document.getElementById("details").innerHTML = content;
    document.getElementById("overlay").style.display = "block";
    document.getElementById("details").style.display = "block";
}