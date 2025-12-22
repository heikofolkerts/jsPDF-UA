# PDF/UA Sprint-Planung

## Sprint-Übersicht für MVP (Phase 1)

Diese Datei enthält eine detaillierte Sprint-Planung für die erste Phase der PDF/UA-Implementierung.

---

## Sprint 0: Setup & Vorbereitung (1 Woche)

### Ziele:

- Entwicklungsumgebung aufsetzen
- veraPDF-Validator installieren und testen
- PDF/UA-Spezifikation studieren
- Test-Anwendung Grundgerüst erstellen

### Aufgaben:

#### TASK-0.1: Entwicklungsumgebung

- [ ] Repository forken/klonen
- [ ] Dependencies installieren: `npm install`
- [ ] Build testen: `npm run build`
- [ ] Tests ausführen: `npm run test-local`
- [ ] Dev-Server starten: `npm start`

#### TASK-0.2: veraPDF Setup

- [ ] veraPDF von https://verapdf.org/ herunterladen
- [ ] Installation testen
- [ ] Test-PDF validieren: `verapdf --flavour ua1 test.pdf`
- [ ] Ausgabeformat verstehen (XML/HTML)

#### TASK-0.3: Test-Anwendung Grundgerüst

- [ ] Datei erstellen: `examples/pdfua-test-app.html`
- [ ] Basis-HTML-Struktur mit jsPDF einbinden
- [ ] Buttons für verschiedene Test-Cases
- [ ] PDF-Download-Funktion
- [ ] Live-Preview (optional)

**Deliverables:**

- Funktionierende Dev-Umgebung
- veraPDF läuft
- Leere Test-App ist erreichbar unter `http://localhost:8000/examples/pdfua-test-app.html`

---

## Sprint 1: Grundlagen-Infrastruktur (2 Wochen)

### Stories: US-1.1, US-1.2, US-1.3

### Sprint-Ziel:

Ein PDF mit PDF/UA-Kennzeichnung, Metadaten und DisplayDocTitle generieren können.

### Aufgaben:

#### US-1.1: PDF/UA-Modus

**Datei:** `src/jspdf.js`

- [ ] Option `pdfUA` zum Konstruktor hinzufügen
  ```javascript
  function jsPDF(options) {
    // ... existing code
    if (options && options.pdfUA) {
      this.internal.pdfUA = {
        enabled: true,
        conformance: "A" // PDF/UA-1 conformance level
      };
    }
  }
  ```
- [ ] API-Methoden hinzufügen:

  ```javascript
  jsPDFAPI.enablePDFUA = function() {
    if (!this.internal.pdfUA) {
      this.internal.pdfUA = { enabled: true, conformance: "A" };
    }
    this.internal.pdfUA.enabled = true;
    return this;
  };

  jsPDFAPI.disablePDFUA = function() {
    if (this.internal.pdfUA) {
      this.internal.pdfUA.enabled = false;
    }
    return this;
  };

  jsPDFAPI.isPDFUAEnabled = function() {
    return this.internal.pdfUA && this.internal.pdfUA.enabled;
  };
  ```

- [ ] Test schreiben in `test/specs/pdfua.spec.js`
- [ ] Dokumentation in JSDoc

#### US-1.2: PDF/UA-Metadaten

**Datei:** `src/modules/xmp_metadata.js`

- [ ] XMP-Namespace für PDF/UA hinzufügen:
  ```javascript
  var pdfua_namespace = 'xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/"';
  ```
- [ ] PDF/UA-Kennzeichnung in XMP einfügen:
  ```javascript
  var pdfua_metadata =
    "<pdfuaid:part>1</pdfuaid:part><pdfuaid:conformance>A</pdfuaid:conformance>";
  ```
- [ ] Hook für automatische Aktivierung bei PDF/UA-Modus
- [ ] Dublin Core Metadata (dc:title) hinzufügen:
  ```javascript
  var dc_namespace = 'xmlns:dc="http://purl.org/dc/elements/1.1/"';
  var dc_title =
    '<dc:title><rdf:Alt><rdf:li xml:lang="x-default">' +
    this.internal.pdfUA.title +
    "</rdf:li></rdf:Alt></dc:title>";
  ```
- [ ] Tests für XMP-Generierung

#### US-1.3: DisplayDocTitle

**Dateien:** `src/modules/viewerpreferences.js`, `src/jspdf.js`

- [ ] Hook in PDF/UA-Aktivierung:
  ```javascript
  // In enablePDFUA():
  if (!this.internal.viewerpreferences) {
    this.viewerPreferences({ DisplayDocTitle: true });
  } else {
    this.viewerPreferences({ DisplayDocTitle: true });
  }
  ```
- [ ] Titel aus `setProperties()` übernehmen:
  ```javascript
  jsPDFAPI.setTitle = function(title) {
    this.setProperties({ title: title });
    if (this.isPDFUAEnabled()) {
      if (!this.internal.pdfUA.title) {
        this.internal.pdfUA.title = title;
      }
    }
    return this;
  };
  ```
- [ ] Validierung: Warnung wenn Titel fehlt
- [ ] Test: PDF mit/ohne Titel generieren

#### Integration & Testing:

- [ ] Test-App erweitern:
  ```javascript
  function generateSimplePDFUA() {
    const doc = new jsPDF({ pdfUA: true });
    doc.setTitle("Mein erstes PDF/UA-Dokument");
    doc.text("Hello PDF/UA!", 10, 10);
    doc.save("simple-pdfua.pdf");
  }
  ```
- [ ] PDF mit veraPDF validieren
- [ ] Erwartete Fehler: Fehlender Strukturbaum (wird in Sprint 2-3 behoben)

**Definition of Done:**

- [ ] PDF enthält PDF/UA-Kennzeichnung in XMP
- [ ] DisplayDocTitle ist auf true gesetzt
- [ ] dc:title ist in Metadaten
- [ ] Unit-Tests bestehen
- [ ] Test-App hat Button "Simple PDF/UA"

---

## Sprint 2: Strukturbaum Grundlagen (2 Wochen)

### Stories: US-2.1, US-2.2 (partial)

### Sprint-Ziel:

StructTreeRoot implementieren und erste Strukturelemente (Document, P, H1) unterstützen.

### Aufgaben:

#### Neue Datei: `src/modules/structure_tree.js`

- [ ] Plugin-Grundgerüst:

  ```javascript
  import { jsPDF } from "../jspdf.js";

  (function(jsPDFAPI) {
    "use strict";

    // Internal structure tree representation
    var initStructureTree = function() {
      if (!this.internal.structureTree) {
        this.internal.structureTree = {
          root: null,
          currentParent: null,
          elements: [],
          mcidCounter: {},
          nextStructId: 0
        };
      }
    };

    // ... more code
  })(jsPDF.API);
  ```

- [ ] StructTreeRoot erstellen:

  ```javascript
  var createStructTreeRoot = function() {
    var root = {
      type: "StructTreeRoot",
      id: this.internal.structureTree.nextStructId++,
      children: [],
      objectNumber: null
    };
    this.internal.structureTree.root = root;
    return root;
  };
  ```

- [ ] StructElem-Klasse:

  ```javascript
  function StructElement(type, parent) {
    this.type = type; // z.B. 'Document', 'P', 'H1'
    this.parent = parent;
    this.children = [];
    this.attributes = {};
    this.mcids = []; // Marked Content IDs
    this.objectNumber = null;
  }
  ```

- [ ] API-Methoden:

  ```javascript
  jsPDFAPI.beginStructureElement = function(type, attributes) {
    initStructureTree.call(this);

    var parent =
      this.internal.structureTree.currentParent ||
      this.internal.structureTree.root;

    var element = new StructElement(type, parent);
    element.attributes = attributes || {};
    element.id = this.internal.structureTree.nextStructId++;

    if (parent) {
      parent.children.push(element);
    }

    this.internal.structureTree.currentParent = element;
    this.internal.structureTree.elements.push(element);

    return this;
  };

  jsPDFAPI.endStructureElement = function() {
    if (this.internal.structureTree.currentParent) {
      this.internal.structureTree.currentParent = this.internal.structureTree.currentParent.parent;
    }
    return this;
  };
  ```

- [ ] PDF-Ausgabe (putStructTree bei finalize):

  ```javascript
  var writeStructTree = function() {
    if (!this.internal.structureTree || !this.internal.structureTree.root) {
      return;
    }

    var root = this.internal.structureTree.root;

    // Write all StructElems first
    this.internal.structureTree.elements.forEach(elem => {
      elem.objectNumber = this.internal.newObject();
      this.internal.write("<< /Type /StructElem");
      this.internal.write("/S /" + elem.type);

      if (elem.parent && elem.parent.objectNumber) {
        this.internal.write("/P " + elem.parent.objectNumber + " 0 R");
      }

      if (elem.children.length > 0) {
        var kids = elem.children.map(c => c.objectNumber + " 0 R").join(" ");
        this.internal.write("/K [" + kids + "]");
      }

      this.internal.write(">>");
      this.internal.write("endobj");
    });

    // Write StructTreeRoot
    root.objectNumber = this.internal.newObject();
    this.internal.write("<< /Type /StructTreeRoot");

    var rootKids = root.children.map(c => c.objectNumber + " 0 R").join(" ");
    this.internal.write("/K [" + rootKids + "]");

    this.internal.write(">>");
    this.internal.write("endobj");
  };

  // Hook into PDF generation
  this.internal.events.subscribe("postPutResources", writeStructTree);
  ```

- [ ] Catalog-Erweiterung:

  ```javascript
  var putCatalog = function() {
    if (this.internal.structureTree && this.internal.structureTree.root) {
      this.internal.write(
        "/StructTreeRoot " +
          this.internal.structureTree.root.objectNumber +
          " 0 R"
      );
    }
  };

  this.internal.events.subscribe("putCatalog", putCatalog);
  ```

#### US-2.2: Standard-Strukturelemente (Document, P, H1-H6)

- [ ] Helper-Methoden:

  ```javascript
  jsPDFAPI.beginDocument = function() {
    if (this.isPDFUAEnabled() && !this.internal.structureTree.root) {
      createStructTreeRoot.call(this);
      this.beginStructureElement("Document");
    }
    return this;
  };

  jsPDFAPI.endDocument = function() {
    if (this.isPDFUAEnabled()) {
      this.endStructureElement(); // End Document
    }
    return this;
  };

  jsPDFAPI.beginParagraph = function() {
    return this.beginStructureElement("P");
  };

  jsPDFAPI.endParagraph = function() {
    return this.endStructureElement();
  };
  ```

#### Integration in `src/index.js`:

```javascript
import "./modules/structure_tree.js";
```

#### Tests:

- [ ] Test: StructTreeRoot wird erstellt
- [ ] Test: Document-Element wird erstellt
- [ ] Test: Verschachtelte Elemente (Document > P)
- [ ] Test: Korrekte Parent-Child-Beziehungen

#### Test-App:

```javascript
function generateStructuredPDF() {
  const doc = new jsPDF({ pdfUA: true });
  doc.setTitle("Strukturiertes Dokument");

  doc.beginDocument();
  doc.beginParagraph();
  doc.text("Dies ist ein Absatz.", 10, 10);
  doc.endParagraph();
  doc.endDocument();

  doc.save("structured.pdf");
}
```

**Definition of Done:**

- [ ] StructTreeRoot ist im PDF vorhanden
- [ ] Document und P Elemente werden korrekt erstellt
- [ ] Parent-Child-Beziehungen sind korrekt
- [ ] veraPDF erkennt Strukturbaum (aber noch Fehler wegen fehlenden MCIDs)

---

## Sprint 3: Content Marking (3 Wochen)

### Stories: US-2.3, US-2.5

### Sprint-Ziel:

Content mit Strukturelementen verknüpfen (Marked Content mit MCID).

### Aufgaben:

#### MCID-System implementieren:

**In `src/modules/structure_tree.js`:**

- [ ] MCID-Counter pro Seite:

  ```javascript
  jsPDFAPI.getNextMCID = function() {
    var pageNumber = this.internal.getCurrentPageInfo().pageNumber;

    if (!this.internal.structureTree.mcidCounter[pageNumber]) {
      this.internal.structureTree.mcidCounter[pageNumber] = 0;
    }

    return this.internal.structureTree.mcidCounter[pageNumber]++;
  };
  ```

- [ ] MCID zu StructElem hinzufügen:

  ```javascript
  jsPDFAPI.addMCIDToCurrentStructure = function(mcid, pageNumber) {
    var current = this.internal.structureTree.currentParent;
    if (current) {
      current.mcids.push({ mcid: mcid, page: pageNumber });
    }
  };
  ```

- [ ] ParentTree erstellen:

  ```javascript
  var writeParentTree = function() {
    // Maps page MCIDs to structure elements
    var parentTree = {};

    this.internal.structureTree.elements.forEach(elem => {
      elem.mcids.forEach(mcidInfo => {
        if (!parentTree[mcidInfo.page]) {
          parentTree[mcidInfo.page] = {};
        }
        parentTree[mcidInfo.page][mcidInfo.mcid] = elem.objectNumber;
      });
    });

    // Write ParentTree as NumberTree
    var parentTreeObj = this.internal.newObject();
    this.internal.write("<< /Type /ParentTree");

    // Simplified: write as flat array
    var nums = [];
    for (var page in parentTree) {
      nums.push(page);
      var pageNums = [];
      for (var mcid in parentTree[page]) {
        pageNums.push(mcid + " " + parentTree[page][mcid] + " 0 R");
      }
      nums.push("[" + pageNums.join(" ") + "]");
    }

    this.internal.write("/Nums [" + nums.join(" ") + "]");
    this.internal.write(">>");
    this.internal.write("endobj");

    // Reference in StructTreeRoot
    this.internal.structureTree.parentTreeObj = parentTreeObj;
  };
  ```

- [ ] ParentTree in StructTreeRoot referenzieren:
  ```javascript
  // In writeStructTree():
  if (this.internal.structureTree.parentTreeObj) {
    this.internal.write(
      "/ParentTree " + this.internal.structureTree.parentTreeObj + " 0 R"
    );
  }
  ```

#### Content-Wrapping in Hauptmethoden:

**In `src/jspdf.js` - text() erweitern:**

- [ ] Marked Content für text():

  ```javascript
  // Irgendwo vor dem eigentlichen Text-Output im Content-Stream:
  if (this.isPDFUAEnabled() && this.internal.structureTree.currentParent) {
    var mcid = this.getNextMCID();
    var pageNumber = this.internal.getCurrentPageInfo().pageNumber;

    this.addMCIDToCurrentStructure(mcid, pageNumber);

    // In Content-Stream schreiben:
    this.internal.write("/P <</MCID " + mcid + ">> BDC");
  }

  // ... existing text rendering code ...

  if (this.isPDFUAEnabled() && this.internal.structureTree.currentParent) {
    this.internal.write("EMC");
  }
  ```

**Hinweis:** Der genaue Ort hängt davon ab, wo der Content-Stream geschrieben wird.
Dies erfordert gründliches Studium von `src/jspdf.js`.

**Alternative Ansatz - Content-Wrapper:**

- [ ] Generische Wrapper-Funktion:

  ```javascript
  jsPDFAPI.beginMarkedContent = function() {
    if (!this.isPDFUAEnabled() || !this.internal.structureTree.currentParent) {
      return this;
    }

    var mcid = this.getNextMCID();
    var pageNumber = this.internal.getCurrentPageInfo().pageNumber;
    this.addMCIDToCurrentStructure(mcid, pageNumber);

    this.internal.write("/P <</MCID " + mcid + ">> BDC");

    return this;
  };

  jsPDFAPI.endMarkedContent = function() {
    if (!this.isPDFUAEnabled()) {
      return this;
    }

    this.internal.write("EMC");
    return this;
  };
  ```

- [ ] Nutzung in User-Code:
  ```javascript
  doc.beginParagraph();
  doc.beginMarkedContent();
  doc.text("Hello", 10, 10);
  doc.endMarkedContent();
  doc.endParagraph();
  ```

#### Automatisches Marking (für US-10.1 Vorbereitung):

- [ ] Auto-Wrapper für text() (optional):

  ```javascript
  // Wrapper around original text function
  var originalText = jsPDFAPI.text;

  jsPDFAPI.text = function(text, x, y, options) {
    var autoMark =
      this.isPDFUAEnabled() && this.internal.pdfUA.autoMode !== false;

    if (autoMark && !this.internal.structureTree.currentParent) {
      this.beginParagraph();
    }

    if (autoMark) {
      this.beginMarkedContent();
    }

    var result = originalText.call(this, text, x, y, options);

    if (autoMark) {
      this.endMarkedContent();
    }

    if (autoMark && this.internal.pdfUA.autoCloseParagraph) {
      this.endParagraph();
    }

    return result;
  };
  ```

#### StructParent für Pages:

- [ ] Jede Seite braucht StructParent-Eintrag:

  ```javascript
  // In Page-Erstellung:
  var addStructParentToPage = function(pageNumber) {
    // Add /StructParents entry to page dictionary
    this.internal.write("/StructParents " + (pageNumber - 1));
  };

  this.internal.events.subscribe("putPage", addStructParentToPage);
  ```

#### Tests:

- [ ] Test: MCID wird generiert und inkrementiert
- [ ] Test: BDC/EMC im Content-Stream
- [ ] Test: ParentTree ist vorhanden
- [ ] Test: StructParents in Pages

#### Test-App:

```javascript
function generateMarkedContentPDF() {
  const doc = new jsPDF({ pdfUA: true });
  doc.setTitle("Marked Content Test");

  doc.beginDocument();
  doc.beginParagraph();
  doc.beginMarkedContent();
  doc.text("Erster Absatz", 10, 10);
  doc.endMarkedContent();
  doc.endParagraph();

  doc.beginParagraph();
  doc.beginMarkedContent();
  doc.text("Zweiter Absatz", 10, 20);
  doc.endMarkedContent();
  doc.endParagraph();
  doc.endDocument();

  doc.save("marked-content.pdf");
}
```

**Definition of Done:**

- [ ] Content ist mit MCID markiert
- [ ] ParentTree verbindet MCIDs mit StructElems
- [ ] veraPDF zeigt weniger Fehler (Struktur ist nun verbunden)

---

## Sprint 4: Bilder & Alternativtexte (2 Wochen)

### Stories: US-4.1, US-4.2, US-6.2

### Sprint-Ziel:

Bilder mit Alt-Text und Überschriften (H1-H6) unterstützen.

### Aufgaben:

#### US-4.1 & 4.2: Bilder mit Alt-Text

**In `src/modules/addimage.js`:**

- [ ] `addImage()` um Alt-Parameter erweitern:

  ```javascript
  // Bestehende Signatur erweitern:
  jsPDFAPI.addImage = function(
    imageData,
    format,
    x,
    y,
    width,
    height,
    alias,
    compression,
    rotation,
    pdfuaOptions // NEU
  ) {
    pdfuaOptions = pdfuaOptions || {};

    // Existing image code...

    if (this.isPDFUAEnabled()) {
      if (!pdfuaOptions.alt && !pdfuaOptions.artifact) {
        console.warn(
          'PDF/UA: Image without alt text. Use {alt: "..."} or {artifact: true}'
        );
      }

      if (pdfuaOptions.alt) {
        this.beginStructureElement("Figure", {
          Alt: pdfuaOptions.alt,
          BBox: [x, y, x + width, y + height]
        });

        this.beginMarkedContent();
      } else if (pdfuaOptions.artifact) {
        this.internal.write("/Artifact <</Type /Layout>> BDC");
      }
    }

    // ... render image ...

    if (this.isPDFUAEnabled()) {
      if (pdfuaOptions.alt) {
        this.endMarkedContent();
        this.endStructureElement(); // End Figure
      } else if (pdfuaOptions.artifact) {
        this.internal.write("EMC");
      }
    }

    return this;
  };
  ```

- [ ] BBox korrekt berechnen (PDF-Koordinaten):

  ```javascript
  // Note: Y-axis is bottom-up in PDF
  var pageHeight = this.internal.pageSize.getHeight();
  var bbox = [x, pageHeight - y - height, x + width, pageHeight - y];
  ```

- [ ] Alt-Attribut in StructElem schreiben:
  ```javascript
  // In writeStructTree():
  if (elem.attributes.Alt) {
    this.internal.write("/Alt (" + escapeString(elem.attributes.Alt) + ")");
  }
  if (elem.attributes.BBox) {
    this.internal.write("/BBox [" + elem.attributes.BBox.join(" ") + "]");
  }
  ```

#### US-6.2: Überschriften (H1-H6)

- [ ] Helper-Methoden in `structure_tree.js`:

  ```javascript
  jsPDFAPI.addHeading = function(text, level, x, y, options) {
    if (level < 1 || level > 6) {
      throw new Error("Heading level must be between 1 and 6");
    }

    if (this.isPDFUAEnabled()) {
      // Validierung: Ebenen dürfen nicht übersprungen werden
      var lastLevel = this.internal.pdfUA.lastHeadingLevel || 0;
      if (level > lastLevel + 1) {
        console.warn(
          "PDF/UA: Heading hierarchy violation. " +
            "Jumping from H" +
            lastLevel +
            " to H" +
            level
        );
      }
      this.internal.pdfUA.lastHeadingLevel = level;

      this.beginStructureElement("H" + level);
      this.beginMarkedContent();
    }

    this.text(text, x, y, options);

    if (this.isPDFUAEnabled()) {
      this.endMarkedContent();
      this.endStructureElement();
    }

    return this;
  };
  ```

#### Tests:

- [ ] Test: Bild mit Alt-Text erzeugt Figure-Element
- [ ] Test: Alt-Text ist im StructElem
- [ ] Test: BBox ist korrekt
- [ ] Test: Warnung bei fehlendem Alt-Text
- [ ] Test: H1-H6 Elemente werden erstellt
- [ ] Test: Warnung bei Hierarchie-Verletzung

#### Test-App:

```javascript
function generateImageAndHeadingsPDF() {
  const doc = new jsPDF({ pdfUA: true });
  doc.setTitle("Bilder und Überschriften");

  doc.beginDocument();
  doc.addHeading("Hauptüberschrift", 1, 10, 10);

  doc.addHeading("Unterüberschrift", 2, 10, 20);

  doc.beginParagraph();
  doc.beginMarkedContent();
  doc.text("Ein Absatz mit einem Bild:", 10, 30);
  doc.endMarkedContent();
  doc.endParagraph();

  // Beispielbild (1x1 Pixel PNG Base64)
  const imgData =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  doc.addImage(
    imgData,
    "PNG",
    10,
    40,
    50,
    50,
    undefined,
    undefined,
    undefined,
    {
      alt: "Ein rotes Quadrat"
    }
  );
  doc.endDocument();

  doc.save("images-headings.pdf");
}
```

**Definition of Done:**

- [ ] Bilder mit Alt-Text werden als Figure getaggt
- [ ] Überschriften H1-H6 funktionieren
- [ ] veraPDF-Validierung für diese Features erfolgreich

---

## Sprint 5: Unicode & Dokumentation MVP (2 Wochen)

### Stories: US-3.1, US-9.1, US-8.1 (finalisieren)

### Sprint-Ziel:

Unicode-Mapping sicherstellen, Dokumentation schreiben, Test-App vervollständigen.

### Aufgaben:

#### US-3.1: Unicode-Mapping

**Analyse:**

- [ ] Überprüfe bestehende ToUnicode-Implementierung in jsPDF
- [ ] Teste Standard-Fonts (Helvetica, Times, Courier)
- [ ] Teste TrueType-Fonts

**Falls nötig:**

- [ ] ToUnicode CMap für Standard-Fonts generieren
- [ ] Validierung einbauen

**Test:**

- [ ] Erstelle PDF mit verschiedenen Schriften
- [ ] Validiere mit veraPDF
- [ ] Text-Extraktion testen

#### US-9.1: API-Dokumentation

**Neue Datei:** `docs/pdfua-guide.md`

Inhalte:

- [ ] Was ist PDF/UA?
- [ ] Warum ist Barrierefreiheit wichtig?
- [ ] Aktivierung: `new jsPDF({ pdfUA: true })`
- [ ] Strukturelemente: Document, H1-H6, P, Figure
- [ ] Marked Content: `beginMarkedContent()` / `endMarkedContent()`
- [ ] Bilder: Alt-Texte setzen
- [ ] Best Practices
- [ ] Häufige Fehler vermeiden
- [ ] Validierung mit veraPDF

**JSDoc:**

- [ ] Alle neuen API-Methoden dokumentieren
- [ ] Beispiele in JSDoc
- [ ] Parameter-Beschreibungen
- [ ] Return-Values

#### US-8.1: Test-App finalisieren

**Datei:** `examples/pdfua-test-app.html`

Features:

- [ ] Professionelles UI (Bootstrap oder ähnlich)
- [ ] Buttons für verschiedene Test-Cases:
  - Simple Text
  - Headings Hierarchy
  - Image with Alt
  - Multiple Paragraphs
  - Complex Document
- [ ] Code-Anzeige für jeden Test-Case
- [ ] Live-Preview (PDF.js einbinden)
- [ ] Download-Funktion
- [ ] Link zu veraPDF-Validierung

**Beispiel-HTML-Struktur:**

```html
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <title>jsPDF PDF/UA Test Application</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css"
    />
  </head>
  <body>
    <div class="container mt-5">
      <h1>jsPDF PDF/UA Test Application</h1>

      <div class="row mt-4">
        <div class="col-md-4">
          <h3>Test Cases</h3>
          <div class="list-group">
            <button class="list-group-item" onclick="test1()">
              1. Simple Text Document
            </button>
            <button class="list-group-item" onclick="test2()">
              2. Headings Hierarchy
            </button>
            <!-- ... more tests ... -->
          </div>
        </div>

        <div class="col-md-8">
          <h3>Code</h3>
          <pre><code id="code-display">// Click a test case to see code</code></pre>

          <h3>Actions</h3>
          <button class="btn btn-primary" onclick="generatePDF()">
            Generate PDF
          </button>
          <button class="btn btn-secondary" onclick="validatePDF()">
            Validate with veraPDF
          </button>
        </div>
      </div>
    </div>

    <script src="../dist/jspdf.umd.js"></script>
    <script src="pdfua-test-app.js"></script>
  </body>
</html>
```

**JavaScript-Datei:** `examples/pdfua-test-app.js`

```javascript
const testCases = {
  simple: {
    name: "Simple Text Document",
    code: `const doc = new jsPDF({ pdfUA: true });
doc.setTitle('Simple Document');

doc.beginDocument();
  doc.beginParagraph();
    doc.beginMarkedContent();
      doc.text('Hello PDF/UA!', 10, 10);
    doc.endMarkedContent();
  doc.endParagraph();
doc.endDocument();

doc.save('simple.pdf');`,

    generate: function() {
      const doc = new jsPDF({ pdfUA: true });
      doc.setTitle("Simple Document");

      doc.beginDocument();
      doc.beginParagraph();
      doc.beginMarkedContent();
      doc.text("Hello PDF/UA!", 10, 10);
      doc.endMarkedContent();
      doc.endParagraph();
      doc.endDocument();

      return doc;
    }
  }

  // ... more test cases
};

function showTest(testName) {
  const test = testCases[testName];
  document.getElementById("code-display").textContent = test.code;
  currentTest = test;
}

function generatePDF() {
  if (!currentTest) {
    alert("Please select a test case first");
    return;
  }

  const doc = currentTest.generate();
  doc.save(currentTest.name.replace(/ /g, "-").toLowerCase() + ".pdf");
}
```

#### Tests:

- [ ] Test-App lädt ohne Fehler
- [ ] Alle Buttons funktionieren
- [ ] PDFs werden korrekt generiert

**Definition of Done:**

- [ ] Unicode-Mapping ist für Standard-Fonts korrekt
- [ ] Dokumentation ist vollständig
- [ ] Test-App ist funktional und benutzerfreundlich
- [ ] Alle bisherigen Features funktionieren zusammen

---

## Sprint 6: Integration, Bugfixing & MVP-Release (2 Wochen)

### Ziel: MVP-Release vorbereiten

### Aufgaben:

#### Integration & Testing:

- [ ] Alle Features zusammen testen
- [ ] veraPDF-Validierung für alle Test-Cases
- [ ] Performance-Tests (große Dokumente)
- [ ] Browser-Kompatibilität (Chrome, Firefox, Safari, Edge)
- [ ] Node.js-Kompatibilität

#### Bugfixing:

- [ ] Alle gefundenen Bugs beheben
- [ ] Edge-Cases behandeln
- [ ] Fehlerbehandlung verbessern
- [ ] Warnungen verfeinern

#### Dokumentation finalisieren:

- [ ] README.md aktualisieren
- [ ] CHANGELOG.md erstellen
- [ ] Migration-Guide für bestehende Nutzer
- [ ] API-Reference generieren: `npm run generate-docs`

#### Release-Vorbereitung:

- [ ] Version-Nummer festlegen (z.B. 3.1.0)
- [ ] Git-Tag erstellen
- [ ] Release Notes schreiben
- [ ] Demo-Video aufnehmen (optional)

**Definition of Done:**

- [ ] Mindestens 2 komplexe Beispiel-PDFs bestehen vollständige veraPDF-Validierung
- [ ] Alle Unit-Tests grün
- [ ] Dokumentation vollständig
- [ ] Code-Review abgeschlossen
- [ ] Performance-Overhead < 20%
- [ ] Keine Breaking Changes (außer dokumentiert)

---

## Zusammenfassung MVP (Phase 1)

**Gesamt-Dauer:** 13 Wochen (ca. 3 Monate)

**Liefergegenstände:**

1. PDF/UA-Modus in jsPDF aktivierbar
2. Strukturbaum mit Document, P, H1-H6, Figure
3. Marked Content (MCID) für Text und Bilder
4. Alt-Texte für Bilder
5. PDF/UA-Metadaten (XMP)
6. DisplayDocTitle
7. Unicode-Mapping
8. Vollständige Dokumentation
9. Funktionale Test-Anwendung
10. veraPDF-validierte Beispiel-PDFs

**Danach:**

- Phase 2: Tabellen, Listen, erweiterte Features
- Phase 3: Formulare, vollständige Konformität
- Phase 4: Optimierungen

---

## Ressourcen pro Sprint

**Entwickler:** 1-2 Vollzeit
**Story Points Velocity:** ~15-20 pro 2-Wochen-Sprint
**Code Review:** Wöchentlich
**Testing:** Kontinuierlich mit veraPDF

## Risiko-Management

**Hohe Risiken:**

1. **PDF-Spec-Komplexität:** Regelmäßiges Studium der Spec einplanen
2. **Bestehender Code:** Vorsichtiges Refactoring, viele Tests
3. **Browser-Unterschiede:** Cross-Browser-Tests von Anfang an

**Mitigation:**

- Spike-Stories für komplexe Bereiche
- Pair Programming für kritische Teile
- Frühe veraPDF-Validierung
