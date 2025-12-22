# Sprint 15: Quote und BlockQuote für Zitate

**Ziel:** PDF/UA-konforme Zitat-Strukturelemente für Screenreader

**Datum:** 2025-12-05

---

## Überblick

PDF unterstützt zwei Struktur-Elemente für Zitate:

1. **Quote** - Inline-Zitat innerhalb eines Absatzes

   - Entspricht HTML `<q>`
   - Für kurze Zitate innerhalb des Fließtexts

2. **BlockQuote** - Block-Level-Zitat als eigenständiger Absatz
   - Entspricht HTML `<blockquote>`
   - Für längere Zitate, die als eigener Block dargestellt werden

### Unterschied zu anderen Elementen

| Element        | Ebene  | Zweck                             |
| -------------- | ------ | --------------------------------- |
| **Quote**      | Inline | Kurzes Zitat im Fließtext         |
| **BlockQuote** | Block  | Längeres Zitat als eigener Absatz |
| **Span**       | Inline | Formatierung ohne Semantik        |
| **P**          | Block  | Normaler Absatz                   |

### Beispiel

```
Absatz mit "kurzes Zitat" im Fließtext.
         ↑ Quote (inline)

Längeres Zitat das als eigener
Block dargestellt wird und
mehrere Zeilen umfassen kann.
         ↑ BlockQuote (block-level)
```

---

## PDF/UA Anforderungen

### Aus der PDF-Referenz (ISO 32000-1):

> **Quote** (Inline-level structure element) - An inline portion of
> text attributed to someone other than the author of the surrounding
> text. The quoted text should be contained inline within a single
> paragraph.

> **BlockQuote** (Block-level structure element) - A portion of text
> consisting of one or more paragraphs attributed to someone other
> than the author of the surrounding text.

### Attribute

Beide Elemente können folgende Attribute haben:

- Keine speziellen Attribute erforderlich
- Optional: `/Lang` für anderssprachige Zitate (wie bei Span)

---

## API Design

### Quote (Inline)

```javascript
/**
 * Begin a Quote (inline quotation) element
 * For short quotes within a paragraph
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code for quoted text
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginQuote(options);

/**
 * End a Quote element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endQuote();
```

### BlockQuote (Block-Level)

```javascript
/**
 * Begin a BlockQuote (block-level quotation) element
 * For longer quotes that stand as separate paragraphs
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code for quoted text
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginBlockQuote(options);

/**
 * End a BlockQuote element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endBlockQuote();
```

### Verwendungsbeispiele

#### Inline Quote

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setLanguage("de-DE");

doc.beginStructureElement("Document");
doc.beginStructureElement("P");
doc.text("Der Autor schrieb: ", 10, 20);

doc.beginQuote();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text(
  '"Das ist ein Zitat"',
  10 + doc.getTextWidth("Der Autor schrieb: "),
  20
);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endQuote();

doc.text(
  " und das war es.",
  10 + doc.getTextWidth('Der Autor schrieb: "Das ist ein Zitat"'),
  20
);
doc.endStructureElement();
doc.endStructureElement();
```

#### Block Quote

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setLanguage("de-DE");

doc.beginStructureElement("Document");
doc.beginStructureElement("H1");
doc.text("Berühmte Zitate", 10, 20);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.text("Albert Einstein sagte einmal:", 10, 40);
doc.endStructureElement();

doc.beginBlockQuote();
doc.text('"Fantasie ist wichtiger als Wissen,', 20, 55);
doc.text('denn Wissen ist begrenzt."', 20, 65);
doc.endBlockQuote();

doc.beginStructureElement("P");
doc.text("Dieses Zitat inspiriert viele Menschen.", 10, 85);
doc.endStructureElement();
doc.endStructureElement();
```

#### Quote mit Sprachwechsel

```javascript
doc.setLanguage('de-DE');

doc.beginStructureElement('P');
  doc.text('Das englische Sprichwort ', 10, 40);

  doc.beginQuote({ lang: 'en-US' });
  doc.setFont("AtkinsonHyperlegible", "italic");
  doc.text('"actions speak louder than words"', 10 + doc.getTextWidth('Das englische Sprichwort '), 40);
  doc.setFont("AtkinsonHyperlegible", "normal");
  doc.endQuote();

  doc.text(' bedeutet soviel wie "Taten sagen mehr als Worte".', ...);
doc.endStructureElement();
```

---

## Implementierung

### In structure_tree.js

```javascript
/**
 * Begin a Quote (inline quotation) element
 * For short quotes within a paragraph, attributed to another author
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code (e.g., 'en-US', 'de-DE')
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginQuote = function(options) {
  options = options || {};
  var attributes = {};
  if (options.lang) {
    attributes.lang = options.lang;
  }
  return this.beginStructureElement("Quote", attributes);
};

/**
 * End a Quote element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endQuote = function() {
  return this.endStructureElement();
};

/**
 * Begin a BlockQuote (block-level quotation) element
 * For longer quotes that stand as separate paragraphs
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code (e.g., 'en-US', 'de-DE')
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginBlockQuote = function(options) {
  options = options || {};
  var attributes = {};
  if (options.lang) {
    attributes.lang = options.lang;
  }
  return this.beginStructureElement("BlockQuote", attributes);
};

/**
 * End a BlockQuote element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endBlockQuote = function() {
  return this.endStructureElement();
};
```

---

## Test-Suite

### Test 1: Einfaches Inline Quote

```javascript
doc.beginStructureElement("P");
doc.text("Er sagte: ", 10, 40);

doc.beginQuote();
doc.text('"Hallo Welt"', 35, 40);
doc.endQuote();

doc.text(" und ging.", 75, 40);
doc.endStructureElement();
```

### Test 2: Einfaches BlockQuote

```javascript
doc.beginStructureElement("P");
doc.text("Das folgende Zitat ist berühmt:", 10, 40);
doc.endStructureElement();

doc.beginBlockQuote();
doc.text('"Ich denke, also bin ich."', 20, 55);
doc.text("- René Descartes", 20, 65);
doc.endBlockQuote();
```

### Test 3: Quote mit Sprachwechsel

```javascript
doc.setLanguage("de-DE");

doc.beginStructureElement("P");
doc.text("Shakespeare schrieb: ", 10, 40);

doc.beginQuote({ lang: "en-GB" });
doc.text('"To be or not to be"', 65, 40);
doc.endQuote();

doc.text(".", 140, 40);
doc.endStructureElement();
```

### Test 4: Verschachtelte Elemente

```javascript
doc.beginBlockQuote();
doc.beginStructureElement("P");
doc.text("Erstes Absatz des Zitats.", 20, 40);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.text("Zweiter Absatz des Zitats mit ", 20, 55);

doc.beginEmphasis();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text(
  "Betonung",
  20 + doc.getTextWidth("Zweiter Absatz des Zitats mit "),
  55
);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endEmphasis();

doc.text(
  ".",
  20 + doc.getTextWidth("Zweiter Absatz des Zitats mit Betonung"),
  55
);
doc.endStructureElement();
doc.endBlockQuote();
```

### Test 5: Deutsche Sprache

```javascript
doc.setLanguage("de-DE");

doc.beginStructureElement("P");
doc.text("Goethe schrieb in Faust: ", 10, 40);

doc.beginQuote();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('"Grau, teurer Freund, ist alle Theorie"', x, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endQuote();

doc.text(".", x, 40);
doc.endStructureElement();
```

---

## Screenreader-Verhalten

### Erwartet:

**Quote (Inline):**
Der Screenreader sollte das Zitat im Kontext des umgebenden Texts vorlesen.
Einige Screenreader fügen "Zitat" oder "Zitat Ende" an.

**BlockQuote:**
Der Screenreader sollte das Block-Zitat als eigenen Bereich ankündigen:

- "Zitat-Block" beim Eintritt
- Text des Zitats
- "Zitat-Block Ende" beim Verlassen

**Mit Sprachwechsel:**
Wenn `/Lang` gesetzt ist, wechselt der Screenreader die Aussprache für das Zitat.

---

## Erfolgs-Kriterien

- [ ] `beginQuote(options)` / `endQuote()` API verfügbar
- [ ] `beginBlockQuote(options)` / `endBlockQuote()` API verfügbar
- [ ] Quote-Elemente im Structure Tree korrekt
- [ ] BlockQuote-Elemente im Structure Tree korrekt
- [ ] Optional: `/Lang`-Attribut für anderssprachige Zitate
- [ ] Verschachtelt in P, LBody, TD verwendbar (Quote)
- [ ] Als Block-Level-Element verwendbar (BlockQuote)
- [ ] veraPDF-Validierung besteht
- [ ] Screenreader-Test erfolgreich

---

## Nächste Schritte nach Sprint 15

- **Sprint 16:** Code-Element für Programmcode
- **Sprint 17:** Note/FENote für Fuß-/Endnoten
- **Sprint 18:** Caption für Bildunterschriften

---

## Referenzen

- **PDF Reference ISO 32000-1:** Section 14.8.4.4 (Inline-Level Structure Elements)
- **PDF Reference ISO 32000-1:** Section 14.8.4.2 (Block-Level Structure Elements)
- **HTML Mapping:** `<q>` → `/Quote`, `<blockquote>` → `/BlockQuote`
- **WCAG 2.1:** SC 1.3.1 (Info and Relationships)
