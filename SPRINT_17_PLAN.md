# Sprint 17: Note und Reference für Fuß-/Endnoten

**Ziel:** PDF/UA-konforme Fußnoten- und Endnoten-Strukturelemente für Screenreader

**Datum:** 2025-12-06

**Status:** ✅ COMPLETED

---

## Überblick

PDF unterstützt zwei zusammenhängende Strukturelemente für Fußnoten/Endnoten:

1. **Reference** - Die Referenz im Fließtext (z.B. hochgestellte Zahl "¹")

   - Markiert den Verweis auf eine Fußnote
   - Enthält typischerweise ein Lbl-Element

2. **Note** - Der Fußnotentext selbst
   - Enthält den eigentlichen Fußnoteninhalt
   - Hat Lbl (Nummer) und P/Span (Text) als Kinder

### Unterschied zu anderen Elementen

| Element       | Zweck                | Typische Kinder |
| ------------- | -------------------- | --------------- |
| **Reference** | Verweis im Fließtext | Lbl             |
| **Note**      | Fußnoteninhalt       | Lbl, P, Span    |
| **Link**      | Hyperlink            | Text            |

### Beispiel

```
Im Text steht ein Verweis¹ auf eine Fußnote.
                        ↑ Reference mit Lbl

---
¹ Dies ist der Fußnotentext.
↑ Note mit Lbl und Span/P
```

---

## PDF/UA Anforderungen

### Aus der PDF-Referenz (ISO 32000-1) und PDF/UA:

> **Reference** (Inline-level structure element) - A citation to content
> elsewhere in the document.

> **Note** (Block-level structure element) - An item of explanatory text,
> such as a footnote or endnote, that is referred to from within the body
> of the document.

### PDF/UA-1 Anforderungen:

- Note-Element MUSS eine eindeutige ID haben
- Lbl-Element ist erforderlich innerhalb von Note
- Reference zeigt auf den zugehörigen Note-Inhalt

### Struktur-Hierarchie:

```
P (Absatz)
├── "Im Text steht ein Verweis"
├── Reference
│   └── Lbl ("¹")
└── "auf eine Fußnote."

Note
├── Lbl ("¹")
└── P oder Span ("Dies ist der Fußnotentext.")
```

---

## API Design

### Reference (Verweis im Fließtext)

```javascript
/**
 * Begin a Reference element (citation to footnote/endnote)
 * For the superscript number or symbol in the main text
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.id] - Unique ID to link to corresponding Note
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginReference(options);

/**
 * End a Reference element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endReference();
```

### Note (Fußnoteninhalt)

```javascript
/**
 * Begin a Note element (footnote/endnote content)
 * For the actual footnote text at the bottom of the page or end of document
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.id] - Unique ID (required for PDF/UA)
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginNote(options);

/**
 * End a Note element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endNote();
```

### Verwendungsbeispiele

#### Einfache Fußnote

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setLanguage("de-DE");

doc.beginStructureElement("Document");
// Haupttext mit Fußnotenverweis
doc.beginStructureElement("P");
doc.text("Dies ist ein wichtiger Satz", 10, 20);

// Fußnotenverweis (hochgestellt)
doc.beginReference();
doc.beginStructureElement("Lbl");
doc.setFontSize(8);
doc.text("1", 75, 17); // hochgestellt
doc.setFontSize(12);
doc.endStructureElement();
doc.endReference();

doc.text(" mit weiteren Informationen.", 78, 20);
doc.endStructureElement();

// Fußnote am Seitenende
doc.beginNote({ id: "fn1" });
doc.beginStructureElement("Lbl");
doc.setFontSize(8);
doc.text("1", 10, 280);
doc.setFontSize(10);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.text("Hier steht die Erklärung zur Fußnote.", 15, 280);
doc.endStructureElement();
doc.endNote();
doc.endStructureElement();
```

#### Mehrere Fußnoten

```javascript
doc.beginStructureElement("P");
doc.text("Erster Verweis", 10, 20);
doc.beginReference();
doc.beginStructureElement("Lbl");
doc.text("1", x, 17);
doc.endStructureElement();
doc.endReference();

doc.text(" und zweiter Verweis", x, 20);
doc.beginReference();
doc.beginStructureElement("Lbl");
doc.text("2", x, 17);
doc.endStructureElement();
doc.endReference();

doc.text(".", x, 20);
doc.endStructureElement();

// Fußnoten
doc.beginNote({ id: "fn1" });
// ... Fußnote 1
doc.endNote();

doc.beginNote({ id: "fn2" });
// ... Fußnote 2
doc.endNote();
```

---

## Implementierung

### In structure_tree.js

```javascript
/**
 * Begin a Reference element (citation to footnote/endnote)
 * For the superscript number or symbol in the main text that
 * refers to a footnote or endnote.
 *
 * Use Reference for:
 * - Footnote numbers in running text
 * - Endnote references
 * - Cross-references to notes
 *
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.id] - Unique ID to link to corresponding Note
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginReference = function(options) {
  options = options || {};
  var attributes = {};

  if (options.id) {
    attributes.id = options.id;
  }

  return this.beginStructureElement("Reference", attributes);
};

/**
 * End a Reference element
 * Convenience method for doc.endStructureElement()
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endReference = function() {
  return this.endStructureElement();
};

/**
 * Begin a Note element (footnote/endnote content)
 * For the actual footnote or endnote text.
 *
 * Use Note for:
 * - Footnotes at the bottom of the page
 * - Endnotes at the end of a chapter or document
 * - Explanatory notes referenced from the main text
 *
 * PDF/UA requires:
 * - Each Note must have a unique ID
 * - Note must contain Lbl (label) element
 *
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.id] - Unique ID (required for PDF/UA compliance)
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginNote = function(options) {
  options = options || {};
  var attributes = {};

  if (options.id) {
    attributes.id = options.id;
  }

  return this.beginStructureElement("Note", attributes);
};

/**
 * End a Note element
 * Convenience method for doc.endStructureElement()
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endNote = function() {
  return this.endStructureElement();
};
```

---

## Test-Suite

### Test 1: Einfache Fußnote

```javascript
doc.beginStructureElement("P");
doc.text("Ein Satz mit Fußnote", 10, 40);

doc.beginReference();
doc.beginStructureElement("Lbl");
doc.setFontSize(8);
doc.text("1", 62, 37);
doc.setFontSize(12);
doc.endStructureElement();
doc.endReference();

doc.text(".", 65, 40);
doc.endStructureElement();

// Fußnote
doc.beginNote({ id: "fn1" });
doc.beginStructureElement("Lbl");
doc.text("1", 10, 280);
doc.endStructureElement();
doc.beginStructureElement("P");
doc.text("Dies ist die Fußnote.", 15, 280);
doc.endStructureElement();
doc.endNote();
```

### Test 2: Mehrere Fußnoten

```javascript
// Text mit zwei Verweisen
// Zwei Note-Elemente am Seitenende
```

### Test 3: Fußnote mit langem Text

```javascript
// Fußnote die über mehrere Zeilen geht
doc.beginNote({ id: "fn1" });
doc.beginStructureElement("Lbl");
doc.text("1", 10, 260);
doc.endStructureElement();
doc.beginStructureElement("P");
doc.text("Dies ist eine längere Fußnote, die über", 15, 260);
doc.text("mehrere Zeilen geht und mehr Erklärungen", 15, 268);
doc.text("enthält als üblich.", 15, 276);
doc.endStructureElement();
doc.endNote();
```

### Test 4: Endnoten (am Dokumentende)

```javascript
// Seite 1: Text mit Verweisen
// Seite 2: Alle Endnoten gesammelt
```

### Test 5: Deutsche Sprache

```javascript
doc.setLanguage("de-DE");
// Fußnoten mit deutschen Umlauten
```

---

## Screenreader-Verhalten

### Erwartet:

**Reference (Verweis):**

- Screenreader kündigt "Fußnotenverweis" oder ähnliches an
- Benutzer kann zur zugehörigen Fußnote navigieren

**Note (Fußnote):**

- Screenreader kündigt "Fußnote" beim Erreichen an
- Benutzer kann zurück zum Verweis navigieren

**Navigation:**

- AT (Assistive Technology) sollte laut PDF/UA:
  - Den Benutzer informieren, wenn ein Reference erreicht wird
  - Navigation zur zugehörigen Note ermöglichen
  - Rückkehr zum Reference nach dem Lesen der Note erlauben

---

## Erfolgs-Kriterien

- [ ] `beginReference(options)` / `endReference()` API verfügbar
- [ ] `beginNote(options)` / `endNote()` API verfügbar
- [ ] Reference-Elemente im Structure Tree korrekt
- [ ] Note-Elemente im Structure Tree korrekt
- [ ] Note-Elemente haben eindeutige ID
- [ ] Lbl-Element innerhalb von Note
- [ ] veraPDF-Validierung besteht
- [ ] Screenreader-Test erfolgreich

---

## Nächste Schritte nach Sprint 17

- **Sprint 18:** Caption für Bildunterschriften

---

## Referenzen

- **PDF Reference ISO 32000-1:** Section 14.8.4.4 (Inline-Level Structure Elements)
- **PDF/UA-1 (ISO 14289-1):** Requirements for Note elements
- **HTML Mapping:** Keine direkte Entsprechung, aber `<sup>` + `<aside>` oder `<footer>` für Fußnoten
- **Allyant Guide:** https://allyant.com/blog/how-to-tag-footnotes-and-endnotes-in-pdf/
- **accessible-pdf.info:** https://accessible-pdf.info/en/basics/general/overview-of-the-pdf-tags/
