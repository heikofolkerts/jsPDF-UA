# Sprint 13: Semantische Hervorhebungen (Strong/Em)

**Ziel:** PDF/UA-konforme semantische Textauszeichnungen für Screenreader

**Datum:** 2025-12-05

---

## Überblick

Aktuell sind **Bold** und **Italic** nur **visuelle** Stile. Screenreader können nicht unterscheiden zwischen:
- Text der **visuell fett** ist (dekorativ)
- Text der **semantisch wichtig** ist (sollte betont gelesen werden)

### Problem

```javascript
// Aktuell: Nur visueller Unterschied
doc.setFont("AtkinsonHyperlegible", "bold");
doc.text('Wichtiger Hinweis', 10, 10);
doc.setFont("AtkinsonHyperlegible", "normal");
```

Der Screenreader liest dies als normalen Text - er weiß nicht, dass es wichtig ist.

### Lösung: Strong und Em Struktur-Elemente

PDF unterstützt zwei Inline-Strukturtypen für semantische Hervorhebungen:

1. **Strong** - Starke Wichtigkeit (entspricht HTML `<strong>`)
   - Screenreader kann Text betont/lauter lesen
   - Typischerweise visuell fett dargestellt

2. **Em** (Emphasis) - Betonung (entspricht HTML `<em>`)
   - Screenreader kann Betonung durch Intonation signalisieren
   - Typischerweise visuell kursiv dargestellt

---

## PDF/UA Anforderungen

### Struktur-Elemente

Aus der PDF-Referenz (ISO 32000-1):
- `/Strong` - Text mit starker Wichtigkeit
- `/Em` - Text mit Betonung

Diese sind **Inline-Level** Struktur-Elemente, d.h. sie können innerhalb von P, LBody, TD etc. verwendet werden.

### Beispiel PDF-Struktur

```
Document
└─ P
   ├─ MCID 0 (normaler Text)
   ├─ Strong
   │  └─ MCID 1 (wichtiger Text)
   └─ MCID 2 (weiterer normaler Text)
```

---

## API Design

### Basis-API

```javascript
/**
 * Begin a Strong (important) text section
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginStrong();

/**
 * End a Strong text section
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endStrong();

/**
 * Begin an Em (emphasis) text section
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginEmphasis();

/**
 * End an Em text section
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endEmphasis();
```

### Verwendungsbeispiele

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setLanguage('de-DE');

doc.beginStructureElement('Document');
  doc.beginStructureElement('P');
    doc.text('Dies ist ein ', 10, 20);

    // Semantisch wichtig (Strong)
    doc.beginStrong();
    doc.setFont("AtkinsonHyperlegible", "bold");
    doc.text('wichtiger Hinweis', 35, 20);
    doc.setFont("AtkinsonHyperlegible", "normal");
    doc.endStrong();

    doc.text(' den Sie beachten sollten.', 80, 20);
  doc.endStructureElement();

  doc.beginStructureElement('P');
    doc.text('Der Begriff ', 10, 35);

    // Betonung (Em)
    doc.beginEmphasis();
    doc.setFont("AtkinsonHyperlegible", "italic");
    doc.text('Barrierefreiheit', 40, 35);
    doc.setFont("AtkinsonHyperlegible", "normal");
    doc.endEmphasis();

    doc.text(' ist zentral.', 90, 35);
  doc.endStructureElement();
doc.endStructureElement();
```

---

## Implementierung

### Schritt 1: Convenience-Methoden in structure_tree.js

```javascript
/**
 * Begin a Strong (important) text section
 * For text that has semantic importance (not just visual bold)
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginStrong = function() {
  return this.beginStructureElement('Strong');
};

/**
 * End a Strong text section
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endStrong = function() {
  return this.endStructureElement();
};

/**
 * Begin an Em (emphasis) text section
 * For text that has semantic emphasis (not just visual italic)
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginEmphasis = function() {
  return this.beginStructureElement('Em');
};

/**
 * End an Em text section
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endEmphasis = function() {
  return this.endStructureElement();
};
```

---

## Test-Suite

### Test 1: Strong in Absätzen

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setDocumentTitle('Strong Test');
doc.setLanguage('en-US');

doc.beginStructureElement('Document');
  doc.beginStructureElement('H1');
  doc.text('Strong Element Test', 10, 20);
  doc.endStructureElement();

  doc.beginStructureElement('P');
  doc.text('This is a ', 10, 40);

  doc.beginStrong();
  doc.setFont("AtkinsonHyperlegible", "bold");
  doc.text('very important', 35, 40);
  doc.setFont("AtkinsonHyperlegible", "normal");
  doc.endStrong();

  doc.text(' message.', 75, 40);
  doc.endStructureElement();
doc.endStructureElement();

doc.save('test-strong-1-basic.pdf');
```

### Test 2: Em in Absätzen

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setDocumentTitle('Em Test');
doc.setLanguage('en-US');

doc.beginStructureElement('Document');
  doc.beginStructureElement('H1');
  doc.text('Emphasis Test', 10, 20);
  doc.endStructureElement();

  doc.beginStructureElement('P');
  doc.text('The word ', 10, 40);

  doc.beginEmphasis();
  doc.setFont("AtkinsonHyperlegible", "italic");
  doc.text('accessibility', 35, 40);
  doc.setFont("AtkinsonHyperlegible", "normal");
  doc.endEmphasis();

  doc.text(' is important.', 80, 40);
  doc.endStructureElement();
doc.endStructureElement();

doc.save('test-em-1-basic.pdf');
```

### Test 3: Strong und Em gemischt

```javascript
doc.beginStructureElement('P');
doc.text('This text has ', 10, 40);

doc.beginStrong();
doc.setFont("AtkinsonHyperlegible", "bold");
doc.text('strong', 55, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endStrong();

doc.text(' and ', 80, 40);

doc.beginEmphasis();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('emphasized', 95, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endEmphasis();

doc.text(' parts.', 130, 40);
doc.endStructureElement();
```

### Test 4: Strong/Em in Listen

```javascript
doc.beginList();
  doc.beginListItem();
    doc.addListLabel('•', 15, 40);
    doc.beginListBody();
      doc.text('Remember to ', 20, 40);
      doc.beginStrong();
      doc.setFont("AtkinsonHyperlegible", "bold");
      doc.text('save your work', 55, 40);
      doc.setFont("AtkinsonHyperlegible", "normal");
      doc.endStrong();
    doc.endListBody();
  doc.endStructureElement();
doc.endList();
```

### Test 5: Deutsche Sprache

```javascript
doc.setLanguage('de-DE');

doc.beginStructureElement('P');
doc.text('Dies ist ein ', 10, 40);

doc.beginStrong();
doc.setFont("AtkinsonHyperlegible", "bold");
doc.text('äußerst wichtiger', 50, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endStrong();

doc.text(' Hinweis für die Größe.', 105, 40);
doc.endStructureElement();
```

---

## Screenreader-Verhalten

### Erwartet:

**Ohne Strong/Em:**
```
"Dies ist ein wichtiger Hinweis."
(monoton gelesen)
```

**Mit Strong:**
```
"Dies ist ein WICHTIGER HINWEIS."
(betont/lauter oder mit Pause davor)
```

**Mit Em:**
```
"Der Begriff Barrierefreiheit ist zentral."
(mit Betonung auf "Barrierefreiheit")
```

### Hinweis:
Das tatsächliche Verhalten hängt vom Screenreader und dessen Einstellungen ab:
- NVDA: Kann Stimme ändern oder Pausen einfügen
- JAWS: Kann Lautstärke oder Tonhöhe anpassen
- VoiceOver: Kann Betonung signalisieren

---

## Erfolgs-Kriterien

✅ `beginStrong()` / `endStrong()` API verfügbar
✅ `beginEmphasis()` / `endEmphasis()` API verfügbar
✅ Strong-Elemente im Structure Tree korrekt
✅ Em-Elemente im Structure Tree korrekt
✅ Verschachtelt in P, LBody, TD verwendbar
✅ Deutsche Umlauts funktionieren
✅ veraPDF-Validierung besteht
✅ Screenreader-Test erfolgreich

---

## Nächste Schritte nach Sprint 13

- **Sprint 11:** Font-Subsetting zur Größenreduzierung (optional)
- **Sprint 14:** Span-Element für generische Inline-Container
- **Sprint 15:** Quote/BlockQuote für Zitate

---

## Referenzen

- **PDF Reference ISO 32000-1:** Section 14.8.4.4 (Inline-Level Structure Elements)
- **HTML Mapping:** `<strong>` → `/Strong`, `<em>` → `/Em`
- **WCAG 2.1:** SC 1.3.1 (Info and Relationships)
- **PDF/UA Reference Document:** https://pdfa.org/wp-content/uploads/2013/08/PDFUA-in-a-Nutshell-PDFUA.pdf

---

## ✅ Sprint 13 Status: COMPLETED

**Status:** STRONG/EM IMPLEMENTIERT + FONT-ERKENNUNG KORRIGIERT

**Datum:** 2025-12-05

### Implementation Summary:

**Files Modified:**
1. `src/modules/structure_tree.js` - Added Strong/Em methods
2. `src/modules/utf8.js` - Fixed font name generation for screen readers

**Part 1: Strong/Em Structure Elements**
- ✅ `beginStrong()` / `endStrong()` - Semantic importance
- ✅ `beginEmphasis()` / `endEmphasis()` - Semantic emphasis
- ✅ Works inline within P, LBody, TD, etc.

**Part 2: Font Detection Fix**
- ✅ Problem: All font styles had same `/FontName` in PDF
- ✅ Solution: Generate unique names based on `fontStyle`:
  - `normal` → `/FontName /AtkinsonHyperlegible`
  - `bold` → `/FontName /AtkinsonHyperlegible-Bold`
  - `italic` → `/FontName /AtkinsonHyperlegible-Italic`
  - `bolditalic` → `/FontName /AtkinsonHyperlegible-BoldItalic`
- ✅ Correct Flags (bit 6) and ItalicAngle (-12°) for italic fonts
- ✅ No API changes - fully transparent fix

**Important Discovery:**
Screen readers (NVDA, JAWS, etc.) do NOT announce Strong/Em elements by default!
- NVDA disabled this feature due to user complaints (too noisy)
- Font attribute changes ARE announced (when enabled in settings)
- Both mechanisms are needed: Strong/Em for PDF/UA compliance, unique font names for actual announcements

**Test Results:**
- ✅ All 5 test PDFs generated successfully
- ✅ NVDA announces font changes correctly (user verified)
- ✅ Behavior matches official PDF/UA reference document
- ✅ German umlauts work correctly

**User Testing (2025-12-05):**
> "Ich kann bestätigen, dass NVDA sowohl das Referenz-Dokument korrekt vorliest.
> Die Schriftwechsel-Ansage ist wirklich ziemlich anstrengend zu hören,
> aber beide Dokumente verhalten sich gleich."

**Generated Test PDFs:**
1. `test-strong-em-1-strong-basic.pdf` - Strong in paragraphs
2. `test-strong-em-2-em-basic.pdf` - Em in paragraphs
3. `test-strong-em-3-combined.pdf` - Strong + Em combined
4. `test-strong-em-4-in-lists.pdf` - Strong/Em in lists
5. `test-strong-em-5-german.pdf` - German umlauts

**Reference PDF:**
- `examples/temp/reference-pdfua-nutshell.pdf` - Official PDF Association document
