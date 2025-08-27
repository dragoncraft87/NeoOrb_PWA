// ================================================================
// Funktion, die die gesamte Logik für den Profil-Editor enthält
// ================================================================
// Version der PWA
const CURRENT_PWA_VERSION = "2.01"; // Passe das an deine aktuelle Version an

function initProfilesView() {
   
    // ============= State Management =============
    let profiles = { 1: null, 2: null, 3: null, 4: null };
    let backups = [];
    let currentProfileId = null;
    let keyConfigs = {};    // Holds keys for the *current* profile
    let importedData = null;

    // ============= DOM Element References =============
    // Pages
    const overviewPage = document.getElementById('overview-page');
    const editorPage = document.getElementById('editor-page');
    // Overview Page
    const profilesGrid = document.getElementById('profiles-grid');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    // Editor Page
    const profileIdInput = document.getElementById('profile-id-input');
    const profileNameInput = document.getElementById('profile-name-input');
    const currentIconDisplay = document.getElementById('current-icon-display');
    const keypadGrid = document.getElementById('keypad-grid');
    const changeIconBtn = document.getElementById('change-icon-btn');
    const exportCurrentProfileBtn = document.getElementById('export-current-profile-btn');
    const backToOverviewBtn = document.getElementById('back-to-overview-btn');
    // Key Config Modal
    const keyModal = document.getElementById('key-config-modal');
    const modalTitle = document.getElementById('modal-title');
    const actionTypeSelect = document.getElementById('action-type-select');
    const shortcutSelect = document.getElementById('key-shortcut-select');
    const macroInput = document.getElementById('key-macro-input');
    const colorInput = document.getElementById('color-input');
    const modifierCheckboxes = document.querySelectorAll('#modifier-wrapper input');
    // Icon Picker Modal
    const iconPickerModal = document.getElementById('icon-picker-modal');
    const iconGrid = document.getElementById('icon-grid');
    // Import Modal
    const importModal = document.getElementById('import-modal');
    const existingDisplay = document.getElementById('existing-profile-display');
    const importedDisplay = document.getElementById('imported-profile-display');
    const targetSelect = document.getElementById('target-id-select');
    const backupCheckbox = document.getElementById('backup-before-import');
    const confirmImportBtn = document.getElementById('confirm-import-btn');

    let currentlyEditingKeyId = null;
    const availableIcons=['fa-solid fa-keyboard','fa-solid fa-gamepad','fa-solid fa-video','fa-solid fa-code','fa-solid fa-music','fa-solid fa-pen-nib','fa-solid fa-camera','fa-solid fa-star','fa-solid fa-briefcase','fa-solid fa-lightbulb','fa-solid fa-rocket','fa-solid fa-user-astronaut'];

    // ============= Persistence Functions =============
    function saveProfilesToStorage() {
        localStorage.setItem('neoOrbProfiles', JSON.stringify(profiles));
    }

    function loadProfilesFromStorage() {
        const storedProfiles = JSON.parse(localStorage.getItem('neoOrbProfiles'));
        if (storedProfiles) {
            profiles = storedProfiles;
        }
        const storedBackups = JSON.parse(localStorage.getItem('neoorb_backups'));
        if(storedBackups) {
            backups = storedBackups;
        }
    }

    // ============= View Management =============
    function showOverviewPage() {
        renderProfilesGrid();
        overviewPage.classList.remove('modal-hidden');
        editorPage.classList.add('modal-hidden');
        currentProfileId = null;
    }

    function showEditorPage() {
        overviewPage.classList.add('modal-hidden');
        editorPage.classList.remove('modal-hidden');
    }

    // ============= Grid View Functions =============
    function renderProfilesGrid() {
        profilesGrid.innerHTML = '';
        for (let i = 1; i <= 4; i++) {
            const p = profiles[i];
            const tile = document.createElement('div');
            tile.className = 'profile-tile ' + (p ? '' : 'empty');
            tile.dataset.id = i;
            tile.innerHTML = p ?
                `<i class="${p.profileIcon}"></i><div>${p.profileName}</div>` :
                `<i class="fa-solid fa-plus"></i><div>Slot ${i}</div>`;
            tile.addEventListener('click', () => loadProfileIntoEditor(i));
            profilesGrid.appendChild(tile);
        }
    }

    // ============= Editor Loading & Saving =============
    function loadProfileIntoEditor(id) {
        currentProfileId = id;
        if (!profiles[currentProfileId]) {
            // Create a new default profile if slot is empty
            profiles[currentProfileId] = {
                profileId: currentProfileId,
                profileName: `Neues Profil ${currentProfileId}`,
                profileIcon: 'fa-solid fa-keyboard',
                keys: []
            };
        }
        
        const p = profiles[currentProfileId];
        
        profileIdInput.value = p.profileId;
        profileNameInput.value = p.profileName;
        currentIconDisplay.innerHTML = `<i class="${p.profileIcon}"></i>`;

        keyConfigs = {};
        if (p.keys) {
            p.keys.forEach(key => {
                keyConfigs[key.id] = key;
            });
        }

        renderKeypad();
        showEditorPage();
    }
    
    function saveEditorToProfile() {
        if (!currentProfileId) return;
        const p = profiles[currentProfileId];
        if (!p) return;
        p.profileName = profileNameInput.value.trim();
        p.keys = Object.values(keyConfigs);
        saveProfilesToStorage();
    }

    // ============= Keypad & Editor Functions =============
    function getTextColor(hex) {
        if (!hex || hex.length < 7) return '#ffffff';
        const rgb=[parseInt(hex.substr(1,2),16),parseInt(hex.substr(3,2),16),parseInt(hex.substr(5,2),16)];
        const lum=(0.299*rgb[0]+0.587*rgb[1]+0.114*rgb[2])/255;
        return lum>0.5?'#000000':'#ffffff';
    }

    function renderKeypad() {
        keypadGrid.innerHTML = '';
        for (let i = 0; i < 15; i++) {
            const cfg = keyConfigs[i] || { id: i, action: ``, modifier: 0, color: '#27293d' };
            const key = document.createElement('div');
            key.classList.add('key');
            updateKeyElement(key, cfg);
            key.addEventListener('click', () => openKeyModal(i));
            keypadGrid.appendChild(key);
        }
    }
    
    function updateKeyElement(el, cfg) {
        const col = cfg.color || '#27293d';
        if (col !== '#27293d') {
            el.style.background = col;
            el.style.boxShadow = `0 0 10px ${col}, inset 0 0 5px rgba(255,255,255,0.2)`;
        } else {
            el.style.background = 'linear-gradient(145deg, #32344e, #24263a)';
            el.style.boxShadow = '3px 3px 6px #1a1b2a, -3px -3px 6px #343754';
        }
        el.style.color = getTextColor(col);
        let lbl = cfg.action;
        if (typeof lbl === 'string' && lbl.startsWith('{')) lbl = lbl.replace(/[{}]/g, '');
        const label = cfg.label || '';
        el.innerHTML = `<span>${label}</span>`;
        
    }

    function openKeyModal(id) {
        currentlyEditingKeyId = id;
        modalTitle.textContent = `Taste ${id + 1} konfigurieren`;
        const cfg = keyConfigs[id] || {};
        document.getElementById('key-label-input').value = cfg.label || '';
        const act = cfg.action || '', mod = cfg.modifier || 0;
        document.querySelectorAll('#modifier-wrapper input').forEach(cb => cb.checked = (mod & parseInt(cb.value)) !== 0);
        if ((typeof act === 'string' && act.length === 1 && mod > 0) || (typeof act === 'string' && act.startsWith('{'))) {
            actionTypeSelect.value = 'shortcut'; shortcutSelect.value = act; macroInput.value = '';
        } else { actionTypeSelect.value = 'macro'; macroInput.value = act; shortcutSelect.value = 'A'; }
        colorInput.value = cfg.color || '#5d5fef';
        showCorrectActionWrapper();
        keyModal.classList.remove('modal-hidden');
    }
    
    function saveKeyConfig() {
        const label = document.getElementById('key-label-input').value.trim();
        if (currentlyEditingKeyId === null) return;
        let action, modifier = 0;
        if (actionTypeSelect.value === 'shortcut') {
            action = shortcutSelect.value;
            modifierCheckboxes.forEach(cb => { if (cb.checked) modifier |= parseInt(cb.value); });
        } else {
            action = macroInput.value;
        }
        keyConfigs[currentlyEditingKeyId] = {
            id: currentlyEditingKeyId,
            label,
            action,
            modifier,
            color: colorInput.value
        };            
        saveEditorToProfile();
        renderKeypad();
        closeModal(keyModal);
    }

    function showCorrectActionWrapper() {
        const isSC = actionTypeSelect.value === 'shortcut';
        document.getElementById('action-wrapper-shortcut').style.display = isSC ? 'block' : 'none';
        document.getElementById('action-wrapper-macro').style.display = isSC ? 'none' : 'block';
        document.getElementById('modifier-wrapper').style.display = isSC ? 'block' : 'none';
    }
    
    function populateIconPicker() {
        iconGrid.innerHTML = '';
        availableIcons.forEach(ic => {
            const d = document.createElement('div');
            d.classList.add('icon-option');
            d.dataset.iconClass = ic;
            d.innerHTML = `<i class="${ic}"></i>`;
            d.addEventListener('click', () => selectIcon(ic));
            iconGrid.appendChild(d);
        });
    }
    
    function selectIcon(ic) {
        if (!currentProfileId) return;
        profiles[currentProfileId].profileIcon = ic;
        currentIconDisplay.innerHTML = `<i class="${ic}"></i>`;
        saveEditorToProfile();
        closeModal(iconPickerModal);
    }
    
    function exportCurrentProfileAsJson() {
        if (!currentProfileId) return;
        saveEditorToProfile(); 
        const profileData = profiles[currentProfileId];
        const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `profile_${profileData.profileId}_${profileData.profileName.replace(/\s/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    function closeModal(modalElement) {
        modalElement.classList.add('modal-hidden');
    }

    // ============= Import Functions =============
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const imp = JSON.parse(evt.target.result);
                const { profileId, profileName, profileIcon, keys } = imp;
                if (profileName === undefined || profileIcon === undefined || keys === undefined) {
                    return alert('Ungültiges Profilformat. Erforderliche Felder fehlen.');
                }
                
                const targetId = [1, 2, 3, 4].includes(profileId) ? profileId : 1;
                const existing = profiles[targetId];

                existingDisplay.innerHTML = existing ?
                    `<b>Slot ${targetId}:</b> ${existing.profileName} <i class="${existing.profileIcon}"></i>` :
                    `<b>Slot ${targetId}:</b> leer`;
                importedDisplay.innerHTML = `<b>Import:</b> ${profileName} <i class="${profileIcon}"></i>`;
                
                targetSelect.value = targetId;
                importedData = imp;
                importModal.classList.remove('modal-hidden');
            } catch (err) {
                alert('Fehler beim Lesen der Datei: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
    
    confirmImportBtn.addEventListener('click', () => {
        if (!importedData) return;
        const targetId = parseInt(targetSelect.value);

        // Backup logic
        if (backupCheckbox.checked && profiles[targetId]) {
            backups.push({
                profileId: targetId,
                data: profiles[targetId],
                time: Date.now()
            });
            localStorage.setItem('neoorb_backups', JSON.stringify(backups));
            console.log(`Profil in Slot ${targetId} wurde gesichert.`);
        }

        importedData.profileId = targetId;
        profiles[targetId] = importedData;
        saveProfilesToStorage();
        renderProfilesGrid();
        closeModal(importModal);
        alert(`Profil erfolgreich in Slot ${targetId} importiert.`);
    });

    // ============= Event Listeners Setup =============
    // Page Navigation
    backToOverviewBtn.addEventListener('click', () => {
        saveEditorToProfile();
        showOverviewPage();
    });
    // Editor
    changeIconBtn.addEventListener('click', () => iconPickerModal.classList.remove('modal-hidden'));
    exportCurrentProfileBtn.addEventListener('click', exportCurrentProfileAsJson);
    profileNameInput.addEventListener('input', saveEditorToProfile);
    // Modals
    document.querySelectorAll('.modal .close-button, .modal #modal-cancel-btn, .modal #cancel-import-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.currentTarget.closest('.modal').classList.add('modal-hidden');
        });
    });
    document.getElementById('modal-save-btn').addEventListener('click', saveKeyConfig);
    actionTypeSelect.addEventListener('change', showCorrectActionWrapper);
    

    // ============= Initialisation (innerhalb dieser Funktion) =============
    // Diese Zeilen müssen am Ende deiner eingefügten Logik stehen.
        loadProfilesFromStorage();
        showOverviewPage();
        populateIconPicker();
    // WICHTIG: Die Service Worker Registrierung entfernen wir hier, 
    // die machen wir später an einer zentralen Stelle.
}

// ================================================================
// Funktion, die die Verbindung zum NeoOrb herstellt und das Dashboard initialisiert
// ================================================================

function initConnectView() {
    const appContainer = document.getElementById('app-container');
    
    // Wir versuchen, die Status-API des NeoOrb zu erreichen.
    // Die feste IP des Access Points ist hier entscheidend.
    // Der Browser muss mit dem WLAN des NeoOrb verbunden sein.
    fetch('http://192.168.4.1/get_status')
        .then(response => {
            // Wenn die Antwort nicht OK ist (z.B. Fehler 404 oder 500), werfen wir einen Fehler.
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }
            // Wenn alles gut geht, leiten wir zum Dashboard weiter.
            console.log("Erfolgreich mit NeoOrb verbunden!");
            window.location.hash = '/dashboard'; // Weiterleitung zur neuen Dashboard-Seite
        })
        .catch(error => {
            // Wenn die Anfrage fehlschlägt (keine Verbindung, falsche IP), zeigen wir eine Fehlermeldung an.
            console.error("Verbindung zum NeoOrb fehlgeschlagen:", error);
            appContainer.innerHTML = `
                <div class="card">
                    <h2>Verbindung fehlgeschlagen</h2>
                    <p>Es konnte keine Verbindung zum NeoOrb hergestellt werden. Stelle sicher, dass du mit dem WLAN-Access-Point des Geräts verbunden bist und versuche es erneut.</p>
                    <div class="action-buttons">
                        <a href="#/home" class="secondary-button"><i class="fa-solid fa-arrow-left"></i> Zurück zur Startseite</a>
                    </div>
                </div>
            `;
        });
}

// ================================================================
// Funktion, die das Dashboard initialisiert und den Live-Status anzeigt   
// ================================================================

function initDashboardView() {
    console.log("Dashboard wird initialisiert...");
    
    const fwVersionEl = document.getElementById('fw-version');
    const btStatusEl = document.getElementById('bt-status');
    const socStatusEl = document.getElementById('soc-status');
    const sdStatusEl = document.getElementById('sd-status');

    function updateStatus() {
        fetch('http://192.168.4.1/get_status')
            .then(response => response.json())
            .then(data => {
                // Fülle die HTML-Elemente mit den Daten vom Gerät
                fwVersionEl.textContent = data.fw_version || 'N/A';
                btStatusEl.textContent = data.bluetooth_status || 'N/A';
                socStatusEl.textContent = `${(data.soc || 0).toFixed(0)}%`;
                sdStatusEl.textContent = data.sd_status || 'N/A';

                // Ändere den globalen Status im Header
                document.getElementById('connection-status').innerHTML = '<i class="fa-solid fa-wifi" style="color: var(--success-color);"></i> Verbunden';
            })
            .catch(error => {
                console.error("Fehler beim Aktualisieren des Status:", error);
                // Wenn der Status nicht mehr abrufbar ist, leite zurück zur Fehlerseite oder Startseite
                window.location.hash = '/connect'; 
            });
    }

    // Rufe den Status sofort auf und dann alle 5 Sekunden erneut.
    updateStatus();
    setInterval(updateStatus, 5000);
}
// ================================================================
// File Manager Logik
// ================================================================

function initFilesPage() {
    console.log("Dateimanager-Seite initialisiert");
    
    const fileListBody = document.getElementById('file-list-body');
    const currentPathSpan = document.getElementById('current-path');
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const filePathInput = document.getElementById('file-path');

    // Helferfunktion zum Formatieren von Bytes in KB/MB
    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Helferfunktion zum Formatieren des Unix-Timestamps
    function formatTimestamp(timestamp) {
        if (!timestamp || timestamp === 0) return '-';
        const date = new Date(timestamp * 1000); // JS erwartet Millisekunden
        return date.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
    }

    async function loadAndRenderFiles(path) {
        currentPathSpan.textContent = path;
        filePathInput.value = path;
        fileListBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Lade Dateiliste...</td></tr>';

        try {
            const response = await fetch(`/api/list-files?path=${encodeURIComponent(path)}`);
            if (!response.ok) throw new Error(`Serverfehler: ${response.status}`);
            
            const files = await response.json();
            fileListBody.innerHTML = ''; // Leere den Tabellenkörper

            // "Zurück"-Button als erste Zeile hinzufügen
            if (path !== '/') {
                const parentPath = path.substring(0, path.lastIndexOf('/', path.length - 2) + 1) || '/';
                const row = fileListBody.insertRow();
                row.className = 'directory-item';
                row.innerHTML = `<td><i class="fa-solid fa-arrow-left"></i></td><td colspan="4" class="col-name"><span>Übergeordneter Ordner</span></td>`;
                row.querySelector('span').addEventListener('click', () => loadAndRenderFiles(parentPath));
            }

            // Sortieren: Ordner zuerst, dann alphabetisch
            files.sort((a, b) => {
                if (a.type === 'directory' && b.type !== 'directory') return -1;
                if (a.type !== 'directory' && b.type === 'directory') return 1;
                return a.name.localeCompare(b.name);
            });

            if (files.length === 0 && fileListBody.innerHTML === '') {
                 fileListBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Dieser Ordner ist leer.</td></tr>';
            }

            // Für jede Datei eine Tabellenzeile erstellen
            files.forEach(file => {
                const row = fileListBody.insertRow();
                row.className = file.type === 'directory' ? 'directory-item' : 'file-item';
                const icon = file.type === 'directory' ? 'fa-folder' : 'fa-file';
                const fullPath = path + file.name;
                const downloadBtn = file.type !== 'directory' ? `<a class="download-btn" title="Herunterladen" href="${fullPath}" download><i class="fa-solid fa-download"></i></a>` : '';
                const deleteBtn = `<button class="delete-btn" title="Löschen" data-path="${fullPath}"><i class="fa-solid fa-trash"></i></button>`;
                
                row.innerHTML = `
                    <td class="col-icon"><i class="fa-solid ${icon}"></i></td>
                    <td class="col-name"><span>${file.name}</span></td>
                    <td class="col-size">${file.type === 'directory' ? '-' : formatBytes(file.size)}</td>
                    <td class="col-modified">${formatTimestamp(file.modified)}</td>
                    <td class="col-actions"><div class="file-actions">${downloadBtn}${deleteBtn}</div></td>
                `;
                
                if (file.type === 'directory') {
                    row.querySelector('span').addEventListener('click', () => loadAndRenderFiles(`${path}${file.name}/`));
                }
                
                row.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteFile(e.currentTarget.dataset.path, path);
                });
            });

        } catch (error) {
            console.error("Fehler beim Laden der Dateiliste:", error);
            fileListBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align: center;">Fehler: ${error.message}</td></tr>`;
        }
    }

    async function deleteFile(filePath, currentDir) {
        if (!confirm(`Soll "${filePath}" wirklich gelöscht werden?`)) return;
        try {
            const response = await fetch('/api/delete-file', { method: 'POST', body: `/sdcard${filePath}` });
            if (!response.ok) throw new Error("Löschen fehlgeschlagen");
            alert("Erfolgreich gelöscht.");
            loadAndRenderFiles(currentDir);
        } catch (error) {
            alert(`Fehler: ${error.message}`);
        }
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const filePath = filePathInput.value;
        const fileInput = document.getElementById('file-upload');
        const file = fileInput.files[0];
        if (!file) {
            uploadStatus.textContent = 'Bitte eine Datei auswählen!';
            return;
        }
        uploadStatus.textContent = `Lade ${file.name} hoch...`;
        try {
            const response = await fetch('/upload', { method: 'POST', headers: { 'File-Name': file.name, 'File-Path': filePath }, body: file });
            if (response.ok) {
                uploadStatus.textContent = `Datei ${file.name} erfolgreich hochgeladen!`;
                loadAndRenderFiles(filePath);
            } else {
                throw new Error(`Serverfehler: ${response.status}`);
            }
        } catch (error) {
            console.error('Upload-Fehler:', error);
            uploadStatus.textContent = 'Upload fehlgeschlagen!';
        }
    });

    loadAndRenderFiles('/');
}

// in js/app.js

// NEUE FUNKTIONEN FÜR DEN UPDATE-PROZESS

/**
 * Prüft auf GitHub, ob eine neue PWA-Version verfügbar ist.
 */
async function checkForUpdates() {
    console.log("Prüfe auf Updates...");
    try {
        // WICHTIG: Ersetze die URL mit dem RAW-Link zu deinem Manifest auf GitHub
        const response = await fetch('https://raw.githubusercontent.com/dragoncraft87/NeoOrb_PWA/main/update-manifest.json');
        if (!response.ok) throw new Error('Manifest nicht erreichbar');

        const manifest = await response.json();
        
        // Vergleiche die Versionen
        if (manifest.latest_version > CURRENT_PWA_VERSION) {
            console.log(`Update gefunden: ${manifest.latest_version}`);
            showUpdateNotification(manifest);
        } else {
            console.log("PWA ist auf dem neuesten Stand.");
        }
    } catch (error) {
        // Das ist normal, wenn kein Internet da ist.
        console.log("Keine Internetverbindung oder Fehler beim Update-Check:", error.message);
    }
}

/**
 * Zeigt einen dezenten Hinweis an, dass ein Update verfügbar ist.
 * @param {object} manifest - Die geladenen Update-Informationen.
 */
function showUpdateNotification(manifest) {
    // Finde den Header, um den Hinweis dort einzufügen
    const header = document.querySelector('header');
    if (!header) return;

    // Verhindere, dass mehrere Hinweise angezeigt werden
    if (document.getElementById('update-notification')) return;

    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.className = 'update-notification';
    notification.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-down"></i>
        <span>Ein neues Update (v${manifest.latest_version}) ist verfügbar.</span>
        <button id="download-update-btn" class="primary-button">Herunterladen</button>
    `;
    
    // Füge den Hinweis unter dem Header ein
    header.parentNode.insertBefore(notification, header.nextSibling);

    // Füge einen Event Listener für den Download-Button hinzu
    document.getElementById('download-update-btn').addEventListener('click', () => {
        alert(`Starte Download für Version ${manifest.latest_version}...\n\nRelease Notes: ${manifest.release_notes}`);
        // HIER kommt im nächsten Schritt die Logik zum Herunterladen der ZIP-Datei hin.
    });
}

// ================================================================
// HAUPT-LOGIK DER NEUEN APP (Dein bisheriger Code)
// ================================================================
// Wir warten, bis die Seite komplett geladen ist, bevor wir unser Skript ausführen.
document.addEventListener('DOMContentLoaded', () => {

    // Dies ist der Container in der index.html, in den wir unsere "Seiten" laden.
    const appContainer = document.getElementById('app-container');

    // Hier definieren wir den HTML-Inhalt für unsere verschiedenen Ansichten (Views).
    // Momentan sind die meisten nur Platzhalter.
    const views = {
        home: `
            <div class="welcome-message">
                <h2>Willkommen beim NeoOrb Projekt!</h2>
                <p>Deine Kommandozentrale für das ultimative Makro-Keyboard. Wähle deinen Weg.</p>
            </div>
            <div class="hub-grid">
                <a href="#/connect" class="hub-card">
                    <i class="fa-solid fa-rocket"></i>
                    <h3>Steuerzentrale</h3>
                    <p>Verbinde dich live mit deinem NeoOrb und verwalte es in Echtzeit.</p>
                    <span>Jetzt Verbinden &rarr;</span>
                </a>
                <a href="#/profiles" class="hub-card">
                    <i class="fa-solid fa-drafting-compass"></i>
                    <h3>Offline-Werkstatt</h3>
                    <p>Erstelle und bearbeite deine Profile und Designs jederzeit und überall.</p>
                    <span>Editoren öffnen &rarr;</span>
                </a>
                <a href="#/about" class="hub-card">
                    <i class="fa-solid fa-book-open"></i>
                    <h3>Entdecke NeoOrb</h3>
                    <p>Erfahre alles über die Hardware, die Software und die Community.</p>
                    <span>Mehr erfahren &rarr;</span>
                </a>
                <a href="#/faq" class="hub-card">
                    <i class="fa-solid fa-circle-question"></i>
                    <h3>Hilfe & FAQ</h3>
                    <p>Hier findest du Antworten auf die häufigsten Fragen.</p>
                    <span>Antworten finden &rarr;</span>
                </a>
            </div>
        `,
        connect: `
            <div class="card">
                <h2>Verbindung wird hergestellt...</h2>
                <p>Bitte einen Moment Geduld.</p>
            </div>
        `,
        profiles: `
            <main id="overview-page">
                <h1 class="page-title">Meine Profile</h1>
                <div class="profiles-grid" id="profiles-grid"></div>
                <div class="action-buttons">
                    <button id="import-btn" class="primary-button"><i class="fa-solid fa-file-import"></i> Profil importieren</button>
                </div>
            </main>
            <main id="editor-page" class="modal-hidden">
                <h1 class="page-title">Profil bearbeiten</h1>
                <section id="profile-section" class="card">
                    <h2><i class="fa-solid fa-id-card"></i> Profileigenschaften</h2>
                    <div class="profile-controls">
                        <div class="form-group">
                            <label>Profil-Slot:</label>
                            <input type="number" id="profile-id-input" value="1" min="1" max="4" disabled>
                        </div>
                        <div class="form-group">
                            <label>Profilname:</label>
                            <input type="text" id="profile-name-input" value="Mein neues Profil">
                        </div>
                        <button id="change-icon-btn"><i class="fa-solid fa-icons"></i> Icon ändern</button>
                        <button id="export-current-profile-btn" class="primary-button"><i class="fa-solid fa-file-export"></i> Aktuelles Profil exportieren</button>
                    </div>
                    <div class="form-group">
                        <p>Gewähltes Icon: <span id="current-icon-display"></span></p>
                    </div>
                </section>
                <section id="keypad-section" class="card">
                    <h2><i class="fa-solid fa-keyboard"></i> Tastenbelegung</h2>
                    <div id="keypad-grid"></div>
                </section>
                <div class="action-buttons">
                    <button id="back-to-overview-btn" class="secondary-button"><i class="fa-solid fa-arrow-left"></i> Zurück zur Übersicht</button>
                </div>
            </main>
            <div id="key-config-modal" class="modal modal-hidden"> ... </div>
            <div id="icon-picker-modal" class="modal modal-hidden"> ... </div>
            <div id="import-modal" class="modal modal-hidden"> ... </div>
            <input type="file" id="import-file-input" accept=".json" style="display:none" />
        `,
        dashboard: `
            <section id="status-section" class="card">
                <h2><i class="fa-solid fa-heart-pulse"></i> Live Status</h2>
                <div class="status-grid">
                    <div class="status-item">
                        <i class="fa-solid fa-microchip"></i>
                        <div><span>Firmware</span><strong id="fw-version">...</strong></div>
                    </div>
                    <div class="status-item">
                        <i class="fa-brands fa-bluetooth-b"></i>
                        <div><span>Bluetooth</span><strong id="bt-status">...</strong></div>
                    </div>
                    <div class="status-item">
                        <i class="fa-solid fa-battery-full"></i>
                        <div><span>Akku</span><strong id="soc-status">...</strong></div>
                    </div>
                    <div class="status-item">
                        <i class="fa-solid fa-sd-card"></i>
                        <div><span>SD-Karte</span><strong id="sd-status">...</strong></div>
                    </div>
                </div>
            </section>
            
            <section id="online-actions" class="card">
                <h2><i class="fa-solid fa-screwdriver-wrench"></i> Geräte-Management</h2>
                <div class="action-buttons">
                    <a href="#/files" class="primary-button"><i class="fa-solid fa-folder-open"></i> Dateimanager</a>
                    </div>
            </section>
        `,

        // Die Vorlage für den Dateimanager, die wir schon erstellt haben
        files: `
            <main class="file-manager-grid">
                <section id="file-browser-section" class="card">
                    <h2><i class="fa-solid fa-sd-card"></i> Dateimanager</h2>
                    <div class="file-browser">
                        <div class="file-path-bar">
                            Aktueller Pfad: <strong id="current-path">/</strong>
                        </div>
                        <div id="file-list-container">
                            <table class="file-table">
                                <thead>
                                    <tr>
                                        <th class="col-icon"></th>
                                        <th class="col-name">Name</th>
                                        <th class="col-size">Größe</th>
                                        <th class="col-modified">Geändert am</th>
                                        <th class="col-actions">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody id="file-list-body">
                                    </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                
                <section id="upload-section" class="card">
                    <h2><i class="fa-solid fa-upload"></i> Datei hochladen</h2>
                    <form id="upload-form">
                        <p>Lade neue Versionen der Web-Dateien direkt auf die SD-Karte.</p>
                        <div class="form-group">
                            <label for="file-path">Zielpfad (wird aus Dateimanager übernommen):</label>
                            <input type="text" id="file-path" value="/" readonly>
                        </div>
                        <div class="form-group">
                            <label for="file-upload">Datei auswählen:</label>
                            <input type="file" id="file-upload" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="primary-button">Hochladen</button>
                        </div>
                        <div id="upload-status"></div>
                    </form>
                </section>
            </main>
        `,

        faq: `
            <div class="card">
                <h2>FAQ</h2>
                <p>Hier kommt die FAQ-Seite hin.</p>
            </div>
        `,
        notFound: `
            <div class="card">
                <h2>404 - Seite nicht gefunden</h2>
                <p>Ups! Der Link scheint nicht zu funktionieren. <a href="#/home">Zurück zur Startseite</a>.</p>
            </div>
        `
    };
    // Die zentrale Router-Funktion, die die Ansichten wechselt.
    const router = () => {
        // ... der obere Teil bleibt gleich ...
        const path = window.location.hash.substring(1) || '/home';
        const routeName = path.split('/')[1];
        
        // ÄNDERUNG: Die 'connect'-Ansicht braucht keinen festen HTML-Inhalt mehr,
        // da sie entweder weiterleitet oder eine Fehlermeldung anzeigt.
        if (routeName === 'connect') {
            appContainer.innerHTML = `<div class="card"><p>Verbinde mit NeoOrb...</p></div>`;
            initConnectView();
            return; // Stoppe die Funktion hier
        }
        
        const viewHtml = views[routeName] || views.notFound;
        appContainer.innerHTML = viewHtml;

        if (routeName === 'profiles') {
            initProfilesView();
        } else if (routeName === 'dashboard') {
            initDashboardView();
        } else if (routeName === 'files') { 
            initFilesPage();              
        } else {            // Für alle anderen Seiten (home, faq etc.) den Offline-Status im Header sicherstellen
            document.getElementById('connection-status').textContent = 'Offline-Modus';
        }
    };
    // Registriere den Router für zwei Ereignisse:
    // 1. 'hashchange': Wird ausgelöst, wenn jemand auf einen Link wie <a href="#/profiles"> klickt.
    window.addEventListener('hashchange', router);

    // 2. 'load': Wird ausgelöst, wenn die Seite zum allerersten Mal geladen wird.
    window.addEventListener('load', router);

    // NEU: Rufe die Update-Prüfung beim Start auf
    checkForUpdates();
});