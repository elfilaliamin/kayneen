let mjrlist;

function update(list){
    let content = "";
    for (let i = 0; i < list.length; i++) {
        let major = list[i].major;
        let code = major.match(/[A-Za-z]+/)[0];
        let group = major.match(/\d+/)[0];

        content += `
        <tr>
            <td>${list[i].full_major}</td>
            <td>${code}</td>
            <td>${group}</td>
            <td class="table-action"> 
                <button class="button action3" onclick="delete_major_popup('${list[i].id}','${list[i].major}')">Remove Major</button>
            </td>
        </tr>
        `;
    }

    document.getElementById("table-content").innerHTML = content;
}

async function loadmajors() {
    mjrlist = await git("mjrlist.csv");
    console.log("Fetched rows:", mjrlist);
    update(mjrlist);
    document.getElementById("loading").style.display = "none";
}

function cancel(){
    document.getElementById("overlay").style.display = 'none';
    document.getElementById("add-major").style.visibility = 'hidden';
    document.getElementById("delete_confermation").style.visibility = 'hidden';
}

function add_major_popup(){
    document.getElementById("overlay").style.display = 'block';
    document.getElementById("add-major").style.visibility = 'visible';
}

function add_major() {
    let full_major = document.getElementById("new-full-major").value;
    let code = document.getElementById("new-code").value;
    let group = document.getElementById("new-group").value;
    let major = code + group;

    let obj = {
        full_major: full_major,
        major: major
    }

    create("mjrlist.csv", obj).then(console.log);;
}

function delete_major_popup(id,major){
    content = `
        <p>Êtes-vous sûr de vouloir supprimer <br> la filière ${major} ?</p>
        <div class="popup-buttons">
            <button class="button green-btn" onclick="deleteRow('mjrlist.csv', '${id}')">Oui</button>
            <button class="button red-btn" onclick="cancel()">Non</button>
        </div>
    `

    document.getElementById("overlay").style.display = 'block';
    document.getElementById("delete_confermation").innerHTML = content;
    document.getElementById("delete_confermation").style.visibility = 'visible';
}

// Wait until the DOM is fully loaded before calling loadStudents
document.addEventListener("DOMContentLoaded", () => {
    loadmajors();
});
