let stdlist;
let mjrlist;
let options_list;

sendcommand(0);

function update(list) {
    let content = "";
    for (let i = 0; i < list.length; i++) {
        content += `
        <div class="list1">
            <div class="list1-info">
                <img src="../images/upload/${list[i].img}" onerror="this.onerror=null; this.src='../images/img-error.png';">
                <p class="list1-name">${list[i].lastname} ${list[i].first_name}</p>
                <p class="list1-major">( ${list[i].major} )</p>
            </div>
            <div class="list1-action">
                <button class="button yellow-btn" onclick="sendcommand('1 ${list[i].id}')">Scanner</button>
                <button class="button blue-btn" onclick="edit_student_popup('${list[i].id}')">Modifier</button>
                <button class="button red-btn" onclick="delete_confermation('${list[i].id}')">Supprimer</button>
            </div>
        </div>
        `;
    }

    document.getElementById("student-result").innerHTML = content;
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
    document.getElementById("major-list1").innerHTML = "<option value='' selected>Filières</option>" + options;
    document.getElementById("major-list2").innerHTML = "<option selected hidden>Choisissez le filière</option>" + options;
}

async function loadStudents() {
    stdlist = await git("stdlist.csv");
    mjrlist = await git("mjrlist.csv");
    console.log("Fetched rows:", stdlist);
    console.log("Fetched rows:", mjrlist);
    update(stdlist);
    update_major(mjrlist);
    document.getElementById("loading").style.display = "none";
}

// Wait until the DOM is fully loaded before calling loadStudents
document.addEventListener("DOMContentLoaded", () => {
    loadStudents();
});

function edit_student_popup(targetId) {
    const students = stdlist;
    const student = students.find(item => item.id === targetId);
    const popup = document.getElementById("edit-popup");
  
    popup.innerHTML = `
        <input type="text" class="input" placeholder="Nom" id="edited-lastname" value="${student.lastname}">
        <input type="text" class="input" placeholder="Prénom" id="edited-firstname" value="${student.first_name}">
        <select class="select" id="edited-major">
        <option hidden>Choisissez le filière</option>
            ${options_list}
        </select>
        <input class="input" type="file" id="edited-img">
        <div class="popup-buttons">
        <button class="button blue-btn" onclick="edit_student_info('${student.id}')">Modifier</button>
        <button class="button red-btn" onclick="cancel()">Annuler</button>
        </div>
    `;
    
    document.getElementById("edited-major").value = student.major;
    popup.style.visibility = 'visible';
    document.getElementById("overlay").style.display = 'block';
  }
  

function cancel(){
    document.getElementById("overlay").style.display = 'none';
    document.getElementById("edit-popup").style.visibility = 'hidden';
    document.getElementById("delete_confermation").style.visibility = 'hidden';
    document.getElementById("add_student_popup").style.visibility = 'hidden';
}

function delete_confermation(targetId){
    let popup = document.getElementById("delete_confermation")
    popup.innerHTML = `
        <p>Êtes-vous sûr de vouloir supprimer <br> l'étudiant(e) de la base de données ?</p>
        <div class="popup-buttons">
            <button class="button green-btn" onclick="deleteRow('stdlist.csv', ${targetId}); cancel(); update(stdlist)">Oui</button>
            <button class="button red-btn" onclick="cancel()">Non</button>
        </div>
    `;

    popup.style.visibility = 'visible';
    document.getElementById("overlay").style.display = 'block';
}

function add_Student_popup(){
    document.getElementById("add_student_popup").style.visibility = 'visible';
    document.getElementById("overlay").style.display = 'block';
}

async function ajouter_etudient(){
    let new_firs_tname = document.getElementById("new_firstname").value;
    let new_lastname = document.getElementById("new_lastname").value;
    let new_major = document.getElementById("major-list2").value;
    let permission = "Allowed"

    let img_path = document.getElementById("image-updoaded").value;
    let imgname = Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
    let extension = img_path.slice(img_path.lastIndexOf('.'));
    let imgsaved = imgname.toString() + extension;

    let info = {
        first_name: new_firs_tname,
        lastname: new_lastname,
        major: new_major,
        img: imgsaved
    }

    upload_img("image-updoaded", imgname);
    create("stdlist.csv", info)
}

async function edit_student_info(tagetedid) {
    let new_firs_tname = document.getElementById("edited-firstname").value;
    let new_lastname = document.getElementById("edited-lastname").value;
    let new_major = document.getElementById("edited-major").value;
    let img_path = document.getElementById("edited-img").value;

    let info;

    if (img_path !== "") {
        let imgname = Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
        let extension = img_path.slice(img_path.lastIndexOf('.'));
        let imgsaved = imgname.toString() + extension;

        info = {
            first_name: new_firs_tname,
            lastname: new_lastname,
            major: new_major,
            img: imgsaved
        }
        
        upload_img("edited-img", imgname);

      } else {
        info = {
            first_name: new_firs_tname,
            lastname: new_lastname,
            major: new_major,
        }
      }
    
    edit("stdlist.csv", tagetedid, info);
}

async function search(list) {
    let search = document.getElementById("search-input").value.toLowerCase();
    let major_seach = document.getElementById("major-list1").value;
    let newlist = list;

    // Filter by name (if provided)
    if (search !== "") {
        newlist = newlist.filter(student =>
            student.first_name.toLowerCase().includes(search) ||
            student.lastname.toLowerCase().includes(search)
        );
    }

    // Filter by major (if provided)
    if (major_seach !== "") {
        newlist = newlist.filter(student =>
            student.major === major_seach
        );
    }

    update(newlist);
}
