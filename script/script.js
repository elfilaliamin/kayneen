let snackbarTimeout; // Declare a variable to store the timeout reference

function showSnackbar(message, type = "default") {
  const snackbar = document.getElementById("snackbar");

  // Remove previous "show" class and clear timeout if needed
  if (snackbar.classList.contains("show")) {
    snackbar.classList.remove("show");
    clearTimeout(snackbarTimeout);
  }

  // Update the message
  snackbar.innerHTML = message;

  // Set the background color based on the type
  if (type === "red") {
    snackbar.style.backgroundColor = "var(--red-bg)";
  } else if (type === "green") {
    snackbar.style.backgroundColor = "var(--green-bg)";
  } else {
    snackbar.style.backgroundColor = "var(--default-bg)";
  }

  // Add the "show" class to display the snackbar and trigger the animation
  setTimeout(() => {
    snackbar.classList.add("show");
  }, 10); // A small delay (10ms) to allow the class removal to take effect

  // Hide it after 3 seconds
  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove("show");
  }, 3000);
}

/* Table Sort Feature */
function sortTable(colIndex) {
  const table = document.getElementById("studentTable");
  const rows = Array.from(table.rows).slice(1);
  let sorted = false;
  let dir = "asc";

  // Determine current sort direction
  if (table.getAttribute("data-sort-col") == colIndex) {
    dir = table.getAttribute("data-sort-dir") === "asc" ? "desc" : "asc";
  }

  rows.sort((a, b) => {
    let A = a.cells[colIndex].textContent.trim().toLowerCase();
    let B = b.cells[colIndex].textContent.trim().toLowerCase();

    if (!isNaN(A) && !isNaN(B)) {
      A = parseFloat(A);
      B = parseFloat(B);
    }

    if (A < B) return dir === "asc" ? -1 : 1;
    if (A > B) return dir === "asc" ? 1 : -1;
    return 0;
  });

  // Append sorted rows
  for (let row of rows) {
    table.tBodies[0].appendChild(row);
  }

  table.setAttribute("data-sort-col", colIndex);
  table.setAttribute("data-sort-dir", dir);
}

// Connect server.js to script.js
const API_BASE = 'http://localhost:3000/csv/';

async function create(csvFileName, dataObj) {
  const res = await fetch(API_BASE + csvFileName, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { ...dataObj, 'data-st': '' } }),
  });
  return res.json();
}

async function git(csvFileName) {
  const res = await fetch(API_BASE + csvFileName);
  return res.json();
}

async function edit(csvFileName, id, updatedDataObj) {
  const res = await fetch(`${API_BASE}${csvFileName}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: updatedDataObj }),
  });
  return res.json();
}

async function deleteRow(csvFileName, id) {
  const res = await fetch(`${API_BASE}${csvFileName}/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

//hundle images
async function upload_img(inputId, fileName) {
  const input = document.getElementById(inputId);
  const file = input.files[0];

  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('filename', fileName);

  try {
    const res = await fetch('http://localhost:3000/upload-image', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      showSnackbar(`Image uploaded: ${result.filename}`, 'green');
    } else {
      showSnackbar(`Upload failed: ${result.error}`, 'red');
    }
  } catch (err) {
    showSnackbar('An error occurred during upload', 'red');
    console.error(err);
  }
}

// SEND COMMANDS TO SERIALPORT 9600
function sendcommand(command) {
  fetch(`http://localhost:3000/send-command?command=${encodeURIComponent(command)}`)
      .then(response => response.text())
      .then(data => {
          console.log('Response from server:', data);
      })
      .catch(error => {
          console.error('Error:', error);
      });
}


// GET DATA FROM SERIALPORT 9600
const ws = new WebSocket('ws://localhost:8080');

let respond = ''; // Declare GetID outside of the function

ws.onmessage = function(event) {
  respond = event.data; // Assign the incoming message to GetID
  console.log(respond); // Log GetID inside the onmessage function

  // Change background color based on GetID
  if (respond.includes("Place finger to register as ID")) {
    showSnackbar(respond, type = "yellow")
  } else if (respond.includes("Fingerprint stored!")){
    showSnackbar(respond, type = "green")
  } else if (respond.includes("Fingerprints didn’t match")){
    showSnackbar(respond, type = "red")
  } else if (respond.includes("Remove finger...")){
    showSnackbar(respond)
  } else if (respond.includes("Place same finger again...")){
    showSnackbar(respond)
  } else if (respond.includes("Finger ID:")){
    const id = respond.replace(/\D/g, "");
    const currentUrl = window.location.href;
    if (currentUrl.includes("Auto-Present.html")){
      student_is_here(id);
    }
  }

};

async function incrementAbstime(idListStr) {
  const idsArray = idListStr.split(',').map(id => id.trim());
  const res = await fetch('http://localhost:3000/csv/stdlist/increment-abstime', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: idsArray }),
  });
  return res.json();
}