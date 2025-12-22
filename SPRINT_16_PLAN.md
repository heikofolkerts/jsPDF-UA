# Sprint 16: Code-Element für Programmcode

**Ziel:** PDF/UA-konformes Code-Strukturelement für Screenreader

**Datum:** 2025-12-06

**Status:** ✅ COMPLETED

---

## Überblick

PDF unterstützt das **Code**-Strukturelement für Programmcode und andere computerbezogene Inhalte:

- **Code** - Inline oder Block-Level für Computercode
  - Entspricht HTML `<code>` (inline) und `<pre><code>` (block)
  - Für Codebeispiele, Befehlszeilen, Variablennamen

### Unterschied zu anderen Elementen

| Element   | Ebene        | Zweck                                  |
| --------- | ------------ | -------------------------------------- |
| **Code**  | Inline/Block | Programmcode, computertechnischer Text |
| **Span**  | Inline       | Formatierung ohne Semantik             |
| **P**     | Block        | Normaler Absatz                        |
| **Quote** | Inline       | Zitat einer anderen Person             |

### Beispiel

```
Das `console.log()` Kommando gibt Text aus.
     ↑ Code (inline)

function greet(name) {
  return "Hello, " + name;
}
     ↑ Code (block-level)
```

---

## PDF/UA Anforderungen

### Aus der PDF-Referenz (ISO 32000-1):

> **Code** (Inline-level structure element) - A fragment of computer
> program text. This element may be used inline within a paragraph,
> or it may be a block-level element on its own.

### Attribute

- Keine speziellen Attribute erforderlich
- Optional: `/Lang` für Code mit Kommentaren in anderer Sprache
- Code sollte typischerweise in Monospace-Schrift dargestellt werden

---

## API Design

### Code (Inline und Block)

```javascript
/**
 * Begin a Code (computer code) element
 * For inline code snippets or block-level code sections
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code for comments in the code
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.beginCode(options);

/**
 * End a Code element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
doc.endCode();
```

### Verwendungsbeispiele

#### Inline Code

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setLanguage("de-DE");

doc.beginStructureElement("Document");
doc.beginStructureElement("P");
doc.text("Die Funktion ", 10, 20);

doc.beginCode();
doc.text("console.log()", 42, 20);
doc.endCode();

doc.text(" gibt Text aus.", 82, 20);
doc.endStructureElement();
doc.endStructureElement();
```

#### Block Code (mehrzeilig)

```javascript
const doc = new jsPDF({ pdfUA: true });
doc.setLanguage("de-DE");

doc.beginStructureElement("Document");
doc.beginStructureElement("H1");
doc.text("JavaScript Beispiel", 10, 20);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.text("Das folgende Beispiel zeigt eine Funktion:", 10, 35);
doc.endStructureElement();

doc.beginCode();
doc.text("function greet(name) {", 15, 50);
doc.text('  return "Hello, " + name;', 15, 58);
doc.text("}", 15, 66);
doc.endCode();

doc.beginStructureElement("P");
doc.text("Diese Funktion gibt einen Gruß zurück.", 10, 85);
doc.endStructureElement();
doc.endStructureElement();
```

#### Code mit Sprachwechsel (für Kommentare)

```javascript
doc.setLanguage("de-DE");

doc.beginStructureElement("P");
doc.text("Hier ist ein Beispiel mit englischem Code:", 10, 20);
doc.endStructureElement();

doc.beginCode({ lang: "en-US" });
doc.text("// This function calculates the sum", 15, 35);
doc.text("function sum(a, b) {", 15, 43);
doc.text("  return a + b;", 15, 51);
doc.text("}", 15, 59);
doc.endCode();
```

---

## Implementierung

### In structure_tree.js

```javascript
/**
 * Begin a Code (computer code) element
 * For inline code snippets or block-level code sections.
 * Corresponds to HTML <code> element.
 *
 * Use Code for:
 * - Inline code snippets (variable names, function calls)
 * - Block-level code examples
 * - Command-line instructions
 * - File paths and URLs in technical context
 *
 * @param {Object} [options] - Optional attributes
 * @param {string} [options.lang] - Language code (e.g., 'en-US', 'de-DE') for code comments
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginCode = function(options) {
  options = options || {};
  var attributes = {};

  // If language is specified, store it for BDC operator
  if (options.lang) {
    attributes.lang = options.lang;
  }

  return this.beginStructureElement("Code", attributes);
};

/**
 * End a Code element
 * Convenience method for doc.endStructureElement()
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endCode = function() {
  return this.endStructureElement();
};
```

---

## Test-Suite

### Test 1: Einfacher Inline Code

```javascript
doc.beginStructureElement("P");
doc.text("Die Variable ", 10, 40);

doc.beginCode();
doc.text("counter", 45, 40);
doc.endCode();

doc.text(" speichert den Zähler.", 75, 40);
doc.endStructureElement();
```

### Test 2: Block Code (mehrzeilig)

```javascript
doc.beginStructureElement("P");
doc.text("JavaScript Funktion:", 10, 40);
doc.endStructureElement();

doc.beginCode();
doc.text("function hello() {", 15, 55);
doc.text('  console.log("Hello");', 15, 63);
doc.text("}", 15, 71);
doc.endCode();
```

### Test 3: Code mit Sprachwechsel

```javascript
doc.setLanguage("de-DE");

doc.beginStructureElement("P");
doc.text("Englischer Codekommentar:", 10, 40);
doc.endStructureElement();

doc.beginCode({ lang: "en-US" });
doc.text("// Initialize the counter", 15, 55);
doc.text("let count = 0;", 15, 63);
doc.endCode();
```

### Test 4: Code in Listen

```javascript
doc.beginList();
doc.beginListItem();
doc.addListLabel("1.", 15, 40);
doc.beginListBody();
doc.text("Schritt 1: Führen Sie ", 22, 40);

doc.beginCode();
doc.text("npm install", 80, 40);
doc.endCode();

doc.text(" aus.", 130, 40);
doc.endListBody();
doc.endStructureElement();
doc.endList();
```

### Test 5: Deutsche Sprache mit Code

```javascript
doc.setLanguage("de-DE");

doc.beginStructureElement("P");
doc.text("Der Befehl ", 10, 40);

doc.beginCode();
doc.text('git commit -m "Nachricht"', 40, 40);
doc.endCode();

doc.text(" erstellt einen Commit.", 145, 40);
doc.endStructureElement();
```

---

## Screenreader-Verhalten

### Erwartet:

**Code (Inline):**
Der Screenreader kann das Code-Element ankündigen, aber typischerweise wird es einfach als Teil des Fließtexts vorgelesen. Einige Screenreader können "Code" oder "Computercode" ankündigen.

**Code (Block):**
Der Screenreader behandelt den Block als eigenen Bereich. Möglicherweise:

- "Code-Block" beim Eintritt
- Inhalt vorlesen
- "Code-Block Ende" beim Verlassen

**Mit Sprachwechsel:**
Wenn `/Lang` gesetzt ist, kann der Screenreader die Aussprache für Kommentare anpassen.

**Wichtig:**

- Code-Inhalte werden als Text vorgelesen (nicht "buchstabiert")
- Einrückungen und Formatierung sind für den Screenreader nicht hörbar
- Sonderpunktation (Klammern, Semikolons) werden typischerweise mitgelesen

---

## Erfolgs-Kriterien

- [ ] `beginCode(options)` / `endCode()` API verfügbar
- [ ] Code-Elemente im Structure Tree korrekt
- [ ] Optional: `/Lang`-Attribut für anderssprachige Kommentare
- [ ] Inline in P, LBody, TD verwendbar
- [ ] Als Block-Level-Element verwendbar
- [ ] veraPDF-Validierung besteht
- [ ] Screenreader-Test erfolgreich

---

## Nächste Schritte nach Sprint 16

- **Sprint 17:** Note/FENote für Fuß-/Endnoten
- **Sprint 18:** Caption für Bildunterschriften

---

## Referenzen

- **PDF Reference ISO 32000-1:** Section 14.8.4.4 (Inline-Level Structure Elements)
- **HTML Mapping:** `<code>` → `/Code`
- **WCAG 2.1:** SC 1.3.1 (Info and Relationships)
