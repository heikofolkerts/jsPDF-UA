# PDF/UA Sprint History

This file contains detailed documentation of all completed PDF/UA implementation sprints.
For current status and quick reference, see [CLAUDE.md](./CLAUDE.md).

## Sprint 1 (COMPLETED & VERIFIED)
**Basic PDF/UA mode, XMP metadata, DisplayDocTitle**

- Status: Text displays correctly in both Acrobat Reader and Firefox

---

## Sprint 2+3 (COMPLETED & VERIFIED)
**Structure Tree + Marked Content system**

- **Status**: Content is now readable by screen readers in Acrobat Reader
- **Issue Resolved**: "AVPageView Textrahmen" problem fixed by ensuring `/Lang` in BDC operators

**What's been implemented and verified:**
- StructTreeRoot with RoleMap and ParentTree
- Document, H1-H6, P structure elements
- Automatic MCID generation and BDC/EMC wrapping
- ParentTree with indirect array objects (correct format)
- /StructParents in page dictionaries
- /Tabs /S for reading order
- /Group with /Transparency for proper rendering
- /Lang in Catalog AND in every BDC operator (CRITICAL FIX)
- /K array format: `/K [0]` instead of `/K 0`
- Complete parent hierarchy: Elements -> Document -> StructTreeRoot
- Object numbering without collisions
- MarkInfo with /Marked true
- Content readable by screen readers (verified with test suite)

**Critical Fix (2025-11-22):**
- **Problem**: Acrobat Reader showed "AVPageView Textrahmen" instead of actual content
- **Root Cause**: Missing `/Lang` attribute in BDC operators (src/jspdf.js:4099-4102)
- **Solution**: Re-added `/Lang` attribute to BDC operators
- **Format**: `/StructType <</Lang (language-code)/MCID n>> BDC`
- **Verification**: 5 test PDFs with varying complexity all readable in Acrobat Reader

---

## Sprint 4/5 (COMPLETED)
**Font Embedding with Atkinson Hyperlegible**

- **Status**: Automatic font embedding implemented and tested
- **Font**: Atkinson Hyperlegible Regular (Braille Institute)
- **Why**: Specifically designed for accessibility (low vision, magnification, character distinction)

**What's been implemented:**
- `src/modules/pdfua_fonts.js` - Font module with Base64-encoded Atkinson Hyperlegible (74 KB)
- Auto-loading in `src/jspdf.js` - Font loaded automatically when `pdfUA: true`
- No user configuration required - Works out of the box
- VFS integration - Font added to Virtual File System
- Font registration - Registered with jsPDF font system
- Default font setting - Automatically set as active font
- Test suite - 5 test PDFs verifying font embedding
- Verification script - Shell script to check font embedding

**Font Features:**
- Enhanced character distinction (I vs l vs 1, 0 vs O)
- Large counters for clarity
- Optimized for magnification (400%+ zoom)
- Developed with low vision specialists
- SIL Open Font License (OFL) - freely embeddable

**Bundle Size Impact:**
- UMD minified: 491 KB (+71 KB, +17%)
- ES minified: 416 KB (+76 KB, +22%)
- Only loaded when `pdfUA: true` (no impact on regular PDFs)

**Test Results:**
- Font embedded in all PDF/UA documents
- FontFile2 present (TrueType font stream)
- Regular PDFs do NOT include font (correct)
- German umlauts work correctly (a o u ss)
- Screen reader testing (USER VERIFIED - successful)
- veraPDF validation (ALL TESTS PASSED - PDF/UA-1 compliant)

**veraPDF Validation Results (2025-11-22):**
- `test-font-embedding-1.pdf` - PASS
- `test-font-embedding-2.pdf` - PASS
- `test-font-embedding-3.pdf` - PASS
- `test-font-embedding-5-german.pdf` - PASS
- All font embedding requirements met
- Full PDF/UA-1 compliance achieved

**Status:** **PRODUCTION READY** for text-based PDF/UA documents

---

## Sprint 6 (COMPLETED)
**Images with Alternative Text**

- **Status**: Strict validation implemented and tested
- **Key Feature**: Images MUST have alt text OR be marked as decorative

**What's been implemented:**
- `src/modules/addimage.js` - Extended addImage() with `alt` and `decorative` options
- Strict validation - Throws errors for missing/empty alt text
- Figure structure elements - Images wrapped in `/Figure` with `/Alt` attribute
- Decorative images - Marked as `/Artifact` (skipped by screen readers)
- BDC/EMC wrapping - Images properly tagged with marked content
- Test suite - 6 comprehensive test cases
- Validation tests - 7 tests for strict validation

**API Usage:**
```javascript
// Image with alt text (required for informative images)
doc.addImage({
  imageData: chart,
  x: 10, y: 10,
  width: 100, height: 80,
  alt: 'Sales chart showing 25% growth in Q4'
});

// Decorative image (for logos, borders, etc.)
doc.addImage({
  imageData: logo,
  x: 10, y: 10,
  width: 50, height: 20,
  decorative: true
});
```

**Test Results:**
- All image tests pass
- veraPDF validation passes
- Screen reader testing successful (USER VERIFIED)
- Errors thrown for missing/empty alt text

**User Feedback (2025-11-22):**
> "Ein sehr grosses Argernis mit Bildern und Alternativtexten besteht darin,
> dass sie sehr gerne vergessen werden."

This led to implementing STRICT validation (errors, not warnings) to prevent forgetting alt text.

---

## Sprint 7 (COMPLETED)
**Table Structures with Header Scope**

- **Status**: Full table accessibility implemented with veraPDF validation
- **Key Feature**: Proper header-cell association for screen reader navigation

**What's been implemented:**
- `src/modules/structure_tree.js` - Table structure methods added
- `beginTableHead()`, `beginTableBody()`, `beginTableFoot()` - Table sections
- `beginTableRow()` - Convenience method for TR elements
- `beginTableHeaderCell(scope)` - TH with Row/Column/Both scope
- `beginTableDataCell()` - Convenience method for TD elements
- Scope attribute in attribute dictionary - `/A << /O /Table /Scope /Column >>`
- Test suite - 5 test cases covering simple to complex tables

**API Usage:**
```javascript
doc.beginStructureElement('Table');
  doc.beginTableHead();
    doc.beginTableRow();
      doc.beginTableHeaderCell('Column');  // Column header
      doc.text('Product', 20, 25);
      doc.endStructureElement();
      // ... more column headers ...
    doc.endStructureElement();
  doc.endStructureElement();

  doc.beginTableBody();
    doc.beginTableRow();
      doc.beginTableHeaderCell('Row');  // Row header
      doc.text('Widget A', 20, 35);
      doc.endStructureElement();

      doc.beginTableDataCell();  // Data cell
      doc.text('$19.99', 80, 35);
      doc.endStructureElement();
    doc.endStructureElement();
  doc.endStructureElement();
doc.endStructureElement();
```

**Critical Discovery:**
The `/Scope` attribute MUST be placed inside an `/A` (attribute) dictionary:
```
/A << /O /Table /Scope /Column >>  # CORRECT
/Scope /Column  # WRONG - doesn't work!
```

**Test Results:**
- All 4 table tests pass
- veraPDF PDF/UA-1 validation passes
- Simple tables (column headers only)
- Tables with row headers
- Complex tables with mixed headers
- German language tables

**Screen Reader Behavior:**
When navigating to cell (2,2), screen reader announces:
```
"Widget A, Q2, $12,000"
   ^        ^      ^
 Row     Column  Cell
header   header  value
```

**User Requirement (2025-11-22):**
> "Bei der Implementierung von Tabellen ist es wichtig, dass die Zeile und Spalte
> fur die Beschriftungen korrekt ausgezeichnet wird, damit der Screenreader bei
> einer Navigation in den Tabellen die Uberschriften von Zeilen und Spalten
> korrekt ansagen kann."

---

## Sprint 8 (COMPLETED)
**List Structures (ol/ul)**

- **Status**: Full list accessibility implemented with veraPDF validation
- **Key Feature**: Lists with proper structure for screen reader navigation

**What's been implemented:**
- `src/modules/structure_tree.js` - List structure methods added
- `beginList(numbered)` - Create unordered or ordered lists
- `beginListNumbered()` - Convenience for ordered lists
- `beginListItem()` - List item element
- `addListLabel(label, x, y)` - Add bullet point or number
- `beginListBody()` / `endListBody()` - List item content
- `endList()` - Close list element
- Nested lists support - Lists can contain other lists
- Test suite - 5 test cases covering simple to nested lists

**API Usage:**
```javascript
// Unordered list (bullet points)
doc.beginList();
  doc.beginListItem();
    doc.addListLabel('*', 15, 25);
    doc.beginListBody();
      doc.text('First item', 20, 25);
    doc.endListBody();
  doc.endStructureElement();

  doc.beginListItem();
    doc.addListLabel('*', 15, 35);
    doc.beginListBody();
      doc.text('Second item', 20, 35);
    doc.endListBody();
  doc.endStructureElement();
doc.endList();

// Ordered list (numbered)
doc.beginListNumbered();
  doc.beginListItem();
    doc.addListLabel('1.', 15, 25);
    doc.beginListBody();
      doc.text('Step one', 22, 25);
    doc.endListBody();
  doc.endStructureElement();
doc.endList();

// Nested lists
doc.beginListNumbered();
  doc.beginListItem();
    doc.addListLabel('1.', 15, 25);
    doc.beginListBody();
      doc.text('Main item', 22, 25);

      // Nested unordered list
      doc.beginList();
        doc.beginListItem();
          doc.addListLabel('*', 25, 35);
          doc.beginListBody();
            doc.text('Sub-item', 30, 35);
          doc.endListBody();
        doc.endStructureElement();
      doc.endList();
    doc.endListBody();
  doc.endStructureElement();
doc.endList();
```

**Test Results:**
- All 5 list tests pass
- veraPDF PDF/UA-1 validation passes (all 5 PDFs)
- Simple unordered lists (bullet points)
- Simple ordered lists (numbered)
- Nested lists (multi-level)
- Mixed nested lists (ordered + unordered)
- German language lists

**Structure Hierarchy:**
```
L (List)
+- LI (ListItem)
|  +- Lbl (Label) - "*"
|  +- LBody (ListBody) - "Content"
+- LI (ListItem)
   +- LBody (ListBody)
      +- L (Nested List)
         +- LI (ListItem)
            +- Lbl
            +- LBody
```

**Screen Reader Behavior:**
When entering a list, screen reader announces:
- "List with 3 items"
- "Item 1 of 3, Bullet, First item"
- For nested lists: announces sub-list separately

---

## Sprint 9 (COMPLETED)
**Link Structures**

- **Status**: Link structure elements implemented with OBJR annotation connection
- **Key Feature**: Accessible links with proper structure-annotation linkage

**What's been implemented:**
- `src/modules/structure_tree.js` - Link structure methods added
- `beginLink()` / `endLink()` - Link structure element wrapper
- OBJR (Object Reference) connection - Links annotation to structure tree
- `/StructParent` attribute in annotations
- External links (URLs) and internal links (page references)
- Links work in paragraphs, lists, and tables

**API Usage:**
```javascript
// External link
doc.beginStructureElement('P');
doc.text('Visit our website: ', 10, 30);
doc.beginLink();
doc.text('example.com', 52, 30);
doc.endLink();
doc.link(52, 25, 30, 10, { url: 'https://example.com' });
doc.endStructureElement();

// Internal link (to page)
doc.beginLink();
doc.text('Go to Chapter 1', 10, 50);
doc.endLink();
doc.link(10, 45, 50, 10, { pageNumber: 2 });
```

**Test Results:**
- External links functional
- Internal page links functional
- Links in lists and tables
- Screen reader announces links correctly

---

## Sprint 10 (COMPLETED)
**Additional Font Styles (Bold, Italic, BoldItalic)**

- **Status**: All four Atkinson Hyperlegible font styles implemented
- **Key Feature**: Complete typography support for accessible documents

**What's been implemented:**
- `src/modules/pdfua_fonts.js` - Extended with Bold, Italic, BoldItalic (~220KB additional)
- `src/jspdf.js` - Auto-loads all four styles when `pdfUA: true`
- `setFont()` API works for all styles
- German umlauts in all styles

**API Usage:**
```javascript
const doc = new jsPDF({ pdfUA: true });

// Regular (default)
doc.text('Regular text', 10, 10);

// Bold
doc.setFont("AtkinsonHyperlegible", "bold");
doc.text('Bold text', 10, 20);

// Italic
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('Italic text', 10, 30);

// BoldItalic
doc.setFont("AtkinsonHyperlegible", "bolditalic");
doc.text('Bold Italic text', 10, 40);

// Back to Regular
doc.setFont("AtkinsonHyperlegible", "normal");
```

**Bundle Size Impact:**
- UMD minified: 710 KB (was 491 KB, +219 KB, +45%)
- ES minified: 635 KB (was 416 KB, +219 KB, +53%)
- Only affects PDF/UA mode - regular PDFs unchanged

**Test Results:**
- All 4 font styles available and working
- Font embedding verified (FontFile2 streams)
- German umlauts correct in all styles
- Font styles work in lists and tables

---

## Sprint 11 (SKIPPED)
**Font-Subsetting**

- **Status**: Not necessary - already implemented
- **Reason**: jsPDF already performs font subsetting during PDF export
  - Only used glyphs are embedded (`glyIdsUsed` in utf8.js)
  - WOFF2 compression not viable (PDF only supports TTF/OTF)
  - Bundle size (~700KB) acceptable for PDF/UA functionality
- **Decision**: Focus on feature completeness instead of optimization

---

## Sprint 12 (COMPLETED)
**Comprehensive Test Document**

- **Status**: Multi-page test document demonstrating all features
- **Key Feature**: Real-world example combining all implemented features

**What's been implemented:**
- `tests/pdfua/comprehensive-test.js` - Test document generator
- 3-page PDF with all implemented features
- German language throughout
- All 4 font styles demonstrated

**Document Structure:**
- Page 1: Title, font styles, simple and nested lists
- Page 2: Tables with row/column headers, mixed content
- Page 3: Links, feature summary

**Features Demonstrated:**
- PDF/UA structure with XMP metadata
- Structure Tree with all element types
- Font embedding (Atkinson Hyperlegible - all styles)
- German umlauts and special characters
- Lists (simple and nested)
- Tables with Row/Column scope
- Mixed content (multiple fonts in one paragraph)
- Links (structure and annotation)

**Test Results:**
- Document generates without errors
- All features combined successfully
- 99 KB file size (3 pages)

---

## Sprint 13 (COMPLETED)
**Semantic Text Highlights (Strong/Em) + Font Detection Fix**

- **Status**: Strong/Em structure elements + screen reader font detection
- **Key Feature**: Semantic markup AND proper font change announcements

**Part 1: Strong/Em Structure Elements**
- `src/modules/structure_tree.js` - Strong/Em methods added
- `beginStrong()` / `endStrong()` - Important text (semantic bold)
- `beginEmphasis()` / `endEmphasis()` - Emphasized text (semantic italic)
- Inline elements work within P, LBody, TD, etc.

**Part 2: Font Detection Fix for Screen Readers**
- `src/modules/utf8.js` - Font name generation based on style
- Each font style now has unique PDF FontName:
  - `normal` -> `/FontName /AtkinsonHyperlegible`
  - `bold` -> `/FontName /AtkinsonHyperlegible-Bold`
  - `italic` -> `/FontName /AtkinsonHyperlegible-Italic`
  - `bolditalic` -> `/FontName /AtkinsonHyperlegible-BoldItalic`
- Correct Flags for italic fonts (bit 6 set)
- Correct ItalicAngle (-12 deg) for italic fonts
- **Fully transparent** - no API changes required!

**API Usage (unchanged):**
```javascript
doc.beginStructureElement('P');
doc.text('This is a ', 10, 40);

// Semantically important (Strong)
doc.beginStrong();
doc.setFont("AtkinsonHyperlegible", "bold");
doc.text('very important', 35, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endStrong();

doc.text(' message.', 75, 40);
doc.endStructureElement();

// Emphasized text (Em)
doc.beginStructureElement('P');
doc.text('The word ', 10, 55);

doc.beginEmphasis();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('accessibility', 35, 55);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endEmphasis();

doc.text(' is important.', 80, 55);
doc.endStructureElement();
```

**Important Discovery - Screen Reader Behavior:**
- **Strong/Em elements**: NOT announced by screen readers (by design!)
  - NVDA had this feature but disabled it due to user complaints
  - Too much "noise" because strong/em is overused in documents
- **Font changes (Bold/Italic)**: ARE announced when enabled in NVDA settings
  - NVDA Settings -> Document Formatting -> Font attributes
  - This is the working mechanism for emphasis detection

**Why Both Are Important:**
- Strong/Em = PDF/UA compliance + semantic structure
- Font names = Actual screen reader announcements

**Critical Fix (2025-12-05):**
- **Problem**: NVDA didn't announce font changes (bold/italic)
- **Root Cause**: All font styles had same `/FontName` in PDF
- **Solution**: Generate unique font names based on `fontStyle` in `utf8.js`
- **Verification**: Tested with NVDA + PDF/UA reference document
- **No Breaking Changes**: API remains identical, fix is internal

**Test Results:**
- All 5 test PDFs generated successfully
- Strong/Em elements in structure tree
- Font changes detected by NVDA (verified by user)
- Behavior matches official PDF/UA reference documents
- German umlauts work correctly

---

## Sprint 14 (COMPLETED)
**Span Element for Inline Containers**

- **Status**: Span element with optional language attribute implemented
- **Key Feature**: Generic inline container + language change support

**What's been implemented:**
- `src/modules/structure_tree.js` - Span methods added
- `beginSpan(options)` / `endSpan()` - Generic inline container
- `options.lang` - Optional language code for language changes
- `src/jspdf.js` - BDC operator uses element's lang attribute if present
- Works within P, LBody, TD, Strong, Em, etc.

**API Usage:**
```javascript
// Simple span (no semantic meaning)
doc.beginSpan();
doc.setTextColor(255, 0, 0);
doc.text('red text', x, y);
doc.setTextColor(0, 0, 0);
doc.endSpan();

// Span with language change
doc.setLanguage('de-DE');  // Document is German

doc.beginStructureElement('P');
doc.text('Das Wort ', 10, 40);

doc.beginSpan({ lang: 'en-US' });  // English word
doc.text('Computer', 40, 40);
doc.endSpan();

doc.text(' ist ein Anglizismus.', 80, 40);
doc.endStructureElement();
```

**Difference from Strong/Em:**
| Element | Purpose | Semantics |
|---------|---------|-----------|
| Strong | Important text | Has meaning |
| Em | Emphasized text | Has meaning |
| **Span** | **Formatted text** | **No semantic meaning** |

**Screen Reader Behavior:**
- Span with `lang`: Screen reader changes pronunciation/voice
- Span without `lang`: No audible effect (structural only)

**Test Results:**
- All 5 test PDFs generated successfully
- Span elements in structure tree
- Language attribute in BDC operator (`/Span <</Lang (en-US)/MCID n>> BDC`)
- Combines with Strong/Em
- Works in lists

---

## Sprint 15 (COMPLETED)
**Quote and BlockQuote Elements**

- **Status**: Inline and block-level quotation elements implemented
- **Key Feature**: Semantic markup for quoted content

**What's been implemented:**
- `src/modules/structure_tree.js` - Quote/BlockQuote methods added
- `beginQuote(options)` / `endQuote()` - Inline quotation (like HTML `<q>`)
- `beginBlockQuote(options)` / `endBlockQuote()` - Block quotation (like HTML `<blockquote>`)
- `options.lang` - Optional language code for foreign-language quotes
- Works within P, LBody, TD, etc. (Quote) and as block-level (BlockQuote)

**API Usage:**
```javascript
// Inline quote within a paragraph
doc.beginStructureElement('P');
doc.text('Er sagte: ', 10, 40);

doc.beginQuote();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('"Hallo Welt"', x, 40);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endQuote();

doc.text(' und ging.', x, 40);
doc.endStructureElement();

// Block-level quote (separate from paragraph)
doc.beginStructureElement('P');
doc.text('Descartes schrieb:', 10, 40);
doc.endStructureElement();

doc.beginBlockQuote();
doc.setFont("AtkinsonHyperlegible", "italic");
doc.text('"Ich denke, also bin ich."', 20, 55);
doc.setFont("AtkinsonHyperlegible", "normal");
doc.endBlockQuote();

// Quote with language change (English in German document)
doc.setLanguage('de-DE');
doc.beginStructureElement('P');
doc.text('Shakespeare schrieb: ', 10, 40);

doc.beginQuote({ lang: 'en-GB' });
doc.text('"To be or not to be"', x, 40);
doc.endQuote();

doc.text('.', x, 40);
doc.endStructureElement();
```

**Difference Quote vs BlockQuote:**
| Element | Level | Use Case |
|---------|-------|----------|
| Quote | Inline | Short quotes within flowing text |
| BlockQuote | Block | Longer quotes as separate paragraphs |

**Screen Reader Behavior:**
- Quote: May announce "quote" or change intonation
- BlockQuote: Announces "block quote" on entry/exit
- With `lang`: Changes pronunciation for foreign-language quotes

**Test Results:**
- All 6 test PDFs generated successfully
- Quote/BlockQuote elements in structure tree
- Language attribute works for foreign quotes
- Combines with Strong/Em/Span
- Works in lists
- German umlauts correct

---

## Sprint 16 (COMPLETED)
**Code Element for Programming Code**

- **Status**: Code structure element implemented for inline and block code
- **Key Feature**: Semantic markup for computer code, commands, file paths

**What's been implemented:**
- `src/modules/structure_tree.js` - Code methods added
- `beginCode(options)` / `endCode()` - Code element wrapper
- `options.lang` - Optional language code for code comments
- Works as inline element within P, LBody, TD, etc.
- Works as block-level element for multi-line code
- Combines with Strong/Em for highlighted code

**API Usage:**
```javascript
// Inline code within paragraph
doc.beginStructureElement('P');
doc.text('Die Variable ', 10, 40);

doc.beginCode();
doc.text('counter', x, 40);
doc.endCode();

doc.text(' speichert den Zahler.', x, 40);
doc.endStructureElement();

// Block-level code (multi-line)
doc.beginStructureElement('P');
doc.text('JavaScript Funktion:', 10, 40);
doc.endStructureElement();

doc.beginCode();
doc.text('function greet(name) {', 15, 55);
doc.text('  return "Hello, " + name;', 15, 63);
doc.text('}', 15, 71);
doc.endCode();

// Code with language change (for English comments in German doc)
doc.setLanguage('de-DE');
doc.beginCode({ lang: 'en-US' });
doc.text('// Initialize the counter', 15, 55);
doc.text('let count = 0;', 15, 63);
doc.endCode();
```

**Screen Reader Behavior:**
- Code (Inline): May announce "code" or read content as-is
- Code (Block): May announce "code block" on entry/exit
- With `lang`: Changes pronunciation for code comments

**Test Results:**
- All 6 test PDFs generated successfully
- Code elements in structure tree (`/S /Code`)
- Language attribute works for code comments
- Combines with Strong/Em
- Works in lists
- German text around code works correctly

**Screenreader-Verhalten (2025-12-11 - RESOLVED):**
- Screenreader lesen Code-Elemente normalerweise nicht explizit vor (erwartetes Verhalten)
- Kein Referenz-PDF mit Code-Elementen in der offiziellen PDF/UA Reference Suite
- NVDA zeigt keinen expliziten Hinweis auf Code-Blocke an - dies ist korrekt
- Status: **Verifiziert und abgeschlossen** - keine weiteren Aktionen erforderlich

---

## Sprint 17 (COMPLETED)
**Note and Reference for Footnotes/Endnotes**

- **Status**: Footnote structure elements implemented
- **Key Feature**: Semantic markup for footnotes and endnotes with proper linking

**What's been implemented:**
- `src/modules/structure_tree.js` - Note/Reference methods added
- `beginReference(options)` / `endReference()` - Footnote reference in text
- `beginNote(options)` / `endNote()` - Footnote content
- `options.id` - Unique ID for PDF/UA compliance
- Works with Lbl element for numbering
- Supports both footnotes (page bottom) and endnotes (document end)

**API Usage:**
```javascript
// Main text with footnote reference
doc.beginStructureElement('P');
doc.text('Ein wichtiger Satz', 10, 40);

doc.beginReference();
doc.beginStructureElement('Lbl');
doc.setFontSize(8);
doc.text('1', x, 37);  // superscript
doc.setFontSize(12);
doc.endStructureElement();
doc.endReference();

doc.text(' mit Quellenangabe.', x, 40);
doc.endStructureElement();

// Footnote at bottom of page
doc.beginNote({ id: 'fn1' });
  doc.beginStructureElement('Lbl');
  doc.text('1', 10, 272);
  doc.endStructureElement();

  doc.beginStructureElement('P');
  doc.text('Hier steht die Erklarung.', 15, 272);
  doc.endStructureElement();
doc.endNote();
```

**Structure Hierarchy:**
```
P (Paragraph)
+-- "Text content"
+-- Reference
|   +-- Lbl ("1")
+-- "more text"

Note (id="fn1")
+-- Lbl ("1")
+-- P ("Footnote explanation text")
```

**Screen Reader Behavior (expected):**
- Reference: Should announce "footnote reference" or similar
- Note: Should announce "footnote" on entry
- Navigation: AT should allow jumping between Reference and Note

**Test Results:**
- All 5 test PDFs generated successfully
- Reference elements in structure tree (`/S /Reference`)
- Note elements in structure tree (`/S /Note`)
- Lbl elements correctly nested
- Multiple footnotes work
- Endnotes on separate page work
- German academic text with umlauts works

---

## Sprint 18 (COMPLETED)
**Caption Element for Figure/Table Descriptions**

- **Status**: Implementation complete, screenreader verified
- **Key Feature**: Semantic markup for figure captions and table titles

**What's been implemented:**
- `src/modules/structure_tree.js` - Caption and Figure methods added
- `beginCaption(options)` / `endCaption()` - Caption element wrapper
- `beginFigure(options)` / `endFigure()` - Figure container element
- `options.lang` - Optional language code for foreign-language captions
- Works with Figure (images) and Table elements
- Support for numbered captions ("Abbildung 1:", "Tabelle 1:")

**API Usage:**
```javascript
// Figure with caption
doc.beginFigure();
  doc.addImage({ imageData, x, y, width, height, alt: 'Image description' });
  doc.beginCaption();
    doc.text('Abbildung 1: Beschreibung des Bildes', x, y);
  doc.endCaption();
doc.endFigure();

// Table with caption
doc.beginStructureElement('Table');
  doc.beginCaption();
    doc.text('Tabelle 1: Quartalsumsatze 2024', x, y);
  doc.endCaption();
  // ... table content ...
doc.endStructureElement();

// Caption with different language
doc.beginCaption({ lang: 'en-US' });
  doc.text('Figure 1: English caption in German document', x, y);
doc.endCaption();
```

**Difference Figure vs addImage:**
| Method | Use Case |
|--------|----------|
| `addImage()` | Simple images without caption |
| `beginFigure()` | Images with captions, grouped images |

**Test Results:**
- All 6 test PDFs generated successfully
- Caption elements in structure tree (`/S /Caption`)
- Figure elements in structure tree (`/S /Figure`)
- Language attribute works for foreign-language captions
- Works with tables
- Screenreader verification successful

---

## Sprint 19 (COMPLETED)
**TOC Structure + Bookmarks Navigation**

- **Status**: Implemented and verified with screenreader
- **Key Features**: Semantic TOC markup + PDF bookmarks for navigation

**Part 1: TOC/TOCI Structure Elements (BITi 02.1.1)**
- `beginTOC(options)` / `endTOC()` - TOC container element
- `beginTOCI(options)` / `endTOCI()` - TOC item element
- Nested TOC support for subsections
- Works with Reference elements for entry text
- Optional `lang` parameter for language changes

**Part 2: Bookmarks/Lesezeichen (BITi 13 - Navigation)**
- Uses existing jsPDF outline API: `doc.outline.add(parent, title, { pageNumber })`
- Hierarchical bookmarks (nested structure)
- Navigation verified with NVDA screenreader
- Required for PDF/UA compliance in multi-page documents

**API Usage:**
```javascript
// TOC structure
doc.beginTOC();
  doc.beginTOCI();
    doc.beginReference();
    doc.text('1. Einleitung .......... 3', 20, 45);
    doc.endReference();
  doc.endTOCI();
doc.endTOC();

// Bookmarks (matching TOC)
doc.outline.add(null, '1. Einleitung', { pageNumber: 3 });

// Nested bookmarks
const chap1 = doc.outline.add(null, '1. Grundlagen', { pageNumber: 2 });
doc.outline.add(chap1, '1.1 Definitionen', { pageNumber: 3 });
```

**PDF/UA Requirements (from research):**
- Bookmarks are **required** for multi-page documents (BITi 13)
- Links in TOC are **optional** - not required for PDF/UA compliance
- TOC structure must use TOC/TOCI elements when present

**Test Results:**
- TOC structure recognized by screenreader
- Bookmarks panel accessible via F6 navigation
- Hierarchical bookmarks work correctly
- Navigation to target pages successful

**Future Enhancement (Optional):**
- Link annotations in TOC entries (clickable TOC) - not required for PDF/UA

---

## Sprint 20 (COMPLETED)
**Artifacts for Headers, Footers, and Decorative Content**

- **Status**: Implemented and verified with screenreader
- **Key Feature**: Content marked as artifacts is ignored by screen readers

**Artifact API (BITi 01.0, 01.1):**
- `beginArtifact(options)` / `endArtifact()` - General artifact wrapper
- `beginHeader()` / `endHeader()` - Convenience for page headers
- `beginFooter()` / `endFooter()` - Convenience for page footers
- Supported types: `Pagination`, `Layout`, `Page`, `Background`
- Supported subtypes: `Header`, `Footer`

**API Usage:**
```javascript
// Header (ignored by screen reader)
doc.beginHeader();
doc.text('Document Title', 20, 15);
doc.endHeader();

// Main content (read by screen reader)
doc.beginStructureElement('P');
doc.text('This content is read aloud.', 20, 50);
doc.endStructureElement();

// Footer with page number (ignored)
doc.beginFooter();
doc.text('Page 1', 100, 285, { align: 'center' });
doc.endFooter();

// Decorative line (ignored)
doc.beginArtifact({ type: 'Layout' });
doc.line(20, 100, 190, 100);
doc.endArtifact();
```

**PDF/UA Requirements:**
- Headers/footers MUST use `/Type/Pagination` with `/Subtype/Header` or `/Subtype/Footer`
- Decorative elements should use `/Type/Layout`
- Artifacts are NOT part of the structure tree

**Test Results:**
- Header text not read by NVDA
- Footer text not read by NVDA
- Main content correctly read
- Artifact markers correct in PDF stream

---

## Sprint 21 (COMPLETED)
**Accessible Form Fields (AcroForm + PDF/UA)**

- **Status**: Implemented and verified
- **Key Feature**: Form fields with structure tree integration for screen reader accessibility

**What's been implemented:**
- `beginFormField()` / `endFormField()` - Form structure element wrapper
- `addFormFieldRef()` - Links form field to structure tree via OBJR
- TextField support with TU (tooltip/accessible name)
- Checkbox and ComboBox support
- Required field indication
- Widget annotation StructParent integration

**BITi Prüfschritte:**
- BITi 02.4.2 - Formulare (Form fields)

---

## Sprint 22 (COMPLETED - 2025-12-12)
**Abbreviations + Formula Elements**

- **Status**: Implemented and verified
- **Key Features**:
  - Abbreviations with expansion text (/E attribute) for screen readers
  - Formula elements with alternative text for mathematical expressions

### Part 1: Abbreviations (BITi 02.2.3.1)

**What's been implemented:**
- `beginAbbreviation(expansion, options)` / `endAbbreviation()` - Abbreviation wrapper
- `/E` (Expansion) attribute in structure element
- Uses Span element with /E attribute per PDF 1.7 spec (14.9.5)
- Optional `lang` attribute for foreign abbreviations

**API Usage:**
```javascript
// Simple abbreviation
doc.beginStructureElement('P');
doc.text('Die ', 10, 40);

doc.beginAbbreviation('Europäische Union');
doc.text('EU', x, 40);
doc.endAbbreviation();

doc.text(' hat 27 Mitgliedsstaaten.', x, 40);
doc.endStructureElement();

// English abbreviation in German document
doc.beginAbbreviation('World Wide Web Consortium', { lang: 'en-US' });
doc.text('W3C', x, 40);
doc.endAbbreviation();

// Units
doc.beginAbbreviation('Kilogramm');
doc.text('kg', x, y);
doc.endAbbreviation();
```

**Use Cases:**
- Acronyms (PDF, HTML, EU, WHO)
- Technical abbreviations (API, CSS)
- Units (kg, cm, °C, kW)
- Professional titles (Dr., Prof., Dipl.-Ing.)

**Screen Reader Behavior:**
- NVDA/JAWS reads the expansion text alongside the abbreviation
- Example: "EU" is read as "Europäische Union" or "EU, Europäische Union"

### Part 2: Formula (BITi 02.4.0)

**What's been implemented:**
- `beginFormula(alt, options)` / `endFormula()` - Formula wrapper
- `/Alt` attribute (REQUIRED for PDF/UA compliance)
- `/Placement /Block` attribute for block-level formulas
- Optional `lang` attribute for formula descriptions

**API Usage:**
```javascript
// Inline formula
doc.beginStructureElement('P');
doc.text('Die Formel ', 10, 40);

doc.beginFormula('E gleich m mal c Quadrat');
doc.text('E = mc²', x, 40);
doc.endFormula();

doc.text(' beschreibt die Masse-Energie-Äquivalenz.', x, 40);
doc.endStructureElement();

// Block-level formula
doc.beginFormula('a Quadrat plus b Quadrat gleich c Quadrat', { placement: 'Block' });
doc.text('a² + b² = c²', 80, 65);
doc.endFormula();

// Chemical formula
doc.beginFormula('H 2 O, zwei Wasserstoffatome und ein Sauerstoffatom');
doc.text('H₂O', x, y);
doc.endFormula();
```

**Use Cases:**
- Mathematical equations (E=mc², a²+b²=c²)
- Chemical formulas (H₂O, CO₂)
- Physics formulas (F=ma, v=s/t)
- Statistical expressions (Σ, μ, σ)

**PDF/UA Requirements:**
- Formula MUST have /Alt attribute (alternative text)
- Formula is inline by default
- Use `placement: 'Block'` for block-level display
- Alt text should be a readable description (not LaTeX/MathML)

**Screen Reader Behavior:**
- Screen reader reads the alt text instead of the visual formula
- Example: "E = mc²" is read as "E gleich m mal c Quadrat"

**Test Results:**
- All abbreviation tests pass (6 test cases)
- All formula tests pass (8 test cases)
- Validation tests pass (missing expansion/alt throws error)
- PDF structure verified (/E and /Alt attributes present in BDC operators)
- NVDA correctly reads expansion text for abbreviations
- NVDA correctly reads alt text for formulas

**Critical Implementation Detail:**
The `/E` and `/Alt` attributes MUST be in the **BDC operator** (content stream), not just in the Structure Element dictionary. Screen readers read attributes from the content stream.

Correct format:
```
/Span <</Lang (de-DE)/MCID 2/E (Europäische Union)>> BDC
/Formula <</Lang (de-DE)/MCID 3/Alt (E gleich m c Quadrat)>> BDC
```

**Best Practice for Formulas:**
- Tag the **entire equation** as one Formula element
- Do NOT split parts of an equation into separate Formula elements
- Example: `sin²x + cos²x = 1` → one Formula with alt "Sinus Quadrat x plus Kosinus Quadrat x gleich eins"

---

## Sprint 23 (COMPLETED - 2025-12-12)
**BibEntry + Index Elements**

- **Status**: Implemented and verified
- **Key Features**:
  - BibEntry for bibliography/reference entries
  - Index for document subject/keyword indexes

### Part 1: BibEntry (BITi 02.3.4)

**What's been implemented:**
- `beginBibEntry(options)` / `endBibEntry()` - Bibliography entry wrapper
- Optional `lang` attribute for entries in different languages
- Inline-level structure element

**API Usage:**
```javascript
// Bibliography list
doc.beginStructureElement('H2');
doc.text('Literaturverzeichnis', 10, 100);
doc.endStructureElement();

doc.beginListNumbered();
  doc.beginListItem();
    doc.addListLabel('[1]', 10, 120);
    doc.beginListBody();
      doc.beginBibEntry();
      doc.text('ISO 14289-1:2014. PDF/UA-1 Standard.', 25, 120);
      doc.endBibEntry();
    doc.endListBody();
  doc.endStructureElement();
doc.endList();

// Inline citation
doc.beginStructureElement('P');
doc.text('As described in ', 10, 40);
doc.beginBibEntry();
doc.text('(Müller, 2023)', x, 40);
doc.endBibEntry();
doc.text(', accessibility is important.', x, 40);
doc.endStructureElement();
```

**Use Cases:**
- Academic paper references
- Book citations (APA, MLA, etc.)
- Journal article references
- Web resource citations
- Inline citations in running text

### Part 2: Index (BITi 02.1.2)

**What's been implemented:**
- `beginIndex(options)` / `endIndex()` - Index container wrapper
- `addIndexEntry(term, pageRefs, x, y)` - Convenience method for index entries
- Grouping-level structure element

**API Usage:**
```javascript
// Heading OUTSIDE of Index (best practice)
doc.beginStructureElement('H2');
doc.text('Stichwortverzeichnis', 10, 100);
doc.endStructureElement();

doc.beginIndex();
  doc.beginList();
    doc.addIndexEntry('Accessibility', '12, 45, 78', 15, 120);
    doc.addIndexEntry('Barrierefreiheit', '23, 56', 15, 135);
  doc.endList();
doc.endIndex();

// Alphabetical sections
doc.beginIndex();
  doc.beginStructureElement('P');
  doc.text('A', 10, 40);  // Section header
  doc.endStructureElement();

  doc.beginList();
    doc.addIndexEntry('Alternativtext', '15, 23', 15, 55);
    doc.addIndexEntry('Annotation', '45, 67', 15, 70);
  doc.endList();
doc.endIndex();
```

**Best Practices:**
- Place heading (e.g., "Index") OUTSIDE the Index element
- Avoid H1-H6 elements inside Index
- Use lists (L, LI) to organize entries
- Nested lists for sub-entries

**Test Results:**
- 6 BibEntry test cases pass
- 6 Index test cases pass
- PDF structure verified (/S /BibEntry and /S /Index present)

---

## Sprint 24 (IN PROGRESS - 2025-12-12)
**NonStruct/Private + Art/Sect/Div/Part Grouping Elements**

### Part 1: NonStruct and Private (BITi 02.1.2)

**What's been implemented:**
- `beginNonStruct(options)` / `endNonStruct()` - NonStruct element wrapper
- `beginPrivate(options)` / `endPrivate()` - Private element wrapper

**NonStruct API:**
```javascript
// NonStruct: Content IS accessible to screen readers
// Used for layout/grouping without semantic meaning
doc.beginNonStruct();
  doc.beginStructureElement('P');
  doc.text('This content is accessible.', 10, 30);
  doc.endStructureElement();
doc.endNonStruct();

// Two-column layout example
doc.beginNonStruct();
  doc.beginStructureElement('P');
  doc.text('Left column', 10, 30);
  doc.endStructureElement();
doc.endNonStruct();

doc.beginNonStruct();
  doc.beginStructureElement('P');
  doc.text('Right column', 110, 30);
  doc.endStructureElement();
doc.endNonStruct();
```

**Private API:**
```javascript
// Private: Content is IGNORED by screen readers
// Used for internal/application-specific content
doc.beginPrivate();
  doc.beginStructureElement('P');
  doc.text('Internal note: reviewed 2024-01-15', 10, 30);
  doc.endStructureElement();
doc.endPrivate();
```

**Key Differences:**
- **NonStruct**: Content IS read by screen readers, grouping has no semantic meaning
- **Private**: Content is IGNORED by screen readers, for application-internal use
- **Artifact**: For decorative content (use beginArtifact() instead)

**Implementation Decision for Private:**

According to [BITi 02.1.2](https://biti-wiki.de/index.php?title=BITi_02.1.2):
> "Private spielt in der Praxis keine Rolle und kann mitsamt seinem Inhalt ignoriert werden."
> "wird weder interpretiert noch beim Konvertieren in andere Dokumentformate exportiert.
> Auch die von Private gruppierten Elemente werden weder exportiert noch interpretiert."

**Problem:** When implementing Private as a pure `/S /Private` structure element,
screen readers like NVDA still read the content - they don't correctly ignore it.

**Solution:** We use a dual approach:
1. Create proper `/S /Private` structure element (for PDF/UA validator compliance)
2. Mark child content as Artifact in content stream (for reliable screen reader behavior)

This ensures:
- PDF/UA validators see correct structure (`/S /Private`)
- Screen readers reliably ignore the content (via `/Artifact` BDC marking)

If future PDF/UA validators complain about artifacts inside Private elements,
we could add an option to disable the artifact wrapping.

### Part 2: Art/Sect/Div/Part (BITi 02.1.0)

**What's been implemented:**
- `beginPart(options)` / `endPart()` - Major document divisions
- `beginArt(options)` / `endArt()` - Self-contained articles
- `beginSect(options)` / `endSect()` - Sections within documents/parts
- `beginDiv(options)` / `endDiv()` - Generic container (use sparingly)

**Part API (Major Divisions):**
```javascript
// Book with multiple parts
doc.beginStructureElement('Document');
  doc.beginPart();
    doc.beginStructureElement('H1');
    doc.text('Part I: Foundations', 10, 20);
    doc.endStructureElement();
    // Chapters...
  doc.endPart();

  doc.beginPart();
    doc.beginStructureElement('H1');
    doc.text('Part II: Advanced Topics', 10, 150);
    doc.endStructureElement();
    // More chapters...
  doc.endPart();
doc.endStructureElement();
```

**Sect API (Sections/Chapters):**
```javascript
// Nested sections
doc.beginSect();
  doc.beginStructureElement('H1');
  doc.text('Chapter 1', 10, 20);
  doc.endStructureElement();

  doc.beginSect();
    doc.beginStructureElement('H2');
    doc.text('1.1 Introduction', 10, 40);
    doc.endStructureElement();
  doc.endSect();

  doc.beginSect();
    doc.beginStructureElement('H2');
    doc.text('1.2 Methods', 10, 80);
    doc.endStructureElement();
  doc.endSect();
doc.endSect();
```

**Art API (Articles):**
```javascript
// Magazine with multiple articles
doc.beginArt();
  doc.beginStructureElement('H2');
  doc.text('First Article Title', 10, 20);
  doc.endStructureElement();
  doc.beginStructureElement('P');
  doc.text('Article content...', 10, 35);
  doc.endStructureElement();
doc.endArt();

doc.beginArt();
  doc.beginStructureElement('H2');
  doc.text('Second Article Title', 10, 80);
  doc.endStructureElement();
  doc.beginStructureElement('P');
  doc.text('Another article...', 10, 95);
  doc.endStructureElement();
doc.endArt();
```

**Div API (Generic Container):**
```javascript
// Avoid using Div when possible - prefer Sect or Art
doc.beginDiv();
  doc.beginStructureElement('P');
  doc.text('Grouped content', 10, 30);
  doc.endStructureElement();
doc.endDiv();
```

**Best Practices:**
- Use Part for book parts, volumes, major divisions
- Use Sect for chapters, sections, subsections
- Use Art for independent articles (magazines, news)
- Avoid Div - prefer semantic elements (Sect, Art)
- NonStruct for layout without semantics
- Private for internal/application content (not user-facing)

**Test Files:**
- test-nonstruct-1-basic.pdf: Basic NonStruct usage
- test-nonstruct-2-columns.pdf: Two-column layout
- test-nonstruct-3-nested.pdf: Nested NonStruct elements
- test-private-1-basic.pdf: Basic Private usage
- test-private-2-notes.pdf: Internal document notes
- test-nonstruct-private-comparison.pdf: Direct comparison
- test-grouping-1-sect.pdf: Simple Sect usage
- test-grouping-2-nested-sect.pdf: Nested sections
- test-grouping-3-art.pdf: Magazine-style articles
- test-grouping-4-part.pdf: Book with Parts
- test-grouping-5-div.pdf: Generic Div container
- test-grouping-6-complete.pdf: Complete document structure
- test-grouping-7-multipage.pdf: Multi-page with grouping

---

## Sprint 25 (IN PROGRESS - 2025-12-12)
**Ruby/Warichu CJK Annotations**

### Part 1: Ruby (BITi 02.3.3)

Ruby is a small annotation text placed adjacent to base text, typically used
for pronunciation guides in East Asian languages (furigana, pinyin, etc.).

**What's been implemented:**
- `beginRuby(options)` / `endRuby()` - Ruby annotation assembly wrapper
- `beginRubyBaseText(options)` / `endRubyBaseText()` - RB element (base text)
- `beginRubyText(options)` / `endRubyText()` - RT element (annotation text)
- `beginRubyPunctuation()` / `endRubyPunctuation()` - RP element (fallback parentheses)

**Ruby Structure (ISO 32000-1 Table 338):**
```
Ruby
├── RB (Ruby Base Text) - full-size base text
└── RT (Ruby Text) - smaller annotation text

Or with fallback:
Ruby
├── RB (Ruby Base Text)
├── RP (opening parenthesis)
├── RT (Ruby Text)
└── RP (closing parenthesis)
```

**API Usage:**
```javascript
// Japanese kanji with furigana reading
doc.beginRuby({ lang: 'ja-JP' });
  doc.beginRubyBaseText();
  doc.text('漢字', 10, 30);  // Kanji base text
  doc.endRubyBaseText();
  doc.beginRubyText({ rubyPosition: 'Before' });
  doc.setFontSize(8);
  doc.text('かんじ', 10, 25);  // Hiragana reading above
  doc.setFontSize(14);
  doc.endRubyText();
doc.endRuby();

// With fallback parentheses for non-Ruby readers
doc.beginRuby();
  doc.beginRubyBaseText();
  doc.text('東京', 10, 30);
  doc.endRubyBaseText();
  doc.beginRubyPunctuation();
  doc.text('(', 30, 30);
  doc.endRubyPunctuation();
  doc.beginRubyText();
  doc.text('とうきょう', 35, 30);
  doc.endRubyText();
  doc.beginRubyPunctuation();
  doc.text(')', 70, 30);
  doc.endRubyPunctuation();
doc.endRuby();
```

**Attributes:**
- `lang`: Language code (e.g., 'ja-JP', 'zh-CN', 'ko-KR')
- `rubyAlign`: 'Start', 'Center', 'End', 'Justify', 'Distribute'
- `rubyPosition`: 'Before', 'After', 'Warichu', 'Inline'

### Part 2: Warichu (BITi 02.3.3)

Warichu is a comment or annotation in smaller text formatted into two lines
within the height of the containing text line. Traditional Japanese typography.

**What's been implemented:**
- `beginWarichu(options)` / `endWarichu()` - Warichu assembly wrapper
- `beginWarichuText()` / `endWarichuText()` - WT element (annotation text)
- `beginWarichuPunctuation()` / `endWarichuPunctuation()` - WP element

**Warichu Structure:**
```
Warichu
├── WP (opening punctuation, optional)
├── WT (warichu text in two lines)
└── WP (closing punctuation, optional)
```

**API Usage:**
```javascript
doc.text('Main text ', 10, 30);
doc.beginWarichu({ lang: 'ja-JP' });
  doc.beginWarichuPunctuation();
  doc.text('(', 50, 30);
  doc.endWarichuPunctuation();
  doc.beginWarichuText();
  doc.setFontSize(8);
  doc.text('inline comment', 55, 30);
  doc.setFontSize(14);
  doc.endWarichuText();
  doc.beginWarichuPunctuation();
  doc.text(')', 100, 30);
  doc.endWarichuPunctuation();
doc.endWarichu();
doc.text(' continues.', 103, 30);
```

**Use Cases:**
- Furigana in Japanese (hiragana above kanji)
- Pinyin in Chinese (romanization above hanzi)
- Bopomofo/Zhuyin in Traditional Chinese
- Korean hanja pronunciation guides
- Inline comments in Japanese text

**Note:** Full visual rendering of Ruby/Warichu requires CJK fonts.
The PDF structure is correct for accessibility even without CJK fonts.

**Testing Limitation:**
This feature could not be fully tested with a screen reader due to:
- No CJK fonts installed for proper rendering
- Western screen readers (NVDA) may not fully support Ruby/Warichu announcements
- Testing would require Japanese/Chinese screen reader configuration

The PDF structure has been verified with qpdf to contain correct elements
(`/S /Ruby`, `/S /RB`, `/S /RT`, `/S /RP`, `/S /Warichu`, `/S /WT`, `/S /WP`).
Basic readability of test files was confirmed.

**Test Files:**
- test-ruby-1-simple.pdf: Basic Ruby structure
- test-ruby-2-fallback.pdf: Ruby with RP fallback parentheses
- test-ruby-3-japanese.pdf: Japanese Ruby structure simulation
- test-warichu-1-simple.pdf: Basic Warichu structure
- test-ruby-4-multiple.pdf: Multiple Ruby annotations
- test-ruby-warichu-complete.pdf: Complete document

---

## Critical Learnings

### PDF/UA Structure Requirements
- PDF/UA structure tree REQUIRES marked content to work properly
- Acrobat Reader treats content without BDC/EMC as untagged (shows "empty page")
- **CRITICAL**: `/Lang` attribute MUST be present in EVERY BDC operator, not just in Catalog
  - Without `/Lang` in BDC: Acrobat shows "AVPageView Textrahmen" (treats content as artifact)
  - With `/Lang` in BDC: Content is recognized as tagged and readable by screen readers
  - Format: `/StructType <</Lang (language-code)/MCID n>> BDC`
- **CRITICAL**: `/E` and `/Alt` attributes MUST be in BDC operator for screen readers to read them
  - Placing them only in Structure Element dictionary is NOT sufficient
  - Format: `/Span <</Lang (lang)/MCID n/E (expansion)>> BDC`
- Firefox is more lenient and displays text even without proper tagging
- Always test with Acrobat Reader + screen reader for true PDF/UA compliance
- Reference PDFs consistently include `/Lang` in every BDC operator

### Testing Protocol
- The project maintainer tests with a screen reader (Acrobat Reader + screen reader)
- When working on PDF/UA features, always verify:
  1. Text displays in Acrobat Reader (not just Firefox)
  2. Structure tree exists (if implemented)
  3. Content is tagged with BDC/EMC operators (if structure tree exists)
  4. Screen reader can navigate and read the content
  5. Test file: Generate PDF -> Open in Acrobat Reader -> Verify with screen reader
