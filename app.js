import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0BuLbFfS--LQayl2kh0-H-wsHFILGo",
  authDomain: "manus-pangeya.firebaseapp.com",
  projectId: "manus-pangeya",
  storageBucket: "manus-pangeya.firebasestorage.app",
  messagingSenderId: "641791393166",
  appId: "1:641791393166:web:d70213f436bd3bcd4538df",
  measurementId: "G-MBNWLNBF6X"
};const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let isTeacher = false;
let currentEssayId = null;

// DOM
const $list = document.getElementById("viewList");
const $editor = document.getElementById("viewEditor");
const $read = document.getElementById("viewRead");
const $essayList = document.getElementById("essayList");

// Auth
import { signInWithRedirect, getRedirectResult } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.getElementById("btnLogin").onclick = () => {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
};document.getElementById("btnLogout").onclick = () => signOut(auth);
document.getElementById("btnTeacher").onclick = unlockTeacher;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  document.getElementById("btnLogin").hidden = !!user;
  document.getElementById("btnLogout").hidden = !user;
  document.getElementById("btnTeacher").hidden = !user;
  if (user) {
    const snap = await getDoc(doc(db, "teachers", user.uid));
    isTeacher = snap.exists();
  }
  showList();
});

// Views
function showList() {
  $list.hidden = false; $editor.hidden = true; $read.hidden = true;
  loadEssays();
}
function showEditor(id = null) {
  $list.hidden = true; $editor.hidden = false; $read.hidden = true;
  currentEssayId = id;
  if (id) loadEssay(id); else clearEditor();
}
function showRead(id) {
  $list.hidden = true; $editor.hidden = true; $read.hidden = false;
  currentEssayId = id;
  loadReadView(id);
}

// Essays
async function loadEssays() {
  $essayList.innerHTML = "";
  if (!currentUser) return;
  const q = query(collection(db, "essays"), where("authorUid", "==", currentUser.uid));
  const snap = await getDocs(q);
  snap.forEach((d) => {
    const li = document.createElement("li");
    li.textContent = `${d.data().title} [${d.data().status}]`;
    li.onclick = () => showRead(d.id);
    $essayList.appendChild(li);
  });
}

async function loadEssay(id) {
  const snap = await getDoc(doc(db, "essays", id));
  if (snap.exists()) {
    document.getElementById("editorTitle").value = snap.data().title;
    document.getElementById("editorContent").value = snap.data().content;
  }
}

function clearEditor() {
  document.getElementById("editorTitle").value = "";
  document.getElementById("editorContent").value = "";
}

async function saveEssay(status) {
  const id = currentEssayId || crypto.randomUUID();
  await setDoc(doc(db, "essays", id), {
    title: document.getElementById("editorTitle").value,
    content: document.getElementById("editorContent").value,
    status,
    authorUid: currentUser.uid
  });
  showList();
}

document.getElementById("btnNew").onclick = () => showEditor();
document.getElementById("btnSave").onclick = () => saveEssay("draft");
document.getElementById("btnPublish").onclick = () => saveEssay("published");
document.getElementById("btnBack").onclick = showList;

// Read View
async function loadReadView(id) {
  const snap = await getDoc(doc(db, "essays", id));
  if (!snap.exists()) return;
  const data = snap.data();
  document.getElementById("readTitle").textContent = data.title;
  document.getElementById("readContent").textContent = data.content;
  document.getElementById("btnEdit").hidden = !currentUser || currentUser.uid !== data.authorUid;
  document.getElementById("feedbackSection").hidden = !isTeacher;
  loadFeedback(id);
}

document.getElementById("btnEdit").onclick = () => showEditor(currentEssayId);
document.getElementById("btnBackRead").onclick = showList;

// Feedback
async function loadFeedback(essayId) {
  const snap = await getDoc(doc(db, "essays", essayId, "feedback", "latest"));
  document.getElementById("feedbackDisplay").textContent = snap.exists() ? snap.data().content : "(No feedback yet)";
}

document.getElementById("btnFeedback").onclick = async () => {
  await setDoc(doc(db, "essays", currentEssayId, "feedback", "latest"), {
    content: document.getElementById("feedbackInput").value,
    teacherUid: currentUser.uid
  });
  loadFeedback(currentEssayId);
};

// Teacher Mode
async function unlockTeacher() {
  const code = prompt("Enter teacher code:");
  if (code !== "CTNLC") return alert("Invalid code");
  const snap = await getDoc(doc(db, "teachers", currentUser.uid));
  if (snap.exists()) { isTeacher = true; alert("Teacher mode unlocked"); }
  else alert("Not on whitelist");
}
getRedirectResult(auth)
  .then((result) => {
    if (result && result.user) {
      console.log("Logged in:", result.user.email);
    }
  })
  .catch((error) => {
    console.error("Login error:", error);
  });
