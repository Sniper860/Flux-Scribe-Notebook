// Firebase SDK Modules (using version 9 modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    Timestamp // Import Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// --- IMPORTANT: Firebase Configuration ---
// Replace this with your project's Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAY3ODjMfF62CiiWYV90ndSv7EaEzm1U2g",
  authDomain: "snippetsaver-1136b.firebaseapp.com",
  projectId: "snippetsaver-1136b",
  storageBucket: "snippetsaver-1136b.firebasestorage.app",
  messagingSenderId: "616307570898",
  appId: "1:616307570898:web:63679fcd1472efaf1b550b",
  measurementId: "G-4VJ6G94VGZ"
};

// --- Initialize Firebase ---
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("CRITICAL: Firebase initialization failed!", error);
    // Display a user-friendly message on the page if Firebase fails to load
    const body = document.querySelector('body');
    if (body) {
        body.innerHTML = `<div style="padding: 20px; text-align: center; font-family: sans-serif; color: #333;">
                            <h1>Application Error</h1>
                            <p>Could not initialize essential services. Please check your Firebase configuration and ensure you have an internet connection.</p>
                            <p>Details: ${error.message}</p>
                          </div>`;
    }
    // Stop further script execution if Firebase is critical and fails
    throw error; 
}


// --- DOM Elements ---
const introOverlay = document.getElementById('introOverlay');
const introLogo = document.getElementById('introLogo');
const introTitleEl = document.getElementById('introTitle');

// Auth Screen Elements
const authScreen = document.getElementById('authScreen');
const authTitle = document.getElementById('authTitle');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupConfirmPasswordInput = document.getElementById('signupConfirmPassword');
const authToggleText = document.getElementById('authToggleText');
const authErrorMessage = document.getElementById('authErrorMessage');

// Main App Wrapper
const appWrapper = document.getElementById('appWrapper'); 
const topBar = document.getElementById('topBar');
const appContainer = document.getElementById('appContainer');
const currentNotebookNameTopBar = document.getElementById('currentNotebookNameTopBar');
const currentUserDisplay = document.getElementById('currentUserDisplay');
const logoutButton = document.getElementById('logoutButton');

// Left Sidebar
const leftSidebar = document.getElementById('leftSidebar');
const addNotebookBtn = document.getElementById('addNotebookBtn');
const notebooksListEl = document.getElementById('notebooksList');
const activeNotebookDetails = document.getElementById('activeNotebookDetails');
const addSourceBtnSidebar = document.getElementById('addSourceBtnSidebar');
const sourcesListSidebar = document.getElementById('sourcesListSidebar');
const addNoteBtnSidebar = document.getElementById('addNoteBtnSidebar');
const notesListSidebar = document.getElementById('notesListSidebar');
const searchNotesInput = document.getElementById('searchNotesInput');

// Main Content Area
const mainContentArea = document.getElementById('mainContentArea');
const welcomeScreen = document.getElementById('welcomeScreen');
const notebookOverviewScreen = document.getElementById('notebookOverviewScreen');
const notebookOverviewTitle = document.getElementById('notebookOverviewTitle');
const notebookOverviewStats = document.getElementById('notebookOverviewStats');
const createNewNoteFromOverviewBtn = document.getElementById('createNewNoteFromOverviewBtn');
const noteEditorScreen = document.getElementById('noteEditorScreen');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const noteTimestampEl = document.getElementById('noteTimestamp');

// Right AI Helper Panel
const aiHelperPanel = document.getElementById('aiHelperPanel');
const aiMessageDisplay = document.getElementById('aiMessageDisplay');
const aiChatInput = document.getElementById('aiChatInput');
const aiSendBtn = document.getElementById('aiSendBtn');
const aiSuggestedQuestions = document.getElementById('aiSuggestedQuestions');

// Modals
const notebookModal = document.getElementById('notebookModal');
const notebookModalTitle = document.getElementById('notebookModalTitle');
const notebookNameInput = document.getElementById('notebookNameInput');
const confirmNotebookModalBtn = document.getElementById('confirmNotebookModalBtn');
const cancelNotebookModalBtn = document.getElementById('cancelNotebookModalBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsButton = document.getElementById('settingsButton');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const clearAllDataBtn = document.getElementById('clearAllDataBtn');
const addSourceModal = document.getElementById('addSourceModal');
const sourceNameInput = document.getElementById('sourceNameInput');
const sourceUrlInput = document.getElementById('sourceUrlInput');
const sourceContentInput = document.getElementById('sourceContentInput');
const confirmAddSourceBtn = document.getElementById('confirmAddSourceBtn');
const cancelAddSourceBtn = document.getElementById('cancelAddSourceBtn');
const customContextMenu = document.getElementById('customContextMenu');

// --- App State ---
let currentUserId = null; 
let localNotebooks = []; 
let localNotes = [];     
let localSources = [];   
let currentNotebookId = null;
let currentNoteId = null;
let autoSaveTimeout = null;
let currentNotebookEditId = null; 

// --- Intro Animation ---
function playIntroAnimation() {
    console.log("playIntroAnimation called");
    if (introLogo) introLogo.classList.add('animate-logo');
    if (introTitleEl) introTitleEl.classList.add('animate-title');
    
    setTimeout(() => {
        if (introOverlay) {
            introOverlay.classList.add('fade-out');
            console.log("Intro overlay fade-out initiated");
        }
    }, 2000); 

    if (introOverlay) {
        introOverlay.addEventListener('transitionend', () => {
            if (introOverlay.classList.contains('fade-out')) {
                introOverlay.style.display = 'none';
                console.log("Intro overlay hidden via transitionend");
            }
        }, { once: true }); 
    }
}

// --- Utility Functions ---
function generateId() { 
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36); 
}
function formatDateFromTimestamp(fbTimestamp) {
    if (!fbTimestamp) return '';
    const date = fbTimestamp.toDate ? fbTimestamp.toDate() : new Date(fbTimestamp); 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}


// --- Firebase Authentication Logic ---
onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged triggered. User:", user ? user.uid : "null");
    if (user) {
        currentUserId = user.uid;
        if (currentUserDisplay) currentUserDisplay.textContent = user.email || 'Logged In';
        if (authScreen) authScreen.classList.add('hidden');
        if (appWrapper) {
            appWrapper.classList.remove('hidden');
            appWrapper.classList.add('visible');
        }
        
        await loadUserAppData(); 
        renderNotebooksList(); 

    } else {
        currentUserId = null;
        if (currentUserDisplay) currentUserDisplay.textContent = '';
        if (appWrapper) {
            appWrapper.classList.add('hidden');
            appWrapper.classList.remove('visible');
        }
        if (authScreen) authScreen.classList.remove('hidden');
        resetLocalDataAndUI();
    }
});

async function handleSignup(email, password) {
    if(authErrorMessage) authErrorMessage.textContent = '';
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Signup Error:", error);
        if(authErrorMessage) authErrorMessage.textContent = error.message;
    }
}

async function handleLogin(email, password) {
    if(authErrorMessage) authErrorMessage.textContent = '';
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login Error:", error);
        if(authErrorMessage) authErrorMessage.textContent = error.message;
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
        alert("Error logging out: " + error.message);
    }
}

function toggleAuthForms(showSignup = false) {
    if (showSignup) {
        if(loginForm) loginForm.classList.add('hidden');
        if(signupForm) signupForm.classList.remove('hidden');
        if(authTitle) authTitle.textContent = 'Create Account';
        if(authToggleText) authToggleText.innerHTML = `Already have an account? <button id="toggleToLoginBtn" class="font-medium text-sky-600 hover:text-sky-700">Login</button>`;
        
        const newToggleToLoginBtn = document.getElementById('toggleToLoginBtn');
        if (newToggleToLoginBtn) newToggleToLoginBtn.addEventListener('click', () => toggleAuthForms(false));

    } else {
        if(signupForm) signupForm.classList.add('hidden');
        if(loginForm) loginForm.classList.remove('hidden');
        if(authTitle) authTitle.textContent = 'Login to Flux Scribe';
        if(authToggleText) authToggleText.innerHTML = `Don't have an account? <button id="toggleToSignupBtn" class="font-medium text-sky-600 hover:text-sky-700">Sign Up</button>`;
        
        const newToggleToSignupBtn = document.getElementById('toggleToSignupBtn');
        if (newToggleToSignupBtn) newToggleToSignupBtn.addEventListener('click', () => toggleAuthForms(true));
    }
    if(authErrorMessage) authErrorMessage.textContent = '';
}


// --- Firestore Data Operations ---
async function loadUserAppData() {
    if (!currentUserId) return;
    console.log("Loading app data for user:", currentUserId);

    try {
        const notebooksQuery = query(collection(db, `users/${currentUserId}/notebooks`), orderBy("name"));
        const notebookSnapshot = await getDocs(notebooksQuery);
        localNotebooks = notebookSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sourcesQuery = query(collection(db, `users/${currentUserId}/sources`), orderBy("createdAt", "desc"));
        const sourcesSnapshot = await getDocs(sourcesQuery);
        localSources = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const notesQuery = query(collection(db, `users/${currentUserId}/notes`), orderBy("updatedAt", "desc"));
        const notesSnapshot = await getDocs(notesQuery);
        localNotes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const lastNotebookId = localStorage.getItem(`fluxScribeCurrentNotebookId_${currentUserId}`);
        const lastNoteId = localStorage.getItem(`fluxScribeCurrentNoteId_${currentUserId}`);

        if (lastNotebookId && localNotebooks.some(nb => nb.id === lastNotebookId)) {
            currentNotebookId = lastNotebookId;
            if (lastNoteId && localNotes.some(n => n.id === lastNoteId && n.notebookId === currentNotebookId)) {
                currentNoteId = lastNoteId;
            } else {
                currentNoteId = null;
            }
        } else if (localNotebooks.length > 0) {
            currentNotebookId = localNotebooks[0].id;
            currentNoteId = null;
        } else {
            currentNotebookId = null;
            currentNoteId = null;
        }
        console.log("Data loaded. Notebooks:", localNotebooks.length, "Notes:", localNotes.length, "Sources:", localSources.length);

    } catch (error) {
        console.error("Error loading user data:", error);
        alert("Could not load your data. Please try again. " + error.message);
        localNotebooks = []; localNotes = []; localSources = [];
    }
}

function resetLocalDataAndUI() {
    localNotebooks = []; localNotes = []; localSources = [];
    currentNotebookId = null; currentNoteId = null;
    renderNotebooksList(); 
}

function saveCurrentSelectionToLocalStorage() {
    if (currentUserId) {
        if (currentNotebookId) {
            localStorage.setItem(`fluxScribeCurrentNotebookId_${currentUserId}`, currentNotebookId);
        } else {
            localStorage.removeItem(`fluxScribeCurrentNotebookId_${currentUserId}`);
        }
        if (currentNoteId) {
            localStorage.setItem(`fluxScribeCurrentNoteId_${currentUserId}`, currentNoteId);
        } else {
            localStorage.removeItem(`fluxScribeCurrentNoteId_${currentUserId}`);
        }
    }
}

// --- UI State Management & Rendering ---
function updateMainContentArea() {
    if(welcomeScreen) welcomeScreen.classList.add('hidden');
    if(notebookOverviewScreen) notebookOverviewScreen.classList.add('hidden');
    if (mainContentArea && mainContentArea.contains(noteEditorScreen) && noteEditorScreen) {
        noteEditorScreen.classList.add('hidden');
        noteEditorScreen.classList.remove('flex');
    }

    if (!currentNotebookId) {
        if(welcomeScreen) welcomeScreen.classList.remove('hidden');
        if(currentNotebookNameTopBar) currentNotebookNameTopBar.textContent = "No Notebook Selected";
    } else {
        const currentNotebook = localNotebooks.find(nb => nb.id === currentNotebookId);
        if(currentNotebookNameTopBar) currentNotebookNameTopBar.textContent = currentNotebook ? currentNotebook.name : "Notebook";

        if (currentNoteId) {
            const note = localNotes.find(n => n.id === currentNoteId && n.notebookId === currentNotebookId);
            if (note && noteEditorScreen && mainContentArea) {
                if(noteTitleInput) noteTitleInput.value = note.title;
                if(noteContentInput) noteContentInput.value = note.content;
                if(noteTimestampEl) noteTimestampEl.textContent = `Last saved: ${formatDateFromTimestamp(note.updatedAt)}`;
                mainContentArea.appendChild(noteEditorScreen);
                noteEditorScreen.classList.remove('hidden');
                noteEditorScreen.classList.add('flex');
                if(noteTitleInput) noteTitleInput.focus();
            } else {
                currentNoteId = null; 
                if(notebookOverviewScreen) notebookOverviewScreen.classList.remove('hidden');
                if(notebookOverviewTitle) notebookOverviewTitle.textContent = currentNotebook ? currentNotebook.name : "Notebook Overview";
                const notebookSourcesCount = localSources.filter(s => s.notebookId === currentNotebookId).length;
                const notebookNotesCount = localNotes.filter(n => n.notebookId === currentNotebookId).length;
                if(notebookOverviewStats) notebookOverviewStats.textContent = `${notebookSourcesCount} sources, ${notebookNotesCount} notes.`;
            }
        } else {
            if(notebookOverviewScreen) notebookOverviewScreen.classList.remove('hidden');
            if(notebookOverviewTitle) notebookOverviewTitle.textContent = currentNotebook ? currentNotebook.name : "Notebook Overview";
            const notebookSourcesCount = localSources.filter(s => s.notebookId === currentNotebookId).length;
            const notebookNotesCount = localNotes.filter(n => n.notebookId === currentNotebookId).length;
            if(notebookOverviewStats) notebookOverviewStats.textContent = `${notebookSourcesCount} sources, ${notebookNotesCount} notes.`;
        }
    }
}

function renderNotebooksList() {
    if(!notebooksListEl) return;
    notebooksListEl.innerHTML = '';
    if (localNotebooks.length === 0) {
        notebooksListEl.innerHTML = '<p class="text-xs text-slate-500 px-1 py-1">No notebooks yet.</p>';
        if(activeNotebookDetails) activeNotebookDetails.classList.add('hidden');
        updateMainContentArea(); 
        return;
    }
    localNotebooks.forEach(notebook => {
        const isActive = notebook.id === currentNotebookId;
        const item = document.createElement('div');
        item.className = `notebook-item group flex justify-between items-center p-2 rounded-md hover:bg-sky-100/70 cursor-pointer transition-colors duration-150 text-sm`;
        item.dataset.notebookId = notebook.id;
        item.setAttribute('data-active', isActive.toString());
        item.innerHTML = `<span class="notebook-name-display truncate flex items-center"><i class="ph ph-notebook mr-2 text-base ${isActive ? 'text-white' : 'text-sky-600'}"></i>${notebook.name}</span>`;
        item.addEventListener('click', () => selectNotebook(notebook.id));
        item.addEventListener('contextmenu', (e) => showContextMenu(e, 'notebook', notebook.id));
        notebooksListEl.appendChild(item);
    });

    if (currentNotebookId && activeNotebookDetails) {
        activeNotebookDetails.classList.remove('hidden');
        activeNotebookDetails.classList.add('flex');
        renderSourcesListSidebar();
        renderNotesListSidebar();
    } else if (activeNotebookDetails) {
        activeNotebookDetails.classList.add('hidden');
    }
    updateMainContentArea();
}

function renderSourcesListSidebar() {
    if(!sourcesListSidebar) return;
    sourcesListSidebar.innerHTML = '';
    if (!currentNotebookId) return;

    const currentNotebookSources = localSources.filter(s => s.notebookId === currentNotebookId);
    currentNotebookSources.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));

    if (currentNotebookSources.length === 0) {
        sourcesListSidebar.innerHTML = '<p class="text-xs text-slate-500 px-1 py-1">No sources here.</p>';
        return;
    }
    currentNotebookSources.forEach(source => {
        const item = document.createElement('div');
        item.className = 'source-item-sidebar flex justify-between items-center group';
        item.dataset.sourceId = source.id;
        item.innerHTML = `
            <div class="flex items-center truncate">
                <i class="ph ${source.url ? 'ph-link' : 'ph-file-text'} text-sm"></i>
                <span class="truncate text-xs ml-1.5">${source.name}</span>
                ${source.url ? `<a href="${source.url}" target="_blank" class="source-url-link ml-1.5" title="${source.url}"><i class="ph ph-arrow-square-out"></i></a>` : ''}
            </div>
            <button class="delete-source-btn-sidebar p-0.5" data-source-id="${source.id}" title="Delete Source"><i class="ph ph-x text-xs"></i></button>
        `;
        const deleteBtn = item.querySelector('.delete-source-btn-sidebar');
        if (deleteBtn) deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); deleteSourceFromFirestore(source.id);
        });
        sourcesListSidebar.appendChild(item);
    });
}

function renderNotesListSidebar(searchTerm = '') {
    if(!notesListSidebar) return;
    notesListSidebar.innerHTML = '';
    if (!currentNotebookId) return;

    const lowerSearchTerm = searchTerm.toLowerCase();
    let notesInCurrentNotebook = localNotes.filter(note => 
        note.notebookId === currentNotebookId &&
        (searchTerm === '' || note.title.toLowerCase().includes(lowerSearchTerm) || note.content.toLowerCase().includes(lowerSearchTerm))
    );
    notesInCurrentNotebook.sort((a, b) => (b.updatedAt?.toDate?.() || 0) - (a.updatedAt?.toDate?.() || 0));

    if (notesInCurrentNotebook.length === 0) {
        notesListSidebar.innerHTML = `<p class="text-xs text-slate-500 px-1 py-1">${searchTerm ? 'No notes match.' : 'No notes here yet.'}</p>`;
        return;
    }
    notesInCurrentNotebook.forEach(note => {
        const isActive = note.id === currentNoteId;
        const item = document.createElement('div');
        item.className = `note-item-sidebar group`;
        item.dataset.noteId = note.id;
        item.setAttribute('data-active', isActive.toString());
        const snippet = note.content.substring(0, 30).replace(/<[^>]+>/g, '') + (note.content.length > 30 ? '...' : '');
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="truncate">
                    <h4 class="font-medium text-xs truncate ${isActive ? 'text-sky-700' : 'text-slate-700'}">${note.title || 'Untitled Note'}</h4>
                    <p class="text-[11px] ${isActive ? 'text-sky-600' : 'text-slate-500'} truncate">${snippet || 'Empty note'}</p>
                </div>
            </div>
        `;
        item.addEventListener('click', () => selectNote(note.id));
        item.addEventListener('contextmenu', (e) => showContextMenu(e, 'note', note.id));
        notesListSidebar.appendChild(item);
    });
}

// --- Notebook CRUD with Firebase ---
async function addNotebookToFirestore(name) {
    if (!currentUserId || !name.trim()) {
        alert("Notebook name cannot be empty or user not logged in."); return null;
    }
    try {
        const newNotebookRef = await addDoc(collection(db, `users/${currentUserId}/notebooks`), {
            name: name.trim(), createdAt: Timestamp.now(), owner: currentUserId 
        });
        const newNotebook = { id: newNotebookRef.id, name: name.trim(), createdAt: Timestamp.now(), owner: currentUserId };
        localNotebooks.push(newNotebook); 
        localNotebooks.sort((a,b) => a.name.localeCompare(b.name)); 
        currentNotebookId = newNotebook.id; 
        currentNoteId = null;
        saveCurrentSelectionToLocalStorage();
        renderNotebooksList();
        return newNotebook;
    } catch (error) {
        console.error("Error adding notebook to Firestore:", error);
        alert("Could not create notebook: " + error.message); return null;
    }
}

async function renameNotebookInFirestore(notebookId, newName) {
    if (!currentUserId || !notebookId || !newName.trim()) return;
    try {
        const notebookRef = doc(db, `users/${currentUserId}/notebooks`, notebookId);
        await updateDoc(notebookRef, { name: newName.trim() });
        const notebookIndex = localNotebooks.findIndex(nb => nb.id === notebookId);
        if (notebookIndex > -1) {
            localNotebooks[notebookIndex].name = newName.trim();
            localNotebooks.sort((a,b) => a.name.localeCompare(b.name));
        }
        renderNotebooksList();
    } catch (error) {
        console.error("Error renaming notebook:", error);
        alert("Could not rename notebook: " + error.message);
    }
}

async function deleteNotebookFromFirestore(notebookId) {
    if (!currentUserId || !notebookId) return;
    const notebook = localNotebooks.find(nb => nb.id === notebookId);
    if (!notebook) return;
    if (!confirm(`Are you sure you want to delete notebook "${notebook.name}" and ALL its sources and notes? This is permanent.`)) return;

    try {
        await deleteDoc(doc(db, `users/${currentUserId}/notebooks`, notebookId));
        const sourcesQuery = query(collection(db, `users/${currentUserId}/sources`), where("notebookId", "==", notebookId));
        const sourcesSnapshot = await getDocs(sourcesQuery);
        sourcesSnapshot.forEach(async (sourceDoc) => {
            await deleteDoc(doc(db, `users/${currentUserId}/sources`, sourceDoc.id));
        });
        const notesQuery = query(collection(db, `users/${currentUserId}/notes`), where("notebookId", "==", notebookId));
        const notesSnapshot = await getDocs(notesQuery);
        notesSnapshot.forEach(async (noteDoc) => {
            await deleteDoc(doc(db, `users/${currentUserId}/notes`, noteDoc.id));
        });

        localNotebooks = localNotebooks.filter(nb => nb.id !== notebookId);
        localSources = localSources.filter(s => s.notebookId !== notebookId);
        localNotes = localNotes.filter(n => n.notebookId !== notebookId);

        if (currentNotebookId === notebookId) {
            currentNotebookId = localNotebooks.length > 0 ? localNotebooks[0].id : null;
            currentNoteId = null;
            saveCurrentSelectionToLocalStorage();
        }
        renderNotebooksList();
    } catch (error) {
        console.error("Error deleting notebook:", error);
        alert("Could not delete notebook: " + error.message);
    }
}

function openNotebookModalForCreate() {
    currentNotebookEditId = null;
    if(notebookModalTitle) notebookModalTitle.textContent = 'Create New Notebook';
    if(confirmNotebookModalBtn) confirmNotebookModalBtn.textContent = 'Create';
    if(notebookNameInput) notebookNameInput.value = '';
    if(notebookModal) {
        notebookModal.classList.remove('hidden'); notebookModal.classList.add('flex');
    }
    if(notebookNameInput) notebookNameInput.focus();
}
function openNotebookModalForRename(notebookId) {
    const notebook = localNotebooks.find(nb => nb.id === notebookId);
    if (!notebook) return;
    currentNotebookEditId = notebookId;
    if(notebookModalTitle) notebookModalTitle.textContent = 'Rename Notebook';
    if(confirmNotebookModalBtn) confirmNotebookModalBtn.textContent = 'Rename';
    if(notebookNameInput) notebookNameInput.value = notebook.name;
    if(notebookModal) {
        notebookModal.classList.remove('hidden'); notebookModal.classList.add('flex');
    }
    if(notebookNameInput) {
        notebookNameInput.focus(); notebookNameInput.select();
    }
}
async function handleConfirmNotebookModal() {
    const name = notebookNameInput ? notebookNameInput.value.trim() : "";
    if (!name) { alert("Notebook name cannot be empty."); return; }
    if (currentNotebookEditId) { 
        await renameNotebookInFirestore(currentNotebookEditId, name);
    } else { 
        await addNotebookToFirestore(name);
    }
    closeNotebookModal();
    currentNotebookEditId = null;
}
function closeNotebookModal() {
    if(notebookModal) {
        notebookModal.classList.add('hidden'); notebookModal.classList.remove('flex');
    }
    currentNotebookEditId = null;
}
function selectNotebook(notebookId) {
    currentNotebookId = notebookId;
    currentNoteId = null; 
    if(searchNotesInput) searchNotesInput.value = '';
    saveCurrentSelectionToLocalStorage();
    renderNotebooksList(); 
}

// --- Source CRUD with Firebase (for sidebar) ---
async function addSourceToFirestore(name, url, contentText) {
    if (!currentUserId || !currentNotebookId || !name.trim()) {
        alert("Source name cannot be empty or notebook/user not selected."); return null;
    }
    try {
        const newSourceRef = await addDoc(collection(db, `users/${currentUserId}/sources`), {
            notebookId: currentNotebookId, name: name.trim(), url: url.trim() || null,
            content: contentText.trim() || null, createdAt: Timestamp.now(), owner: currentUserId
        });
        const newSource = { id: newSourceRef.id, notebookId: currentNotebookId, name: name.trim(), url: url.trim() || null, content: contentText.trim() || null, createdAt: Timestamp.now(), owner: currentUserId };
        localSources.push(newSource);
        renderSourcesListSidebar();
        updateMainContentArea(); 
        return newSource;
    } catch (error) {
        console.error("Error adding source to Firestore:", error);
        alert("Could not add source: " + error.message); return null;
    }
}

async function deleteSourceFromFirestore(sourceId) {
    if (!currentUserId || !sourceId) return;
    try {
        await deleteDoc(doc(db, `users/${currentUserId}/sources`, sourceId));
        localSources = localSources.filter(s => s.id !== sourceId);
        renderSourcesListSidebar();
        updateMainContentArea(); 
    } catch (error) {
        console.error("Error deleting source:", error);
        alert("Could not delete source: " + error.message);
    }
}

function openAddSourceModal() {
    if (!currentNotebookId) {
        alert("Please select or create a notebook first to add a source."); return;
    }
    if(sourceNameInput) sourceNameInput.value = ''; 
    if(sourceUrlInput) sourceUrlInput.value = ''; 
    if(sourceContentInput) sourceContentInput.value = '';
    if(addSourceModal) {
        addSourceModal.classList.remove('hidden'); addSourceModal.classList.add('flex');
    }
    if(sourceNameInput) sourceNameInput.focus();
}
function closeAddSourceModal() {
    if(addSourceModal) {
        addSourceModal.classList.add('hidden'); addSourceModal.classList.remove('flex');
    }
}
async function handleConfirmAddSource() {
    const name = sourceNameInput ? sourceNameInput.value.trim() : "";
    const url = sourceUrlInput ? sourceUrlInput.value.trim() : "";
    const contentText = sourceContentInput ? sourceContentInput.value.trim() : "";
    if (!name) { alert("Source name cannot be empty."); return; }
    await addSourceToFirestore(name, url, contentText);
    closeAddSourceModal();
}

// --- Note CRUD with Firebase ---
async function addNoteToFirestoreCurrentNotebook() {
    if (!currentUserId || !currentNotebookId) {
        alert("Please select a notebook first."); return null;
    }
    try {
        const newNoteRef = await addDoc(collection(db, `users/${currentUserId}/notes`), {
            notebookId: currentNotebookId, title: "Untitled Note", content: "",
            createdAt: Timestamp.now(), updatedAt: Timestamp.now(), owner: currentUserId
        });
        const newNote = { id: newNoteRef.id, notebookId: currentNotebookId, title: "Untitled Note", content: "", createdAt: Timestamp.now(), updatedAt: Timestamp.now(), owner: currentUserId };
        localNotes.push(newNote);
        currentNoteId = newNote.id; 
        saveCurrentSelectionToLocalStorage();
        renderNotesListSidebar(searchNotesInput ? searchNotesInput.value : "");
        updateMainContentArea();
        return newNote;
    } catch (error) {
        console.error("Error adding note to Firestore:", error);
        alert("Could not create note: " + error.message); return null;
    }
}

async function updateNoteInFirestore(noteId, newTitle, newContent) {
    if (!currentUserId || !noteId) return false;
    try {
        const noteRef = doc(db, `users/${currentUserId}/notes`, noteId);
        await updateDoc(noteRef, {
            title: newTitle, content: newContent, updatedAt: Timestamp.now()
        });
        const noteIndex = localNotes.findIndex(n => n.id === noteId);
        if (noteIndex > -1) {
            localNotes[noteIndex].title = newTitle;
            localNotes[noteIndex].content = newContent;
            localNotes[noteIndex].updatedAt = Timestamp.now(); 
        }
        return true; 
    } catch (error) {
        console.error("Error updating note:", error);
        alert("Could not save note: " + error.message); return false; 
    }
}

async function deleteNoteFromFirestore(noteIdToDelete) {
    if (!currentUserId || !noteIdToDelete) return;
    const noteToDelete = localNotes.find(n => n.id === noteIdToDelete);
    if (!noteToDelete) return;
    if (!confirm(`Are you sure you want to delete the note "${noteToDelete.title || 'this note'}"?`)) return;

    try {
        await deleteDoc(doc(db, `users/${currentUserId}/notes`, noteIdToDelete));
        localNotes = localNotes.filter(note => note.id !== noteIdToDelete);
        if (currentNoteId === noteIdToDelete) {
            currentNoteId = null;
            saveCurrentSelectionToLocalStorage();
        }
        renderNotesListSidebar(searchNotesInput ? searchNotesInput.value : "");
        updateMainContentArea();
    } catch (error) {
        console.error("Error deleting note:", error);
        alert("Could not delete note: " + error.message);
    }
}

function selectNote(noteId) {
    const note = localNotes.find(n => n.id === noteId && n.notebookId === currentNotebookId);
    if (note) {
        currentNoteId = noteId;
    } else {
        currentNoteId = null;
    }
    saveCurrentSelectionToLocalStorage();
    renderNotesListSidebar(searchNotesInput ? searchNotesInput.value : "");
    updateMainContentArea();
}

async function renameNoteInFirestore(noteId, newName) {
    const note = localNotes.find(n => n.id === noteId);
    if (!note || !newName.trim()) return;
    
    const success = await updateNoteInFirestore(noteId, newName.trim(), note.content);
    if (success) {
        renderNotesListSidebar(searchNotesInput ? searchNotesInput.value : "");
        if (currentNoteId === noteId) {
            if(noteTitleInput) noteTitleInput.value = newName.trim();
            if(noteTimestampEl) noteTimestampEl.textContent = `Renamed & Saved: ${formatDateFromTimestamp(Timestamp.now())}`;
        }
    }
}

async function saveCurrentNoteChanges() {
    if (!currentNoteId || !noteTitleInput || !noteContentInput) return;
    const note = localNotes.find(n => n.id === currentNoteId);
    if (note) {
        const newTitle = noteTitleInput.value.trim() || "Untitled Note";
        const newContent = noteContentInput.value;
        if (note.title !== newTitle || note.content !== newContent) {
            const success = await updateNoteInFirestore(currentNoteId, newTitle, newContent);
            if (success) {
                renderNotesListSidebar(searchNotesInput ? searchNotesInput.value : "");
                if(noteTimestampEl) noteTimestampEl.textContent = `Saved: ${formatDateFromTimestamp(Timestamp.now())}`;
                if(saveNoteBtn) {
                    saveNoteBtn.classList.add('bg-green-500', 'hover:bg-green-600');
                    saveNoteBtn.innerHTML = '<i class="ph ph-check-circle mr-1.5"></i> Saved!';
                    setTimeout(() => {
                        saveNoteBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                        saveNoteBtn.innerHTML = '<i class="ph ph-floppy-disk mr-1.5"></i> Save';
                    }, 1500);
                }
            }
        }
    }
}

function scheduleAutoSave() { clearTimeout(autoSaveTimeout); autoSaveTimeout = setTimeout(saveCurrentNoteChanges, 1500); }

// --- AI Helper Panel Functions ---
function addMessageToAIChat(text, sender = 'user') { 
    if(!aiMessageDisplay) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('ai-message', sender === 'user' ? 'ai-message-user' : 'ai-message-bot');
    const senderNameP = document.createElement('p');
    senderNameP.className = 'text-xs text-slate-500 mb-0.5';
    senderNameP.textContent = sender === 'user' ? 'You' : 'Flux AI';
    const messageBubble = document.createElement('div');
    messageBubble.className = 'p-2.5 rounded-lg text-sm inline-block max-w-xs break-words';
    messageBubble.textContent = text;
    messageDiv.appendChild(senderNameP);
    messageDiv.appendChild(messageBubble);
    aiMessageDisplay.appendChild(messageDiv);
    aiMessageDisplay.scrollTop = aiMessageDisplay.scrollHeight;
}
function handleAISend() { 
    if(!aiChatInput) return;
    const query = aiChatInput.value.trim();
    if (!query) return;
    addMessageToAIChat(query, 'user');
    aiChatInput.value = '';
    setTimeout(() => {
        let response = "Mock AI: Received '" + query + "'. ";
        if (query.toLowerCase().includes("summarize")) response += "Here's a mock summary!";
        else if (query.toLowerCase().includes("hello") || query.toLowerCase().includes("hi")) response = "Hello there!";
        else response += "I'm still learning!";
        addMessageToAIChat(response, 'bot');
    }, 800);
}

// --- Settings Modal Functions ---
function openSettingsModal() { if(settingsModal) {settingsModal.classList.remove('hidden'); settingsModal.classList.add('flex');} }
function closeSettingsModal() { if(settingsModal) {settingsModal.classList.add('hidden'); settingsModal.classList.remove('flex');} }
async function handleClearAllUserDataFromFirebase() {
    if (!currentUserId) { alert("Not logged in."); return; }
    if (!confirm("ARE YOU ABSOLUTELY SURE you want to delete ALL your data from the cloud? This cannot be undone.")) return;
    if (!confirm("SECOND CONFIRMATION: Really delete all your account data (notebooks, sources, notes)?")) return;

    try {
        const notebooksQuery = query(collection(db, `users/${currentUserId}/notebooks`));
        const notebookSnapshot = await getDocs(notebooksQuery);
        for (const nbDoc of notebookSnapshot.docs) {
            const sourcesQueryDel = query(collection(db, `users/${currentUserId}/sources`), where("notebookId", "==", nbDoc.id));
            const sourcesSnapshotDel = await getDocs(sourcesQueryDel);
            sourcesSnapshotDel.forEach(async (sDoc) => await deleteDoc(doc(db, `users/${currentUserId}/sources`, sDoc.id)));

            const notesQueryDel = query(collection(db, `users/${currentUserId}/notes`), where("notebookId", "==", nbDoc.id));
            const notesSnapshotDel = await getDocs(notesQueryDel);
            notesSnapshotDel.forEach(async (nDoc) => await deleteDoc(doc(db, `users/${currentUserId}/notes`, nDoc.id)));
            
            await deleteDoc(doc(db, `users/${currentUserId}/notebooks`, nbDoc.id));
        }
        
        resetLocalDataAndUI(); 
        alert("All your account data has been cleared from Firebase.");
        closeSettingsModal();
    } catch (error) {
        console.error("Error clearing all user data:", error);
        alert("Could not clear all data: " + error.message);
    } // <-- THIS WAS THE MISSING BRACE
} // This brace closes the function

// --- Context Menu ---
function showContextMenu(event, type, id) {
    if(!customContextMenu) return;
    event.preventDefault(); event.stopPropagation(); customContextMenu.innerHTML = '';
    let itemData, renameHandler, deleteHandler;

    if (type === 'notebook') {
        itemData = localNotebooks.find(nb => nb.id === id);
        if (!itemData) return;
        renameHandler = () => openNotebookModalForRename(id);
        deleteHandler = () => deleteNotebookFromFirestore(id);
    } else if (type === 'note') {
        itemData = localNotes.find(n => n.id === id);
        if (!itemData) return;
        renameHandler = () => {
            const newName = prompt("Enter new name for the note:", itemData.title);
            if (newName !== null && newName.trim() !== "") {
                renameNoteInFirestore(id, newName.trim());
            } else if (newName !== null) {
                alert("Note name cannot be empty.");
            }
        };
        deleteHandler = () => deleteNoteFromFirestore(id);
    } else { return; }

    const renameBtn = document.createElement('button');
    renameBtn.innerHTML = `<i class="ph ph-pencil-simple"></i> Rename ${type}`;
    renameBtn.onclick = () => { renameHandler(); hideContextMenu(); };
    customContextMenu.appendChild(renameBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = `<i class="ph ph-trash"></i> Delete ${type}`;
    deleteBtn.onclick = () => { deleteHandler(); hideContextMenu(); };
    customContextMenu.appendChild(deleteBtn);

    customContextMenu.style.top = `${event.clientY}px`; customContextMenu.style.left = `${event.clientX}px`;
    customContextMenu.classList.remove('hidden');
    document.addEventListener('click', handleClickToHideContextMenu, { once: true });
    document.addEventListener('contextmenu', handleOuterRightClickToHideContextMenu, { once: true });
}
function hideContextMenu() { 
    if(customContextMenu) customContextMenu.classList.add('hidden');
    document.removeEventListener('click', handleClickToHideContextMenu);
    document.removeEventListener('contextmenu', handleOuterRightClickToHideContextMenu);
}
function handleClickToHideContextMenu(event) { 
    if(customContextMenu && !customContextMenu.contains(event.target)) hideContextMenu();
    else document.addEventListener('click', handleClickToHideContextMenu, { once: true });
}
function handleOuterRightClickToHideContextMenu(event) { 
    if(customContextMenu && !customContextMenu.contains(event.target)) hideContextMenu();
    else document.addEventListener('contextmenu', handleOuterRightClickToHideContextMenu, { once: true });
}

// --- Event Listeners Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth related event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin(loginEmailInput.value, loginPasswordInput.value);
        });
    }
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (signupPasswordInput.value !== signupConfirmPasswordInput.value) {
                if(authErrorMessage) authErrorMessage.textContent = "Passwords do not match.";
                return;
            }
            handleSignup(signupEmailInput.value, signupPasswordInput.value);
        });
    }
    
    const initialToggleToSignupBtn = document.getElementById('toggleToSignupBtn');
    if(initialToggleToSignupBtn) {
        initialToggleToSignupBtn.addEventListener('click', () => toggleAuthForms(true));
    }

    if(logoutButton) logoutButton.addEventListener('click', handleLogout);

    // Notebooks
    if(addNotebookBtn) addNotebookBtn.addEventListener('click', openNotebookModalForCreate);
    if(cancelNotebookModalBtn) cancelNotebookModalBtn.addEventListener('click', closeNotebookModal);
    if(confirmNotebookModalBtn) confirmNotebookModalBtn.addEventListener('click', handleConfirmNotebookModal);
    
    // Sources
    if(addSourceBtnSidebar) addSourceBtnSidebar.addEventListener('click', openAddSourceModal);
    if(cancelAddSourceBtn) cancelAddSourceBtn.addEventListener('click', closeAddSourceModal);
    if(confirmAddSourceBtn) confirmAddSourceBtn.addEventListener('click', handleConfirmAddSource);

    // Notes
    if(addNoteBtnSidebar) addNoteBtnSidebar.addEventListener('click', addNoteToFirestoreCurrentNotebook);
    if(searchNotesInput) searchNotesInput.addEventListener('input', (e) => renderNotesListSidebar(e.target.value));
    if(saveNoteBtn) saveNoteBtn.addEventListener('click', saveCurrentNoteChanges);
    if(deleteNoteBtn) deleteNoteBtn.addEventListener('click', () => { if (currentNoteId) deleteNoteFromFirestore(currentNoteId); });
    if(noteTitleInput) noteTitleInput.addEventListener('input', scheduleAutoSave);
    if(noteContentInput) noteContentInput.addEventListener('input', scheduleAutoSave);
    if(createNewNoteFromOverviewBtn) createNewNoteFromOverviewBtn.addEventListener('click', addNoteToFirestoreCurrentNotebook);

    // AI Panel
    if(aiSendBtn) aiSendBtn.addEventListener('click', handleAISend);
    if(aiChatInput) aiChatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAISend(); });
    if(aiSuggestedQuestions) aiSuggestedQuestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('ai-suggestion-btn')) {
            if(aiChatInput) aiChatInput.value = e.target.textContent; 
            handleAISend();
        }
    });

    // Settings
    if(settingsButton) settingsButton.addEventListener('click', openSettingsModal);
    if(closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    if(clearAllDataBtn) clearAllDataBtn.addEventListener('click', handleClearAllUserDataFromFirebase);

    // Global context menu listener
    document.addEventListener('click', (event) => {
        if(customContextMenu && !customContextMenu.classList.contains('hidden') && !customContextMenu.contains(event.target)) {
            const targetIsContextTrigger = event.target.closest('.notebook-item, .note-item-sidebar');
            if (!targetIsContextTrigger || (targetIsContextTrigger && event.button !==2) ) hideContextMenu();
        }
    });
    
    // Initial UI Setup
    if(appWrapper) appWrapper.classList.add('hidden');
    if(authScreen) authScreen.classList.add('hidden'); 
    toggleAuthForms(false); 
    
    playIntroAnimation(); 
});
