/* General Variables */
let students_data = [];
let secteurs_data = [];

/* General Functions */
function filterByGroup(data, targetGroup) {
    return data.filter(item => item.major === targetGroup);
}

function filterBySeason(data, targetseason) {
    return data.filter(item => item.season === targetseason);
}

/* Time Functions */
let Time = {
    arrive: function(id) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        document.getElementById(`arrive${id}`).innerHTML = `${hours}:${minutes}`;
    }
}

/* SQL */
async function sendSqlCommand(sqlCommand) {
    try {
        const response = await fetch('http://localhost:3000/execute-sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sqlCommand }),
        });

        const data = await response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function requestdata(sqlCommand,type) {
    try {
        const response = await fetch('http://localhost:3000/execute-sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sqlCommand }),
        });

        const data = await response.json();
        if( type === 'students' ){ students_data = data.results; };
        if( type === 'secteurs' ){ secteurs_data = data.results; }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// server.js Get data
async function getData(sqlQuery) {
    try {
        const response = await fetch('http://localhost:3000/execute-sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sqlQuery }),
        });

        const data = await response.json();
        if (data.error) {
            console.error('Database error:', data.error);
            return;
        }

        //console.log('Fetched data:', data.results);
        return data.results;
    } catch (error) {
        console.error('Error:', error);
    }
}

/* Arduino SERIALPORT 9600 */
function arduinocommand(command) {
    fetch(`http://localhost:3000/send-command?command=${encodeURIComponent(command)}`)
        .then(response => response.text())
        .then(data => {
            console.log('Response from server:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

const ws = new WebSocket('ws://localhost:8080');

let GetID = ''; // Declare GetID outside of the function

ws.onmessage = function(event) {
    GetID = event.data; // Assign the incoming message to GetID
    console.log(GetID); // Log GetID inside the onmessage function

    // Change background color based on GetID
    if (GetID.includes("Fingerprint matched! ID: ")) {
        const startIndex = GetID.indexOf("ID: ") + 4;
        const id = GetID.substring(startIndex).trim();
        console.log(`The id is : ${id}`);
        Time.arrive(id);  // Use 'Time' instead of 'time'
    } else if (GetID === "Place your finger on the sensor..."){
        //confirmation.fingerprintmessage("Place your finger on the sensor...");
    } else if (GetID === "Remove finger."){
        //confirmation.fingerprintmessage("Remove finger.");
    } else if (GetID === "Place the same finger again."){
        //confirmation.fingerprintmessage("Place the same finger again.");
    } else if (GetID === "Fingerprint successfully registered."){
        //confirmation.fingerprintmessage("Fingerprint successfully registered.");
    } else if (GetID === "Enter command: Fingerprint deleted successfully."){
        //confirmation.fingerprintmessage("Enter command: Fingerprint deleted successfully.");
    } else if (GetID === "Error registering fingerprint."){
        //confirmation.fingerprintmessage("Error registering fingerprint.");
    }


};

/* Generate Options for Selections */
let option = {
    secteurs: function(){
        let majors = secteurs_data.map(major => major.major_group);
        majors = majors.sort();
        const options = majors.map(major => `<option value="${major}">${major}</option>`).join('\n');
    
        return options;
    },
    seasons: function() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear(); // Get the current year
        const currentMonth = currentDate.getMonth(); // Get the current month (0-11)
    
        const seasons = []; // Initialize an empty array
    
        // Determine the starting year based on the current month
        let startYear = (currentMonth >= 7) ? currentYear : currentYear - 1;
    
        // Loop to generate seasons
        for (let year = startYear; year >= 2021; year--) {
            // Create the season string and push it to the array
            seasons.push(`${year}/${year + 1}`);
        }
    
        // Generate HTML option elements
        const options = seasons.map(season => `<option value="${season}">${season}</option>`).join('\n');
    
        return options;
    }
}


/* Expend Sidebar Options */
let activeSubmenu = null;
let activeArrow = null;

function toggleSubmenu(submenuId, arrowId) {
    const submenu = document.getElementById(submenuId);
    const arrow = document.getElementById(arrowId);

    if (activeSubmenu && activeSubmenu !== submenu) {
        activeSubmenu.classList.add("hidden");
        activeArrow.classList.add("rotate-180");
    }

    const isCurrentlyHidden = submenu.classList.contains("hidden");
    submenu.classList.toggle("hidden", !isCurrentlyHidden);
    arrow.classList.toggle("rotate-180", !isCurrentlyHidden);

    if (isCurrentlyHidden) {
        activeSubmenu = submenu;
        activeArrow = arrow;
    } else {
        activeSubmenu = null;
        activeArrow = null;
    }
}

document.getElementById("Administration").addEventListener("click", function() {
    toggleSubmenu("Administration-options", "Administration-arrow");
});

document.getElementById("Dashboard").addEventListener("click", function() {
    toggleSubmenu("Dashboard-options", "Dashboard-arrow");
});

document.getElementById("Students").addEventListener("click", function() {
    toggleSubmenu("Students-options", "Students-arrow");
});

/* Sidebar Selection Function */
let sidebar = {
    application: function(){
        content = `
        <div class="flex justify-center items-center gap-4  py-4 mb-3">
            <label for="date">Date:</label>
            <input id="date" type="date" class="border border-gray-300 rounded-lg px-4 py-2">
            <label for="Seance">Seonce:</label>
            <select id="Seance" class="border border-gray-300 rounded-lg px-4 py-2">
                <option value="S0" hidden>Séance</option>
                <option value="S1">08:30 - 11:00</option>
                <option value="S2">11:00 - 13:30</option>
                <option value="S3">13:30 - 16:00</option>
                <option value="S4">16:00 - 18:30</option>
            </select>
            <label for="Sector">Filière:</label>
            <select id="Sector" class="border border-gray-300 rounded-lg px-4 py-2">
                <option value="F0" hidden>Filère</option>
                ${option.secteurs()}
            </select>
            <button onclick="application.search(students_data)" class="bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600">Chercher</button>
            <button onclick="application.checkpresent()" class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">Envoyer</button>
        </div>
        <div id="Application-results" class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5 px-5 w-full">
            
        </div>`;
        document.getElementById('content').innerHTML = content;
        document.getElementById("date").valueAsDate = new Date(); 
    },
    students1: function(){
        content = `<div class="flex flex-col space-y-8 h-screen items-center justify-center flex-1 py-6">
            <p class="text-primary-500 text-3xl font-bold">AJOUTER UN NOUVEL ÉTUDIANT</p>
            
            <div class="flex flex-row space-x-6">
                <div class="flex flex-col space-y-4">
                    <img id="img-input" src="" onerror="this.src='media/img-error.png'" class="h-[150px] w-[150px] object-cover border-4 border-primary-500 rounded-full p-1">
                    <label for="file-upload" class="text-center px-6 py-2 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-400" onclick="setupImagePreview();">Upload File</label>
                    <input type="file" id="file-upload" accept="image/*" hidden>
                </div>
        
                <div class="flex flex-col h-full justify-between w-96">
                    <input id="surname" class="border border-gray-300 px-4 py-2" type="text" placeholder="Saisir Le Prénom Du Stagiaire">
                    <input id="firstname" class="border border-gray-300 px-4 py-2" type="text" placeholder="Saisir Le Nom Du Stagiaire">
                    <select id="major" id="Sector" class="border border-gray-300 rounded-lg px-4 py-2">
                        <option value="F0" hidden>Filère</option>
                        ${option.secteurs()}
                    </select>
                    <select id="season" class="border border-gray-300 rounded-lg px-4 py-2">
                        ${option.seasons()}
                    </select>
                </div>
            </div>
    
            <button class="text-lg py-2 px-6 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-400" onclick="students.sendStudenttoDB()">Submet</button>
        </div>`
        document.getElementById('content').innerHTML = content;
    },
    students2: function(){
        content = `
        <p class="text-primary-500 text-3xl font-bold mt-8 mb-4">METTRE À JOUR LES INFORMATIONS DU STAGIAIRE</p>
        <div class="flex flex-row space-x-4 mb-6">
            <select id="Sector" class="border border-gray-300 rounded-lg px-4 py-2">
                <option value="F0" hidden>Filère</option>
                ${option.secteurs()}
            </select>
            <select id="Season" class="border border-gray-300 rounded-lg px-4 py-2">
                ${option.seasons()}
            </select>
            <button id="search" class="bg-primary-500 text-white hover:bg-primary-400 px-6 py-2 rounded-full" onclick="students.editSeach(students_data)">Rechercher</button>
        </div>
        <div id="student-edit-results" class="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-5 px-5 w-full">
            
        </div>`
        document.getElementById('content').innerHTML = content;
    },
    students3: function(){
        content = `
        <p class="text-primary-500 text-3xl font-bold mt-8 mb-4">STUDENTS FINGERPRINTS</p>
        <div class="flex flex-row space-x-4 mb-6">
            <select id="Sector" class="border border-gray-300 rounded-lg px-4 py-2">
                <option value="F0" hidden>Filère</option>
                ${option.secteurs()}
            </select>
            <select id="Season" class="border border-gray-300 rounded-lg px-4 py-2">
                ${option.seasons()}
            </select>
            <button id="search" class="bg-primary-500 text-white hover:bg-primary-400 px-6 py-2 rounded-full" onclick="students.fingerprintsearch(students_data)">Rechercher</button>
        </div>
        <div id="student-scan-results" class="w-full px-28 ">
            
        </div>`
        document.getElementById('content').innerHTML = content;
        arduinocommand(4);
    },
    administrationLists: function(mylist){
        content = `
        <p class="text-primary-500 text-3xl font-bold mt-8 mb-4">MODIFIER LES LISTES</p> 
        <div class="flex flex-row space-x-4 mb-6">
            <input id="major" type="text" class="border border-gray-300 rounded-lg px-4 py-2" placeholder="Abréviation">
            <input id="fullmajor" type="text" class="border border-gray-300 rounded-lg px-4 py-2" placeholder="Filière">
            <button id="search" class="bg-primary-500 text-white hover:bg-primary-400 px-6 py-2 rounded-full" onclick="Administration.addToList()">Ajouter</button>
        </div>
        <div id="student-scan-results" class="w-full px-28 ">
            <table class="min-w-full table-auto">
                <thead>
                    <tr class="bg-primary-500 text-white">
                    <th class="px-4 py-2 text-left">Abréviation</th>
                    <th class="px-4 py-2 text-left">Filière</th>
                    <th class="px-4 py-2 text-left">Supprimer</th>
                    </tr>
                </thead>
                <tbody id="table-content">

                </tbody>
            </table>
        </div>`
        document.getElementById('content').innerHTML = content;
        Administration.tablecontent(secteurs_data);
    },
    administrationReport: function(){
        content = `
        <div class="flex flex-col space-y-4 h-screen items-center justify-center flex-1 py-6">
            <p class="text-primary-500 text-3xl font-bold mt-8 mb-4">SIGNALER STAGIAIRES</p>
            <div class="flex flex-row space-x-3">
                <input id="name" type="text" placeholder="nom complet du stagiaire" class="border border-gray-300 px-4 py-2 w-72">
                <select id="secteur" class="border border-gray-300 px-4 py-2">
                    <option value="F0" hidden>Filière</option>
                    ${option.secteurs()}
                </select>
                <input id="date" type="date" class="border border-gray-300 px-4 py-2">
            </div>
            <textarea id="report" class="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" rows="8" placeholder="Décrire La Situation..." maxlength="1000"></textarea>
            <button class="text-lg py-2 px-6 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-400" onclick="Administration.sendreport()">Signaler Le Stagiaire</button>
        </div>`
        document.getElementById('content').innerHTML = content;
        document.getElementById("date").valueAsDate = new Date(); 
    },
    changepassword: function(){
        content = `
        <div class="flex flex-col space-y-8 h-screen items-center justify-center flex-1 py-6">
            <p class="text-primary-500 text-3xl font-bold">CHANGER LE MOT DE PASSE</p>
            <form class="flex flex-col justify-center items-center">
                <input id="current-password" class="border border-gray-300 px-4 py-3 w-96 mb-4 rounded-lg" type="password" placeholder="Entrez votre mot de passe actuel.">
                <input id="new-password" class="border border-gray-300 px-4 py-3 w-96 mb-4 rounded-lg" type="password" placeholder="Entrez un nouveau mot de passe.">
                <input id="confirm-password" class="border border-gray-300 px-4 py-3 w-96 mb-6 rounded-lg" type="password" placeholder="Répétez le nouveau mot de passe.">
                <button class="text-lg py-2 px-6 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-400">Changer le mot de passe</button>
            </form>
        </div>`
        document.getElementById('content').innerHTML = content;
    }
} 



/* Application Functions */
let application = {
    search: function(mylist){
        arduinocommand(3);
        let secteur = document.getElementById("Sector").value;
        if(secteur === "F0") { return};
        let Seance = document.getElementById("Seance").value;
        if(Seance === "S0") { return};
        let date = document.getElementById("date").value;
        if(date === "") { document.getElementById('Application-results').innerHTML = ""; return};

        mylist = filterByGroup(mylist,secteur);
        content = "";
        for(let i=0; i<mylist.length; i++){
            content = content + `
            <div id="${mylist[i].id}" class="max-w-[230px] flex flex-col items-center border-2 border-primary-600 rounded-xl py-5">
                <img src="${mylist[i].image}" onerror="this.src='media/img-error.png'" class="h-24 w-24 rounded-full p-1 border-2 border-primary-700">
                <p class="font-bold text-primary-600 mt-2 text-center">${mylist[i].surname} ${mylist[i].firstname}</p>
                <p class="font-bold text-gray-400">GEOESA201</p>
                <div class="flex  justify-around w-full py-3 font-bold">
                    <p>Arrive Time:</p>
                    <p id="arrive${mylist[i].id}">--:--</p>
                </div>
                <button id="state${mylist[i].id}" onclick="manuel.present(${mylist[i].id})" class="bg-primary-500 text-white py-2 px-6 hover:bg-primary-600 mt-2 font-bold rounded-full">Absent</button>
            </div>
            `
            }
        document.getElementById('Application-results').innerHTML = content
    },
    checkpresent: function(){
        let date = document.getElementById("date").value;
        let Seance = document.getElementById("Seance").value;
        let group = document.getElementById("Sector").value;

        if(date === "") { return};
        if(Seance === "S0") { return};
        if(group === "F0") { return};

        let primaryKey = `${date}:${Seance}:${group}`
        console.log(primaryKey);

        let parentElement = document.getElementById("Application-results");

        /* GENERATE IDS*/
        // Initialize arrays for each case (present, absent, late)
        let presentIds = [];
        let absentIds = [];
        let lateIds = [];
        
        // Find all child elements inside it
        let childElements = parentElement.querySelectorAll("div"); // Assuming each child is a div or similar container
        
        // Loop through each child element and check the button text
        childElements.forEach(function(element) {
            let button = element.querySelector("button"); // Assuming each child element has a button inside
            if (button) {
                // Check the text inside the button and classify the ID accordingly
                if (button.textContent.trim() === "Present") {
                    presentIds.push(element.id); // Add the ID of the element to the presentIds array
                } else if (button.textContent.trim() === "Absent") {
                    absentIds.push(element.id); // Add the ID of the element to the absentIds array
                } else if (button.textContent.trim() === "Retard") {
                    lateIds.push(element.id); // Add the ID of the element to the lateIds array
                }
            }
        });
        
        let presentText = presentIds.join(", ");
        let absentText = absentIds.join(", ");
        let lateText = lateIds.join(", ");
        
        console.log("Present IDs:", presentText);
        console.log("Absent IDs:", absentText);
        console.log("Late IDs:", lateText);   



        let command = `
        INSERT INTO presence (class_Seance_group, present, absent, late)
        VALUES ('${primaryKey}', '${presentText}', '${absentText}', '${lateText}')
        ON DUPLICATE KEY UPDATE
            present = VALUES(present),
            absent = VALUES(absent),
            late = VALUES(late);`

        sendSqlCommand(command);
    }
}



/* Students Function */
let students = {
    sendStudenttoDB: function(){
        general.lastselectedmajor();
        general.generateID()
        .then(ID => {
            const surname = document.getElementById('surname').value.toUpperCase();
            const firstname = document.getElementById('firstname').value.toUpperCase();
            const major = document.getElementById('major').value;
            const season = document.getElementById('season').value;
            const imageUrl = document.getElementById('img-input').src;
            const filename = "ID-"+ID+'.png'; // Replace with the desired name
            const imagepath = "uploads/"+filename

            const sqlcommand = `INSERT INTO students (id, surname, firstname, major, season, image) VALUES (${ID}, '${surname}', '${firstname}', '${major}', '${season}', '${imagepath}');`;        
        if (surname !== '' && firstname !== ''){
            uploadBlobImage(imageUrl, filename);
            sendSqlCommand(sqlcommand);
        }
        })
        .catch(error => {
            console.error("Error generating ID:", error); // Handle any potential errors
        });
    },
    editSeach: function(mylist){
        let secteur = document.getElementById("Sector").value;
        if(secteur === "F0") { return};
        let season = document.getElementById("Season").value;

        mylist = filterByGroup(mylist,secteur);
        mylist = filterBySeason(mylist,season);
        content = "";
        for(let i=0; i<mylist.length; i++){
            content = content + `
            <div id="result${mylist[i].id}" class="flex flex-col border border-gray-400 px-5 py-6 rounded-2xl">
                <div class="flex flex-row">
                    <div class="inline-block mr-3">
                        <img id="img-input${mylist[i].id}" src="${mylist[i].image}" onerror="this.src='media/img-error.png'" class="mb-4 h-[130px] w-[130px] object-cover border-4 border-primary-500 rounded-full p-1 mx-auto">
                        <label for="file-upload${mylist[i].id}" onclick="setupImagePreviewforeditsearch(${mylist[i].id});" class="text-center px-6 py-2 bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-400" onclick="setupImagePreview();">Choisir l'image</label>
                        <input type="file" id="file-upload${mylist[i].id}" accept="image/*" hidden="">                                          
                    </div>
                    <div class="flex flex-col gap-2 flex-grow">
                        <input id="surname${mylist[i].id}" type="text" class=" border border-gray-300 px-4 py-2 w-full" placeholder="Saisir Le Prénom Du Stagiaire" value="${mylist[i].surname}">
                        <input id="firstname${mylist[i].id}" type="text" class=" border border-gray-300 px-4 py-2 w-full" placeholder="Saisir Le Nom Du Stagiaire" value="${mylist[i].firstname}">
                        <select id="secteur${mylist[i].id}" class=" border border-gray-300 px-4 py-2 w-full" >
                            <option value="F0" hidden="">Filère</option>
                            ${option.secteurs()}
                        </select>
                        <select id="season${mylist[i].id}" class=" border border-gray-300 px-4 py-2 w-full" >
                            ${option.seasons()}
                        </select>
                    </div>
                </div>
                <div class="flex flex-row justify-center gap-4 mt-4">
                    <button onclick="students.deletefromdb(${mylist[i].id})" class="text-center px-6 py-2 bg-red-600 text-white font-semibold rounded-full hover:bg-red-500">DELETE STUDENT</button>
                    <button onclick="students.updatedbinfo(${mylist[i].id})" class="text-center px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-500">EDIT INFORMATION</button>
                </div>
            </div>
            `
            }
        document.getElementById('student-edit-results').innerHTML = content

        for(let i=0; i<mylist.length; i++){
            document.getElementById(`secteur${mylist[i].id}`).value = `${mylist[i].major}`;
            document.getElementById(`season${mylist[i].id}`).value = `${mylist[i].season}`;
        } 
    },
    updatedbinfo: async function(id){
        const surname = document.getElementById(`surname${id}`).value;
        const firstname = document.getElementById(`firstname${id}`).value;
        const secteur = document.getElementById(`secteur${id}`).value;
        const season = document.getElementById(`season${id}`).value;
        const imageUrl = document.getElementById(`img-input${id}`).src;
        const filename = `ID-${id}.png`;

        console.log(imageUrl);

        if (imageUrl.includes("blob")) {
            uploadBlobImage(imageUrl, filename);
        }

        if ( surname !== "" ){ 
            command = `UPDATE students SET surname = "${surname}" WHERE id = ${id};`
            sendSqlCommand(command);
         };

        if ( firstname !== "" ){ 
            command = `UPDATE students SET firstname = "${firstname}" WHERE id = ${id};`
            sendSqlCommand(command);
        };

        if ( secteur !== "" ){ 
            command = `UPDATE students SET major = "${secteur}" WHERE id = ${id};`
            sendSqlCommand(command);
        };

        if ( season !== "" ){ 
            command = `UPDATE students SET season = "${season}" WHERE id = ${id};`
            sendSqlCommand(command);
        };
    },
    deletefromdb: function(id){
        const command = `DELETE FROM students WHERE id=${id}`;
        sendSqlCommand(command);
        students_data = students_data.filter(student => student.id !== id);
        document.getElementById(`result${id}`).remove();
    },
    fingerprintsearch: function(mylist){
        let secteur = document.getElementById("Sector").value;
        if(secteur === "F0") { return};
        let season = document.getElementById("Season").value;

        mylist = filterByGroup(mylist,secteur);
        mylist = filterBySeason(mylist,season);
        content = "";
        for(let i=0; i<mylist.length; i++){
            content = content + `
            <tr class="border-b">
                <td class="px-4 py-2 font-bold">${mylist[i].id}</td>
                <td class="px-4 py-2 font-bold">${mylist[i].surname}</td>
                <td class="px-4 py-2 font-bold">${mylist[i].firstname}</td>
                <td class="px-4 py-2">
                    <button onclick="arduinocommand('1 ${mylist[i].id}')" class="text-white bg-green-600 hover:bg-green-500 px-6 py-2 rounded-full mr-3">Scanner</button>
                    <button onclick="arduinocommand('2 ${mylist[i].id}')" class="text-white bg-red-600 hover:bg-red-500 px-6 py-2 rounded-full">Delete</button>
                </td>
            </tr>
            `
        }
        content = `
        <table class="min-w-full table-auto">
            <thead>
                <tr class="bg-primary-500 text-white">
                <th class="px-4 py-2 text-left">#</th>
                <th class="px-4 py-2 text-left">Nom</th>
                <th class="px-4 py-2 text-left">Prénom</th>
                <th class="px-4 py-2 text-left">Empreinte</th>
                </tr>
            </thead>
            <tbody>
                ${content}
            </tbody>
        </table>
        `;
        document.getElementById("student-scan-results").innerHTML = content;
    }
} 

/* Administration Functions */ 
let Administration = {
    tablecontent: function(mylist){
        content = "";
        for(let i=0; i<mylist.length; i++){
            content = content+`
            <tr class="border-b">
                <td class="px-4 py-2 font-bold">${mylist[i].major_group}</td>
                <td class="px-4 py-2 font-bold">${mylist[i].major}</td>
                <td class="px-4 py-2 font-bold">
                    <button onclick="Administration.deleteFromList('${mylist[i].major_group}')" class="bg-red-600 text-white hover:bg-red-500 px-6 py-2 rounded-full">Supprimer</button>
                </td>
            </tr>`
        }
        document.getElementById("table-content").innerHTML = content;
    },
    deleteFromList: function(major){
        Command = `DELETE FROM mygroups WHERE major_group = "${major}"`
        secteurs_data = secteurs_data.filter(item => item.major_group !== major);
        sendSqlCommand(Command);
        Administration.tablecontent(secteurs_data);
    },
    addToList: function(){
        const major = document.getElementById("major").value;
        const fullmajor = document.getElementById("fullmajor").value;
        
        const existsInMajorGroup = secteurs_data.some(item => item.major_group === major);
        if (existsInMajorGroup) {
            return;
        }

        sqlCommand = `INSERT INTO mygroups (major_group, major) VALUES ('${major}', '${fullmajor}');`
        if(major !== "" && fullmajor !== ""){sendSqlCommand(sqlCommand);}

        newvalue = {major: `${fullmajor}`, major_group: `${major}`}
        secteurs_data.push(newvalue);
        Administration.tablecontent(secteurs_data);
    },
    sendreport: function(){
        let stagiaire = document.getElementById("name").value;
        let secteur = document.getElementById("secteur").value;
        let date = document.getElementById("date").value;
        let repport = document.getElementById("report").value;

        command1 = `
        CREATE TABLE IF NOT EXISTS stagiaire_table (
            id INT PRIMARY KEY AUTO_INCREMENT,
            stagiaire CHAR(255),
            major CHAR(255),
            date CHAR(255),
            report VARCHAR(1000)
        );`

        sendSqlCommand(command1);

        command2 = `
        INSERT INTO stagiaire_table (stagiaire, major, date, report)
        VALUES ('${stagiaire}', '${secteur}', '${date}', '${repport}');
        `
        sendSqlCommand(command2);

        document.getElementById("name").value = "";
        document.getElementById("report").value = "";
    }
}


/* Stating functions */
requestdata('SELECT * FROM students;','students');
requestdata('SELECT * FROM mygroups;','secteurs');


/* Manuel Mode */
let manuel = {
    present: function(id){
        Time.arrive(id);

        let buttonText = document.getElementById(`state${id}`).innerHTML;

        if (buttonText === "Absent"){
            document.getElementById(`state${id}`).innerHTML = "Present";
            document.getElementById(`state${id}`).style.borderColor = "#02A539"
            document.getElementById(`state${id}`).style.backgroundColor = "#02A539"
        }

        if (buttonText === "Present"){
            document.getElementById(`state${id}`).innerHTML = "Retard";
            document.getElementById(`state${id}`).style.borderColor = "#D14808"
            document.getElementById(`state${id}`).style.backgroundColor = "#D14808"
        }

        if (buttonText === "Retard"){
            document.getElementById(`state${id}`).innerHTML = "Absent";
            document.getElementById(`state${id}`).style.borderColor = "#4F46E5"
            document.getElementById(`state${id}`).style.backgroundColor = "#4F46E5"
        }


    }
}


/* Image Preview */
function setupImagePreview() {
    const fileInput = document.getElementById('file-upload');
    const imgInput = document.getElementById('img-input');

    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0]; // Get the uploaded file

            if (file) {
                // Create a Blob URL from the file
                const blobURL = URL.createObjectURL(file);

                // Set the src of the image to the Blob URL
                imgInput.src = blobURL;
            }
        });
    }
}

function setupImagePreviewforeditsearch(id) {
    const fileInput = document.getElementById(`file-upload${id}`);
    const imgInput = document.getElementById(`img-input${id}`);

    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0]; // Get the uploaded file

            if (file) {
                // Create a Blob URL from the file
                const blobURL = URL.createObjectURL(file);

                // Set the src of the image to the Blob URL
                imgInput.src = blobURL;
            }
        });
    }
}

// COPY THE IMAGES
async function uploadBlobImage(blobUrl, filename) {
    // Convert Blob URL to a File object
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });

    const formData = new FormData();
    formData.append('image', file); // Append the file to FormData

    try {
        const uploadResponse = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData, // Send FormData
        });

        const data = await uploadResponse.json();
        //console.log(data);
    } catch (error) {
        console.error('Error uploading image:', error);
    }
}


// GENERTAL FUNCTIONS
let general = {
    lastselectedmajor: function() {
        const lastMajor = document.getElementById("major").value;
        localStorage.setItem('lastMajorSelected', lastMajor);
    
        const lastSeason = document.getElementById("season").value;
        localStorage.setItem('lastSeasonSelected', lastSeason);
    },
    generateID: function() {
        const sqlCommand = 'SELECT id FROM students;';
        return getData(sqlCommand).then(function(data) {
            const idsArray = data.map(function(obj) {
                return obj.id; // Return the id property of each object
            });
    
            if (idsArray.length > 0) {
                idsArray.sort(function(a, b) {
                    return a - b;
                });
    
                let missingId = null;
    
                for (let i = 1; i <= idsArray[idsArray.length - 1]; i++) {
                    if (!idsArray.includes(i)) {
                        missingId = i; // Found a missing ID
                        break;
                    }
                }
    
                if (missingId === null) {
                    missingId = idsArray[idsArray.length - 1] + 1; // Next ID after the highest
                }
    
                return missingId; // Return the first missing ID
            } else {
                // No IDs found, start from 1
                return 1;
            }
        }).catch(function(error) {
            console.error('Error fetching data:', error);
            throw error; // Rethrow the error so you can handle it where the function is called
        });
    }
}