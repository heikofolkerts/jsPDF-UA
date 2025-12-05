# Sprint 14: Span-Element für Inline-Container

**Ziel:** Generisches Inline-Container-Element für PDF/UA-konforme Textformatierung

**Datum:** 2025-12-05

---

## Überblick

Das `Span`-Element ist ein **generischer Inline-Container** in PDF, ähnlich wie `<span>` in HTML. Es wird verwendet für:

1. **Formatierungsänderungen** innerhalb eines Absatzes (ohne semantische Bedeutung)
2. **Sprachänderungen** innerhalb eines Textes
3. **Stilistische Variationen** (Farbe, Größe, etc.)

### Unterschied zu Strong/Em

| Element | Zweck | Semantik |
|---------|-------|----------|
| **Strong** | Wichtiger Text | Hat Bedeutung (wichtig) |
| **Em** | Betonter Text | Hat Bedeutung (betont) |
| **Span** | Formatierter Text | Keine semantische Bedeutung |

### Beispiel

```
Absatz mit [rotem Text] und [blauem Text] ohne semantische Bedeutung.
         ↑ Span         ↑ Span
```

---

## PDF/UA Anforderungen

### Aus der PDF-Referenz (ISO 32000-1):

> **Span** (Inline-level structure element) - A generic inline element having
> no inherent semantic significance. It can be used to give style characteristics
> to content or to give attributes like a change in language.

### Attribute

Das Span-Element kann folgende Attribute haben:
- `/Lang` - Sprachcode (z.B. "en-US", "de-DE") für Sprachwechsel
- Standard-Attribute wie `/Alt`, `/ActualText`, `/E` (Expansion)

---

## API Design

### Basis-API

```javascript
/**
 * Begin a Span (generic inline container) element
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code for text within span
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginSpan(options);

/**
 * End a Span element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endSpan();
```

### Verwendungsbeispiele

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setLanguage('de-DE');

doc.beginStructureElement('Document');
  doc.beginStructureElement('P');
    doc.text('Dieser Text ist auf Deutsch, aber ', 10, 20);

    // Englischer Text innerhalb eines deutschen Absatzes
    doc.beginSpan({ lang: 'en-US' });
    doc.text('this part is in English', 80, 20);
    doc.endSpan();

    doc.text(', und dann wieder Deutsch.', 160, 20);
  doc.endStructureElement();
doc.endStructureElement();
```

### Formatierung ohne Semantik

```javascript
doc.beginStructureElement('P');
doc.text('Normal text with ', 10, 40);

// Roter Text - nur visuell, keine semantische Bedeutung
doc.beginSpan();
doc.setTextColor(255, 0, 0);
doc.text('red colored text', 55, 40);
doc.setTextColor(0, 0, 0);
doc.endSpan();

doc.text(' in the middle.', 115, 40);
doc.endStructureElement();
```

---

## Implementierung

### In structure_tree.js

```javascript
/**
 * Begin a Span (generic inline container) element
 * Used for formatting changes without semantic meaning,
 * or for language changes within a paragraph
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code (e.g., 'en-US', 'de-DE')
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginSpan = function(options) {
  options = options || {};

  // If language is specified, pass it to the structure element
  if (options.lang) {
    return this.beginStructureElement('Span', { lang: options.lang });
  }

  return this.beginStructureElement('Span');
};

/**
 * End a Span element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endSpan = function() {
  return this.endStructureElement();
};
```

### Lang-Attribut in Structure Elements

Das `/Lang`-Attribut im Span überschreibt die Dokumentsprache für den enthaltenen Text. Dies ist wichtig für:
- Fremdwörter
- Zitate in anderen Sprachen
- Technische Begriffe

---

## Test-Suite

### Test 1: Einfacher Span

```javascript
doc.beginStructureElement('P');
doc.text('Text with ', 10, 40);

doc.beginSpan();
doc.setTextColor(255, 0, 0);
doc.text('red text', 40, 40);
doc.setTextColor(0, 0, 0);
doc.endSpan();

doc.text(' inside.', 75, 40);
doc.endStructureElement();
```

### Test 2: Span mit Sprachwechsel

```javascript
doc.setLanguage('de-DE');

doc.beginStructureElement('P');
doc.text('Das Wort ', 10, 40);

doc.beginSpan({ lang: 'en-US' });
doc.text('Computer', 40, 40);
doc.endSpan();

doc.text(' ist ein Anglizismus.', 80, 40);
doc.endStructureElement();
```

### Test 3: Mehrere Spans mit verschiedenen Sprachen

```javascript
doc.setLanguage('de-DE');

doc.beginStructureElement('P');
doc.text('Auf Französisch sagt man ', 10, 40);

doc.beginSpan({ lang: 'fr-FR' });
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('bonjour', 80, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endSpan();

doc.text(', auf Spanisch ', 110, 40);

doc.beginSpan({ lang: 'es-ES' });
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('hola', 160, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endSpan();

doc.text('.', 180, 40);
doc.endStructureElement();
```

### Test 4: Span in Listen

```javascript
doc.beginList();
  doc.beginListItem();
    doc.addListLabel('•', 15, 40);
    doc.beginListBody();
      doc.text('Term: ', 20, 40);
      doc.beginSpan({ lang: 'en-US' });
      doc.text('Accessibility', 45, 40);
      doc.endSpan();
    doc.endListBody();
  doc.endStructureElement();
doc.endList();
```

### Test 5: Kombination mit Strong/Em

```javascript
doc.beginStructureElement('P');
doc.text('Dies ist ', 10, 40);

doc.beginStrong();
doc.setFont("AtkinsonHyperlegible", "bold");
doc.text('wichtig', 40, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endStrong();

doc.text(' und ', 75, 40);

doc.beginSpan({ lang: 'en-US' });
doc.beginEmphasis();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('emphasized English', 95, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endEmphasis();
doc.endSpan();

doc.text('.', 175, 40);
doc.endStructureElement();
```

---

## Screenreader-Verhalten

### Erwartet:

**Mit Sprachwechsel:**
```
"Das Wort [wechselt zu englischer Aussprache] Computer [zurück zu Deutsch] ist ein Anglizismus."
```

Screenreader wie NVDA können die Stimme/Aussprache basierend auf dem `/Lang`-Attribut wechseln.

**Ohne Sprachwechsel:**
Span ohne `/Lang` hat keine hörbare Auswirkung - es ist nur strukturell.

---

## Erfolgs-Kriterien

✅ `beginSpan()` / `endSpan()` API verfügbar
✅ Span-Elemente im Structure Tree korrekt
✅ Optional: `/Lang`-Attribut für Sprachwechsel
✅ Verschachtelt in P, LBody, TD verwendbar
✅ Kombinierbar mit Strong/Em
✅ veraPDF-Validierung besteht
✅ Screenreader wechselt Sprache bei `/Lang`

---

## Nächste Schritte nach Sprint 14

- **Sprint 15:** Quote/BlockQuote für Zitate
- **Sprint 16:** Code-Element für Programmcode
- **Sprint 17:** Note/FENote für Fuß-/Endnoten

---

## Referenzen

- **PDF Reference ISO 32000-1:** Section 14.8.4.4 (Inline-Level Structure Elements)
- **HTML Mapping:** `<span>` → `/Span`
- **Section 508:** https://www.section508.gov/create/pdfs/common-tags-and-usage/
- **WCAG 2.1:** SC 3.1.2 (Language of Parts)
