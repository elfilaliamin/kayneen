let stdlist;
let mjrlist;
let options_list;
let present_students = [];
let absent_students = [];

sendcommand(0);

function update_major(list){
    let newlist = list.sort((a, b) => a.id - b.id);
    let options = ""; 
    for (let i = 0; i < newlist.length; i++){
        options += `
        <option value="${newlist[i].major}">${newlist[i].major}</option>
        `
    }

    options_list = options;
    document.getElementById("major-start").innerHTML = "<option value='' selected hidden>Filières</option>" + options;
    document.getElementById("major").innerHTML = "<option value='' selected hidden>Filières</option>" +  options;
}

function start(list){
    let major = document.getElementById("major-start").value;

    if (major === ''){
        return
    }

    sendcommand(3);
    const filteredList = list.filter(item => item.major === major);

    let content = "";
    for (let i = 0; i < filteredList.length; i++) {
        content += `
        <div class="card" id="${filteredList[i].id}">
            <img src="../images/upload/${filteredList[i].img}" onerror="this.onerror=null; this.src='../images/img-error.png';">
            <div class="card-info">
                <div class="card-txt">
                    <p class="card-name">${filteredList[i].lastname} ${filteredList[i].first_name}</p>
                    <p class="card-major">Filière: ${filteredList[i].major}</p>
                    <p class="card-allow-green">${filteredList[i].permission === "" ? "Autorisé" : "Non autorisé"}</p>
                </div>
                <button class="button yellow-btn" onclick="manualmode(${filteredList[i].id})">En attente...</button>
            </div>
        </div>
        `;
    }

    document.getElementById("auto-present-headline").innerHTML = `La liste des stagiaires de ${major}`
    document.getElementById("Auto-Present-result").innerHTML = content;
    document.getElementById("auto-present-list").style.visibility = 'visible';
    document.getElementById("auto-present-start").style.visibility = 'hidden';
    document.getElementById("auto-present-send").style.visibility = "visible";
    document.getElementById("major").value = major;
}

async function loadStudents() {
    stdlist = await git("stdlist.csv");
    mjrlist = await git("mjrlist.csv");
    console.log("Fetched rows:", stdlist);
    console.log("Fetched rows:", mjrlist);
    document.getElementById("loading").style.display = "none";
    update_major(mjrlist);
}

loadStudents()

function setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const dd = String(today.getDate()).padStart(2, '0');

    const formattedDate = `${yyyy}-${mm}-${dd}`; // format: yyyy-mm-dd

    document.getElementById("date").value = formattedDate;
}

function setClassTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes; // total minutes since midnight

    let value = "C0"; // Default value

    if (totalMinutes >= (8 * 60 + 30) && totalMinutes < (11 * 60)) {
        value = "C1";
    } else if (totalMinutes >= (11 * 60) && totalMinutes < (13 * 60 + 30)) {
        value = "C2";
    } else if (totalMinutes >= (13 * 60 + 30) && totalMinutes < (16 * 60)) {
        value = "C3";
    } else if (totalMinutes >= (16 * 60) && totalMinutes < (18 * 60 + 30)) {
        value = "C4";
    }

    const select = document.getElementById("class-time");
    if (select) {
        select.value = value;
    }
}

function cancel(){
    document.getElementById("overlay").style.display = "none";
    document.getElementById("senddata-popup").style.visibility = "hidden";
}

function student_is_here(id){
    let card = document.getElementById(id);
    element = card.getElementsByClassName("button")
    element[0].classList.remove("yellow-btn");
    element[0].classList.add("green-btn");
    element[0].innerHTML = "Present";
}

function sendtodb_popup() {
    present_students = [];
    absent_students = [];

    const cards = document.querySelectorAll("#Auto-Present-result .card");
    const cardsArray = Array.from(cards);

    cardsArray.forEach(card => {
        const button = card.querySelector("button"); // Get the button inside the card
        if (button) {
            if (button.innerText.trim() === "Present") {
                present_students.push(card.id);
            } else {
                absent_students.push(card.id);
            }
        }
    });

    document.getElementById("overlay").style.display = "block";
    document.getElementById("senddata-popup").style.visibility = "visible";

    // ✅ Correct IDs and show only the number
    document.getElementById("present-stds").innerHTML = present_students.length > 0 ? present_students.length : "0";
    document.getElementById("absent-stds").innerHTML = absent_students.length > 0 ? absent_students.length : "0";

    console.log("Present Students IDs:", present_students);
    console.log("Absent Students IDs:", absent_students);

    setTodayDate();
    setClassTime();
}

async function sendtodb() {
    let major = document.getElementById("major").value;
    let date = document.getElementById("date").value;
    let classtime = document.getElementById("class-time").value;

    let dtc_code = `${major}:${date}:${classtime}`;

    let obj = {
        dtccode: dtc_code,
        absents: absent_students.join('-'),  // 👈 convert list to CSV string
        presents: present_students.join('-') // 👈 same here
    };

    create("abslist.csv", obj);

    let abslist_send = absent_students.join(',');
    incrementAbstime(abslist_send);
}

function add_abs_time(id) {
    // Find the student by id
    const student = stdlist.find(item => item.id === id.toString());

    if (!student) {
        console.error(`Student with id ${id} not found.`);
        return;
    }

    // Get abstime, treat empty string as 0
    let absTime = student.abstime === "" ? 0 : Number(student.abstime);

    if (isNaN(absTime)) {
        console.error(`Invalid abstime for student with id ${id}`);
        return null;
    }

    // Add 2.5
    absTime += 2.5;

    // Create the update object
    let obj = {
        abstime: absTime
    };

    // Update the CSV
    edit("stdlist.csv", id, obj);
    
}

function manualmode(id){
    let card = document.getElementById(id);
    let element = card.getElementsByClassName("button")
    element[0].classList.remove("yellow-btn");
    element[0].classList.add("green-btn");
    element[0].innerHTML = "Present";
}
