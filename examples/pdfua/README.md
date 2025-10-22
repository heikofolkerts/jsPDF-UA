# jsPDF PDF/UA Test Application

## Übersicht

Diese Test-Anwendung dient zur Entwicklung und Validierung der PDF/UA-Implementierung in jsPDF.

## Verwendung

### 1. Dev-Server starten

```bash
# Im Projekt-Root-Verzeichnis
npm start
```

Der Server läuft auf `http://localhost:8000`

### 2. Test-App öffnen

Öffne im Browser:
```
http://localhost:8000/examples/pdfua/test-app.html
```

### 3. Test-Case auswählen und PDF generieren

1. Klicke auf einen Test-Case in der linken Sidebar
2. Der Code wird rechts angezeigt
3. Klicke "PDF Generieren"
4. Klicke "Download PDF"

### 4. Mit veraPDF validieren

#### Option A: Docker (empfohlen)

```bash
# In den Download-Ordner wechseln oder PDF dort hin kopieren
cd ~/Downloads

# PDF validieren
docker run --rm -v $(pwd):/data verapdf/cli:latest --flavour ua1 /data/baseline-test.pdf
```

#### Option B: veraPDF GUI

1. veraPDF GUI öffnen (siehe `docs/verapdf-setup.md`)
2. PDF-Datei laden
3. Profil "PDF/UA-1" auswählen
4. "Validate" klicken

## Test-Cases

### Sprint 0 (Aktuell)

- **Baseline**: Zeigt den aktuellen Stand ohne PDF/UA-Features
  - Status: ❌ 7 Fehler
  - Zweck: Baseline für Vergleich

### Sprint 1 (Geplant)

- **Simple PDF/UA**: Grundlegende PDF/UA-Infrastruktur
  - PDF/UA-Modus aktivieren
  - XMP-Metadaten
  - DisplayDocTitle

### Sprint 2 (Geplant)

- **With Structure Tree**: Strukturbaum-Implementierung
  - StructTreeRoot
  - Document-Element
  - Paragraph-Elemente

### Sprint 3 (Geplant)

- **Marked Content**: Content-Marking mit MCID
  - BDC/EMC Tags
  - ParentTree

### Sprint 4 (Geplant)

- **Images with Alt Text**: Bilder mit Alternativtexten
- **Headings**: Überschriften-Hierarchie (H1-H6)

### Sprint 5 (Geplant)

- **Complete Document**: Vollständiges PDF/UA-konformes Dokument

## Struktur

```
examples/pdfua/
├── test-app.html        # HTML-Hauptseite
├── test-app.js          # Test-Cases und Logik
└── README.md            # Diese Datei
```

## Test-Cases erweitern

Neue Test-Cases werden in `test-app.js` im `testCases`-Objekt hinzugefügt:

```javascript
const testCases = {
  // Bestehende Tests...

  myNewTest: {
    name: 'My New Test',
    description: 'Beschreibung',
    code: `
      const doc = new jsPDF({ pdfUA: true });
      // ... code ...
      doc.save('test.pdf');
    `,
    expectedErrors: [],  // Liste erwarteter Fehler
    generate: function() {
      // PDF-Generierungs-Logik
      const doc = new jsPDF({ pdfUA: true });
      // ...
      return doc;
    }
  }
};
```

Dann Button in `test-app.html` hinzufügen:

```html
<button class="list-group-item list-group-item-action test-case-btn"
        onclick="showTest('myNewTest')">
  <span>X. My New Test</span>
  <span class="badge bg-warning status-badge">In Progress</span>
</button>
```

## Entwicklung

### Live-Reload während Entwicklung

1. Terminal 1: Dev-Server
   ```bash
   npm start
   ```

2. Terminal 2: Build-Watch (optional, wenn src/ geändert wird)
   ```bash
   npm run build
   # Refresh browser nach Build
   ```

3. Browser: Test-App öffnen
   - Bei Änderungen an HTML/JS: Browser refreshen
   - Bei Änderungen an jsPDF: neu builden, dann refreshen

### Debugging

Browser-Konsole öffnen (F12), dann:

```javascript
// Aktueller Test
testApp.currentTest

// Generiertes PDF-Objekt
testApp.currentPDF

// Alle Test-Cases
testApp.testCases

// Test programmatisch auswählen
testApp.showTest('baseline')

// PDF generieren
testApp.generatePDF()
```

## Validierungs-Workflow

1. **Entwickeln**: Feature in jsPDF implementieren
2. **Test-Case hinzufügen**: In test-app.js
3. **PDF generieren**: In Browser
4. **Validieren**: Mit veraPDF
5. **Iterieren**: Fehler beheben, wiederholen

## Bekannte Probleme

- **Browser-Tests**: Karma-Tests laufen nicht in WSL (Chrome fehlt)
  - Lösung: Node.js-Tests verwenden: `npm run test-node`

## Ressourcen

- [veraPDF Setup Guide](../../docs/verapdf-setup.md)
- [PDF/UA Backlog](../../PDFUA_BACKLOG.md)
- [Sprint Plan](../../PDFUA_SPRINT_PLAN.md)
- [veraPDF Website](https://verapdf.org/)
- [PDF/UA Standard](https://pdfa.org/resource/iso-14289-pdfua/)
