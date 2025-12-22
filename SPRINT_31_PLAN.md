# Sprint 31: Footnote API Enhancement & Showcase Fixes

**Status: COMPLETED**
**Datum: 2025-12-16**

## Hauptziel

Automatische Lbl-Element-Generierung in der Fußnoten-API, um fehlerhafte manuelle Strukturierung zu vermeiden. Anschließend Korrektur des Showcase-Dokuments mit der verbesserten API.

---

## Problembericht-Analyse

### 1. Fehlender Content "1. Introduction"

**Problem:** Das TOC enthält einen Eintrag "1. Introduction", aber es gibt keine entsprechende Sektion im Dokument.

- Zeile 56: `doc.outline.add(null, '1. Introduction', { pageNumber: 1 });`
- Zeile 106: `{ title: '1. Introduction', page: 1 }`
- Der tatsächliche Inhalt auf Seite 1 ist nur der H1-Titel "PDF/UA Complete Feature Showcase", ein Einleitungsabsatz und das TOC, gefolgt von "2. Text Elements" (bei Y=180).

**Lösung:** Eine echte "1. Introduction"-Sektion mit H2-Überschrift zwischen TOC und "2. Text Elements" hinzufügen, oder den TOC/Bookmark-Eintrag anpassen.

### 2. Überlappender Text am Index-Ende

**Problem:** "End of PDF/UA Complete Showcase Document" (Y=275) überlappt visuell mit dem letzten Index-Eintrag.

- Index beginnt bei Y=145 mit 17 Einträgen (je 8pt Abstand)
- Letzter Index-Eintrag: Y = 145 + 16\*8 = 273
- Abschlusstext bei Y=275 → nur 2pt Abstand

**Lösung:** Y-Position des Abschlusstextes anpassen oder Index Y-Position/Abstand optimieren.

### 3. Fußnoten-Struktur nicht PDF/UA-konform

**Probleme im aktuellen Code (Zeilen 554-584):**

a) **Reference ohne Lbl-Element:**

```javascript
// Aktuell (falsch):
doc.beginReference();
doc.text("¹", 150, 38);
doc.endReference();

// Korrekt wäre:
doc.beginReference();
doc.beginStructureElement("Lbl");
doc.text("¹", 150, 38);
doc.endStructureElement();
doc.endReference();
```

b) **Note ohne Lbl-Element:**

```javascript
// Aktuell (falsch):
doc.beginNote();
doc.text("¹ ISO 14289-1...", 20, 80);
doc.endNote();

// Korrekt wäre:
doc.beginNote();
doc.beginStructureElement("Lbl");
doc.text("¹", 20, 80);
doc.endStructureElement();
doc.beginStructureElement("P");
doc.text("ISO 14289-1...", 25, 80);
doc.endStructureElement();
doc.endNote();
```

c) **Separierte Absätze statt einem Absatz mit inline References:**

```javascript
// Aktuell (falsch) - 3 separate P-Elemente:
doc.beginStructureElement('P');
doc.text('PDF/UA (Universal Accessibility) is an ISO standard', 20, 40);
doc.beginReference();
doc.text('¹', 150, 38);
doc.endReference();
doc.text(' that ensures PDFs', 152, 40);
doc.endStructureElement();

doc.beginStructureElement('P');
doc.text('can be read by assistive technologies...', 20, 50);
doc.beginReference();
doc.text('²', 168, 48);
doc.endReference();
...
doc.endStructureElement();

// Korrekt wäre EIN einziger Absatz:
doc.beginStructureElement('P');
doc.text('PDF/UA (Universal Accessibility) is an ISO standard', 20, 40);
doc.beginReference();
  doc.beginStructureElement('Lbl');
  doc.text('¹', x, y);  // Ohne Abstand zum Wort
  doc.endStructureElement();
doc.endReference();
doc.text(' that ensures PDFs can be read by assistive technologies. The Matterhorn Protocol', ...);
doc.beginReference();
  doc.beginStructureElement('Lbl');
  doc.text('²', x, y);
  doc.endStructureElement();
doc.endReference();
doc.text(' provides validation checkpoints for PDF/UA compliance.', ...);
doc.endStructureElement();
```

d) **Zu viel Abstand vor Reference-Elementen:**

- Der Fußnotenzeichen sollte direkt am Wort kleben (kein zusätzlicher Whitespace)

e) **Fußnotentext-Position:**

- Aktuell bei Y=80 (nach dem Absatz)
- Sollte am Seitenende sein (typischerweise Y=250-270 mit Trennlinie)

### 4. Span "Fußnote" (Screen Reader Announcement)

**Status:** Das automatische Announcement-Feature in `beginNote()` fügt versteckt "Fußnote: " oder "Footnote: " hinzu (Zeilen 1509-1532). Die Reihenfolge ist korrekt (erscheint vor dem Lbl/Content).

### 5. Potenzielle API-Verbesserungen (Future Sprints)

- Reference > Lbl auf Note > Lbl verlinken (bidirektionale Navigation)
- Bei Tabellen: Fußnoten im Tabellenfooter (TFoot-Element)
- Mehrere Reference-Elemente auf eine Note (z.B. in Tabellen)

---

## Sprint-Aufgaben

### Priorität 1: API-Erweiterung für automatische Lbl-Generierung

#### Task 1.1: `beginReference({ label })` erweitern

**Datei:** `src/modules/structure_tree.js`

Erweitere `beginReference()` um automatische Lbl-Erstellung:

```javascript
/**
 * @param {Object} [options]
 * @param {string} [options.label] - Label text (z.B. '¹'). Wenn angegeben, wird
 *                                   automatisch ein Lbl-Element erstellt.
 * @param {number} [options.labelX] - X-Position für das Label
 * @param {number} [options.labelY] - Y-Position für das Label
 * @param {string} [options.noteId] - ID der zugehörigen Note
 */
jsPDFAPI.beginReference = function(options) {
  options = options || {};

  this.beginStructureElement("Reference");

  // Automatisches Lbl wenn label angegeben
  if (
    options.label &&
    options.labelX !== undefined &&
    options.labelY !== undefined
  ) {
    this.beginStructureElement("Lbl");
    var originalFontSize = this.getFontSize();
    this.setFontSize(8); // Hochgestellt
    this.text(options.label, options.labelX, options.labelY);
    this.setFontSize(originalFontSize);
    this.endStructureElement(); // /Lbl
  }

  return this;
};
```

#### Task 1.2: `beginNote({ label })` erweitern

**Datei:** `src/modules/structure_tree.js`

Erweitere `beginNote()` um automatische Lbl-Erstellung und P-Öffnung:

```javascript
/**
 * @param {Object} [options]
 * @param {string} [options.id] - Unique ID (required for PDF/UA)
 * @param {string} [options.label] - Label text (z.B. '¹'). Wenn angegeben, wird
 *                                   automatisch Lbl erstellt und P geöffnet.
 * @param {number} [options.labelX] - X-Position für das Label
 * @param {number} [options.labelY] - Y-Position für das Label
 */
jsPDFAPI.beginNote = function(options) {
  options = options || {};

  this.beginStructureElement("Note", { id: options.id });

  // Screen Reader Announcement (bestehende Logik)
  // ...

  // Automatisches Lbl + P öffnen wenn label angegeben
  if (options.label) {
    this.beginStructureElement("Lbl");
    var originalFontSize = this.getFontSize();
    this.setFontSize(8);
    this.text(options.label, options.labelX || 20, options.labelY || 0);
    this.setFontSize(originalFontSize);
    this.endStructureElement(); // /Lbl

    // P automatisch öffnen für den Fußnotentext
    this.beginStructureElement("P");
    this.internal.pdfuaNoteAutoP = true; // Merken für endNote()
  }

  return this;
};

jsPDFAPI.endNote = function() {
  // Automatisch P schließen wenn es geöffnet wurde
  if (this.internal.pdfuaNoteAutoP) {
    this.endStructureElement(); // /P
    this.internal.pdfuaNoteAutoP = false;
  }
  return this.endStructureElement(); // /Note
};
```

#### Task 1.3: Convenience-Methode `addFootnoteRef()` implementieren

**Datei:** `src/modules/structure_tree.js`

All-in-one Methode für Fußnotenreferenz im Fließtext:

```javascript
/**
 * Fügt eine Fußnotenreferenz (hochgestellte Nummer) ein
 * Erstellt automatisch: Reference > Lbl > text
 *
 * @param {string} label - Das Label (z.B. '¹', '²', '*')
 * @param {number} x - X-Position
 * @param {number} y - Y-Position (leicht erhöht für Hochstellung)
 * @param {Object} [options]
 * @param {string} [options.noteId] - ID der zugehörigen Note für Verlinkung
 * @returns {jsPDF}
 */
jsPDFAPI.addFootnoteRef = function(label, x, y, options) {
  options = options || {};

  this.beginReference({ noteId: options.noteId });
  this.beginStructureElement("Lbl");
  var originalFontSize = this.getFontSize();
  this.setFontSize(originalFontSize * 0.7); // 70% für Hochstellung
  this.text(label, x, y - 2); // Leicht nach oben versetzt
  this.setFontSize(originalFontSize);
  this.endStructureElement();
  this.endReference();

  return this;
};
```

#### Task 1.4: Convenience-Methode `addFootnote()` implementieren

**Datei:** `src/modules/structure_tree.js`

All-in-one Methode für Fußnotentext:

```javascript
/**
 * Fügt eine komplette Fußnote ein (Label + Text)
 * Erstellt automatisch: Note > [SR-Announcement] > Lbl > P > text
 *
 * @param {Object} options
 * @param {string} options.id - Unique ID für die Note
 * @param {string} options.label - Das Label (z.B. '¹')
 * @param {string|string[]} options.text - Der Fußnotentext (String oder Array für mehrzeilige)
 * @param {number} options.x - X-Position für den Text
 * @param {number} options.y - Y-Position
 * @param {number} [options.labelX] - X-Position für Label (default: x - 5)
 * @param {number} [options.lineHeight] - Zeilenabstand für mehrzeilige Texte (default: 8)
 * @returns {jsPDF}
 */
jsPDFAPI.addFootnote = function(options) {
  var labelX = options.labelX !== undefined ? options.labelX : options.x - 5;
  var textArray = Array.isArray(options.text) ? options.text : [options.text];
  var lineHeight = options.lineHeight || 8;

  this.beginNote({ id: options.id });

  // Lbl Element
  this.beginStructureElement("Lbl");
  var originalFontSize = this.getFontSize();
  this.setFontSize(originalFontSize * 0.8);
  this.text(options.label, labelX, options.y);
  this.setFontSize(originalFontSize);
  this.endStructureElement();

  // P Element mit Text
  this.beginStructureElement("P");
  var currentY = options.y;
  for (var i = 0; i < textArray.length; i++) {
    this.text(textArray[i], options.x, currentY);
    currentY += lineHeight;
  }
  this.endStructureElement();

  this.endNote();

  return this;
};
```

### Priorität 2: Showcase-Dokument korrigieren

#### Task 2.1: Section "1. Introduction" hinzufügen

**Datei:** `tests/pdfua/showcase-pdfua-complete.js`

- Nach dem TOC (Zeile 133) und vor "2. Text Elements" (Zeile 136) eine echte Introduction-Section einfügen
- Mit H2-Überschrift "1. Introduction" und einleitendem Text
- Den bestehenden Einleitungstext (Zeilen 90-95) in diese Section verschieben

#### Task 2.2: Überlappenden Text am Ende korrigieren

**Datei:** `tests/pdfua/showcase-pdfua-complete.js`

- Y-Position des Abschlusstextes (Zeile 961) anpassen
- Alternativ: Index kompakter gestalten oder auf Y=135 beginnen

#### Task 2.3: Fußnoten-Sektion mit neuer API korrigieren

**Datei:** `tests/pdfua/showcase-pdfua-complete.js` (Zeilen 546-585)

Mit der neuen API wird der Code deutlich einfacher:

```javascript
// --- Section 8: Footnotes ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.text("8. Footnotes and References", 20, 25);
doc.endStructureElement();

// Ein einziger Absatz mit inline-References
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");

var x = 20;
doc.text("PDF/UA (Universal Accessibility) is an ISO standard", x, 40);
x += doc.getTextWidth("PDF/UA (Universal Accessibility) is an ISO standard");

// Fußnotenreferenz ¹ - direkt am Wort
doc.addFootnoteRef("¹", x, 40, { noteId: "fn1" });
x += 4;

doc.text(" that ensures PDFs can be read by assistive technologies.", x, 40);
// ... Fortsetzung auf nächster Zeile ...

x = 20;
doc.text("The Matterhorn Protocol", x, 50);
x += doc.getTextWidth("The Matterhorn Protocol");

// Fußnotenreferenz ² - direkt am Wort
doc.addFootnoteRef("²", x, 50, { noteId: "fn2" });
x += 4;

doc.text(" provides validation checkpoints for PDF/UA compliance.", x, 50);
doc.endStructureElement();

// Trennlinie als Artifact
doc.beginArtifact({ type: "Layout" });
doc.line(20, 250, 100, 250);
doc.endArtifact();

// Fußnoten am Seitenende mit der neuen API
doc.setFontSize(9);

doc.addFootnote({
  id: "fn1",
  label: "¹",
  text:
    "ISO 14289-1:2014, Document management — Electronic document file format enhancement for accessibility",
  x: 25,
  y: 258,
  labelX: 20
});

doc.addFootnote({
  id: "fn2",
  label: "²",
  text: "PDF Association, Matterhorn Protocol 1.1",
  x: 25,
  y: 270,
  labelX: 20
});

doc.setFontSize(11);
doc.endSect();
```

### Priorität 3: Test-Suite & Dokumentation

#### Task 3.1: Test-Suite für neue Fußnoten-API erstellen

**Datei:** `tests/pdfua/test-suite-note.js` (erweitern)

- Tests für `addFootnoteRef()` und `addFootnote()`
- Tests für automatisches Lbl in `beginReference({ label })`
- Tests für automatisches Lbl + P in `beginNote({ label })`
- Rückwärtskompatibilitäts-Tests (alte API ohne label)

#### Task 3.2: Best Practices dokumentieren

- Korrekte Struktur-Hierarchie: `P > Reference > Lbl` und `Note > Lbl + P`
- Neue API-Methoden dokumentieren
- Beispiele für verschiedene Use Cases

---

## Implementierungsdetails

### Korrekte Fußnoten-Struktur nach PDF/UA

```
Document
└── Sect
    ├── H2: "8. Footnotes and References"
    ├── P
    │   ├── [Text] "PDF/UA (Universal Accessibility) is an ISO standard"
    │   ├── Reference
    │   │   └── Lbl: "¹"
    │   ├── [Text] " that ensures PDFs can be read by..."
    │   ├── Reference
    │   │   └── Lbl: "²"
    │   └── [Text] " provides validation checkpoints..."
    │
    ├── [Artifact: Trennlinie]
    │
    ├── Note (id="fn1")
    │   ├── [SR-only Span: "Fußnote: "]  ← automatisch von beginNote()
    │   ├── Lbl: "¹"
    │   └── P: "ISO 14289-1:2014, Document management..."
    │
    └── Note (id="fn2")
        ├── [SR-only Span: "Fußnote: "]
        ├── Lbl: "²"
        └── P: "PDF Association, Matterhorn Protocol 1.1"
```

### Y-Koordinaten auf Seite 4 (nach Korrektur)

| Element                  | Y-Position |
| ------------------------ | ---------- |
| Header Artifact          | 10         |
| H2 "8. Footnotes..."     | 25         |
| Fließtext-Absatz         | 40-60      |
| ... weiterer Content ... | ...        |
| Trennlinie (Artifact)    | 250        |
| Note 1 (Lbl + Text)      | 260        |
| Note 2 (Lbl + Text)      | 272        |
| Footer Artifact          | 285        |

---

## Akzeptanzkriterien

### API-Erweiterung

1. [ ] `beginReference({ label, labelX, labelY })` erstellt automatisch Lbl-Element
2. [ ] `beginNote({ label, labelX, labelY })` erstellt automatisch Lbl + öffnet P
3. [ ] `endNote()` schließt automatisch P wenn es geöffnet wurde
4. [ ] `addFootnoteRef(label, x, y, options)` erstellt komplette Reference-Struktur
5. [ ] `addFootnote(options)` erstellt komplette Note-Struktur
6. [ ] Rückwärtskompatibilität: Alte API ohne label funktioniert weiterhin

### Showcase-Dokument

7. [ ] "1. Introduction" ist als echte Sektion mit Inhalt vorhanden
8. [ ] Kein visueller Überlapp zwischen Index und Abschlusstext
9. [ ] Fußnoten-Section nutzt neue API:
   - [ ] Ein Absatz mit zwei inline-References
   - [ ] Lbl-Elemente automatisch generiert
   - [ ] Fußnotenziffern ohne Whitespace zum Wort
   - [ ] Fußnoten am Seitenende mit Trennlinie

### Validierung

10. [ ] veraPDF-Validierung erfolgreich (ua1)
11. [ ] Screen Reader liest Fußnoten korrekt vor
12. [ ] Alle bestehenden Tests laufen weiterhin durch

---

## veraPDF-Validierung

```bash
docker run --rm -v "$(pwd)/examples/temp:/data" verapdf/cli --flavour ua1 /data/pdfua-complete-showcase.pdf
```

---

## Offene Fragen / Future Work

1. **Bidirektionale Links:** Soll Reference > Lbl auf Note > Lbl verlinken und umgekehrt?

   - Derzeit nur Forward-Link (Reference → Note)
   - Komplexer bei mehreren References auf eine Note

2. **Tabellen-Fußnoten:** Wie sollen Fußnoten in Tabellen behandelt werden?

   - Im TFoot der Tabelle?
   - Oder am Seitenende wie normale Fußnoten?

3. **Mehrfach-Referenzen:** Was wenn eine Note mehrere References hat?
   - Beispiel: "Details¹" und "Siehe auch¹" verweisen auf dieselbe Note
