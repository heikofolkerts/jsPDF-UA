# Sprint 9: Link-Strukturen (interne/externe Verweise)

**Ziel:** PDF/UA-konforme Links mit korrekter Strukturauszeichnung implementieren

**Datum:** 2025-11-22

---

## Überblick

Links sind essentiell für die Navigation in PDF-Dokumenten. Für PDF/UA müssen sie:

- Als strukturierte Links markiert sein (Link-Element)
- Für Screenreader erkennbar sein
- Ein Ziel haben (intern oder extern)
- Visuell und per Tastatur navigierbar sein

---

## PDF/UA Anforderungen für Links

### Struktur-Elemente

**Link-Element:**

- `Link` - Container für den verlinkten Text
- Muss in der Struktur-Tree eingebunden sein
- Muss ein Ziel (Annotation) haben

**Annotations:**

- Link-Annotations für klickbare Bereiche
- Verknüpfung zwischen Struktur und Annotation über `/StructParent`

---

## Link-Typen

### 1. Externe Links (URLs)

```javascript
doc.addLink({
  x: 10,
  y: 20,
  width: 50,
  height: 10,
  url: "https://example.com",
  text: "Visit Website"
});
```

### 2. Interne Links (zu anderen Seiten)

```javascript
doc.addLink({
  x: 10,
  y: 20,
  width: 50,
  height: 10,
  pageNumber: 3,
  text: "Go to page 3"
});
```

### 3. Links zu benannten Zielen

```javascript
// Ziel definieren
doc.addDestination("chapter1", 1, 0, 100);

// Link zum Ziel
doc.addLink({
  x: 10,
  y: 20,
  width: 50,
  height: 10,
  destination: "chapter1",
  text: "Jump to Chapter 1"
});
```

---

## API Design

### Basis-API:

```javascript
/**
 * Add an accessible link
 * @param {object} options - Link options
 * @param {number} options.x - X coordinate
 * @param {number} options.y - Y coordinate
 * @param {number} options.width - Link width
 * @param {number} options.height - Link height
 * @param {string} options.text - Link text (for structure tree)
 * @param {string} options.url - External URL (for external links)
 * @param {number} options.pageNumber - Target page (for internal links)
 * @param {string} options.destination - Named destination (for internal links)
 */
doc.addAccessibleLink(options);

/**
 * Begin a link structure element
 * Allows manual control over link structure
 */
doc.beginLink();
doc.endLink();
```

---

## Implementierung

### Schritt 1: Link-Strukturelement in structure_tree.js

```javascript
/**
 * Begin a link structure element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.beginLink = function() {
  return this.beginStructureElement("Link");
};

/**
 * End a link structure element
 * @returns {jsPDF} - Returns jsPDF instance for method chaining
 */
jsPDFAPI.endLink = function() {
  return this.endStructureElement();
};
```

### Schritt 2: Link-Annotation mit Struktur-Verknüpfung

Links in PDF bestehen aus zwei Teilen:

1. **Struktur-Element** (`Link`) - für Screenreader
2. **Annotation** (`/Link`) - für Klick-Interaktion

Die Verknüpfung erfolgt über:

- `/StructParent` in der Annotation
- Eintrag im ParentTree der Struktur

### Schritt 3: Einfache API für häufige Fälle

```javascript
/**
 * Add an external link (URL)
 */
jsPDFAPI.addExternalLink = function(text, x, y, width, height, url) {
  this.beginLink();
  this.text(text, x, y);
  this.endLink();

  // Add annotation
  this.link(x, y, width, height, { url: url });

  return this;
};

/**
 * Add an internal link (to page)
 */
jsPDFAPI.addInternalLink = function(text, x, y, width, height, pageNumber) {
  this.beginLink();
  this.text(text, x, y);
  this.endLink();

  // Add annotation
  this.link(x, y, width, height, { pageNumber: pageNumber });

  return this;
};
```

---

## Test-Suite

### Test 1: Externe Links

```javascript
const doc = new jsPDF({ pdfUA: true });

doc.setDocumentTitle("External Links Test");
doc.setLanguage("en-US");

doc.beginStructureElement("Document");
doc.beginStructureElement("H1");
doc.text("External Links", 10, 10);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.text("Visit our website: ", 10, 30);

doc.beginLink();
doc.text("example.com", 52, 30);
doc.endLink();

// Add clickable annotation
doc.link(52, 25, 30, 10, { url: "https://example.com" });

doc.endStructureElement();
doc.endStructureElement();

doc.save("test-link-1-external.pdf");
```

### Test 2: Interne Links

```javascript
const doc = new jsPDF({ pdfUA: true });

doc.setDocumentTitle("Internal Links Test");
doc.setLanguage("en-US");

// Page 1
doc.beginStructureElement("Document");
doc.beginStructureElement("H1");
doc.text("Table of Contents", 10, 10);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.beginLink();
doc.text("Go to Chapter 1 (Page 2)", 10, 30);
doc.endLink();
doc.link(10, 25, 80, 10, { pageNumber: 2 });
doc.endStructureElement();

doc.addPage();

// Page 2
doc.beginStructureElement("H1");
doc.text("Chapter 1", 10, 10);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.text("This is chapter 1.", 10, 30);
doc.endStructureElement();
doc.endStructureElement();

doc.save("test-link-2-internal.pdf");
```

### Test 3: Links in Listen

```javascript
doc.beginList();
doc.beginListItem();
doc.addListLabel("•", 15, 25);
doc.beginListBody();
doc.text("Visit ", 20, 25);
doc.beginLink();
doc.text("Google", 35, 25);
doc.endLink();
doc.link(35, 20, 20, 10, { url: "https://google.com" });
doc.endListBody();
doc.endStructureElement();

doc.beginListItem();
doc.addListLabel("•", 15, 35);
doc.beginListBody();
doc.text("Visit ", 20, 35);
doc.beginLink();
doc.text("GitHub", 35, 35);
doc.endLink();
doc.link(35, 30, 20, 10, { url: "https://github.com" });
doc.endListBody();
doc.endStructureElement();
doc.endList();
```

### Test 4: Links in Tabellen

```javascript
doc.beginStructureElement("Table");
doc.beginTableHead();
doc.beginTableRow();
doc.beginTableHeaderCell("Column");
doc.text("Website", 20, 25);
doc.endStructureElement();

doc.beginTableHeaderCell("Column");
doc.text("Link", 80, 25);
doc.endStructureElement();
doc.endStructureElement();
doc.endStructureElement();

doc.beginTableBody();
doc.beginTableRow();
doc.beginTableDataCell();
doc.text("Google", 20, 35);
doc.endStructureElement();

doc.beginTableDataCell();
doc.beginLink();
doc.text("Visit", 80, 35);
doc.endLink();
doc.link(80, 30, 15, 10, { url: "https://google.com" });
doc.endStructureElement();
doc.endStructureElement();
doc.endTableBody();
doc.endStructureElement();
```

### Test 5: Deutsche Sprache

```javascript
doc.setLanguage("de-DE");

doc.beginStructureElement("P");
doc.text("Besuchen Sie unsere ", 10, 30);

doc.beginLink();
doc.text("Webseite", 60, 30);
doc.endLink();

doc.link(60, 25, 25, 10, { url: "https://beispiel.de" });

doc.endStructureElement();
```

---

## PDF-Referenz-Beispiele

### Link-Strukturelement:

```pdf
10 0 obj
<< /Type /StructElem
   /S /Link
   /P 8 0 R
   /Pg 3 0 R
   /K [5]
>>
endobj
```

### Link-Annotation:

```pdf
15 0 obj
<< /Type /Annot
   /Subtype /Link
   /Rect [52 720 82 730]
   /Border [0 0 0]
   /A << /S /URI /URI (https://example.com) >>
   /StructParent 0
>>
endobj
```

Die Annotation muss in der Page's `/Annots` Array erscheinen:

```pdf
3 0 obj
<< /Type /Page
   /Annots [15 0 R]
   ...
>>
```

---

## Bekannte Einschränkungen

1. **Keine automatische Link-Erkennung** - URLs im Text werden nicht automatisch verlinkt
2. **Manuelle Positionierung** - Benutzer muss Link-Rechteck manuell angeben
3. **Keine Link-Styles** - Farbe/Unterstreichung muss manuell gesetzt werden
4. **Keine Hover-Effekte** - PDF unterstützt keine CSS-artigen Hover-States

**Hinweis:** Diese sind beabsichtigt. Sprint 9 fokussiert auf **Struktur und Barrierefreiheit**, nicht auf automatische Erkennung oder Styling.

---

## Erfolgs-Kriterien

✅ API-Methoden für Link-Strukturelemente
✅ Link-Annotations mit /StructParent-Verknüpfung
✅ Externe Links (URLs) funktionieren
✅ Interne Links (Seitenziele) funktionieren
✅ Links in Listen und Tabellen funktionieren
✅ Screenreader kündigt Links an ("Link, example.com")
✅ Links sind per Tastatur navigierbar
✅ veraPDF-Validierung besteht
✅ Test-Suite mit verschiedenen Link-Typen
✅ Dokumentation mit Beispielen

---

## Nächste Schritte nach Sprint 9

- **Sprint 10:** Weitere Font-Stile (Bold, Italic, BoldItalic)
- **Sprint 11:** Font-Subsetting zur Größenreduzierung
- **Sprint 12:** Komplexes Test-Dokument mit allen Features

---

## Referenzen

- **PDF/UA Standard:** ISO 14289-1:2014 Section 7.18 (Annotations)
- **PDF Reference:** Section 12.5 (Annotations), 8.3.1 (Link Annotations)
- **WCAG 2.1:** Success Criterion 2.4.4 (Link Purpose)
- **W3C Links:** https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html

---

## ✅ Sprint 9 Status: Teilweise Implementiert

**Status:** LINK-STRUKTURELEMENTE IMPLEMENTIERT, ANNOTATION-VERKNÜPFUNG AUSSTEHEND

### Implementation Summary:

**Files Modified:**

1. `src/modules/structure_tree.js`:
   - Added `beginLink()` method
   - Added `endLink()` method
   - Added `endTableHead()`, `endTableBody()`, `endTableFoot()` convenience methods

**What's Working:**

- ✅ Link structure elements (Link) in structure tree
- ✅ Links can be wrapped around text content
- ✅ Links work in paragraphs, lists, and tables
- ✅ Link text is tagged with MCIDs
- ✅ Screen readers can detect link text in structure
- ✅ Test suite with 5 test cases created

**What's NOT Working (Known Limitation):**

- ❌ Annotations missing `/StructParent` attribute
- ❌ veraPDF validation fails due to missing annotation-structure linkage
- ❌ Links not fully accessible per PDF/UA-1 requirements

**Root Cause:**
The existing `annotations.js` module (which provides the `link()` method) does not support `/StructParent` attributes. This attribute is required to link the clickable annotation to the Link structure element.

**Current Annotation Output:**

```pdf
<</Type /Annot
  /Subtype /Link
  /Rect [...]
  /A <</S /URI /URI (https://example.com) >>
>>
```

**Required for PDF/UA:**

```pdf
<</Type /Annot
  /Subtype /Link
  /Rect [...]
  /A <</S /URI /URI (https://example.com) >>
  /StructParent 0    ← MISSING!
>>
```

The `/StructParent` entry would reference an index in the StructTreeRoot's ParentTree, which maps back to the Link structure element.

**Test Results:**

- ✅ All 5 test PDFs generate successfully
- ✅ Link structure elements present in PDF
- ✅ Link text appears in correct positions
- ❌ All 5 PDFs fail veraPDF PDF/UA-1 validation (annotations not linked)

**Generated Test PDFs:**

1. `test-link-1-external.pdf` - Simple external link
2. `test-link-2-internal.pdf` - Internal page links
3. `test-link-3-in-list.pdf` - Links in lists
4. `test-link-4-in-table.pdf` - Links in tables
5. `test-link-5-german.pdf` - German language

**User Testing:**
Links should still be somewhat functional for screen readers (structure is present), but full keyboard navigation and PDF/UA compliance requires the annotation linkage.

**Next Steps to Complete Sprint 9:**

1. Modify `src/modules/annotations.js` to support `/StructParent`
2. Track which structure element is active when `link()` is called
3. Add StructParent index to annotation
4. Add annotation object reference to structure element's `/K` array
5. Re-test with veraPDF

**Decision:**
This is a significant undertaking that requires careful modification of the annotations module. Given the complexity and the risk of breaking existing functionality, we should discuss with the user whether to:

- **Option A:** Continue with full annotation linkage implementation (Sprint 9.1)
- **Option B:** Mark links as "partial" and move to next sprint (fonts/subsetting)
- **Option C:** Defer complete link implementation until after other features

**Recommendation:** Move forward with other sprints and return to complete link implementation later, as it requires deeper changes to the annotations system.
