# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

jsPDF is a library for generating PDF documents in JavaScript. It runs in both browser and Node.js environments, with multiple module formats (UMD, ES, CJS). The project is co-maintained by MrRio and yWorks.

## Build System

The project uses Rollup for bundling with Babel for transpilation:

- **Build all formats**: `npm run build`
- **Start local dev server**: `npm start` (uses local-web-server on port 8000)
- **Build outputs**: Located in `dist/` directory
  - `jspdf.es.*.js` - ES2015 module format
  - `jspdf.node.*.js` - Node.js CJS format
  - `jspdf.umd.*.js` - UMD format for AMD/script-tag loading
  - `polyfills*.js` - Polyfills for older browsers

The build configuration is in `rollup.config.js` which creates multiple output formats from the same source.

## Testing

- **Run all tests**: `npm test` (builds first, then runs node tests + CI tests)
- **Unit tests only**: `npm run test-unit` (Karma with Chrome)
- **Node tests**: `npm run test-node` (Jasmine)
- **Local comprehensive tests**: `npm run test-local` (all deployment formats)
- **Individual format tests**:
  - `npm run test-amd`
  - `npm run test-esm`
  - `npm run test-globals`
  - `npm run test-typescript`
  - `npm run test-webworker`
- **Generate reference PDFs**: `npm run test-training` (runs reference server in background)

Tests are in `test/` with two main categories:
- `test/specs/` - Feature-specific unit tests
- `test/deployment/` - Module format integration tests

Tests compare generated PDFs against reference files in the test directory.

## Code Formatting & Linting

- **Format code**: `npm run prettier`
- **Check formatting**: `npm run lint`

Always run prettier before committing. The project uses Prettier with config in `.prettierrc`.

## Architecture

### Module System

The library uses a plugin-based architecture defined in `modules.conf.js` which specifies dependencies between modules:

**Core Files:**
- `src/jspdf.js` (~6130 lines) - Main jsPDF class with core PDF generation logic
- `src/index.js` - Entry point that imports core + all plugins

**Plugin Modules** (in `src/modules/`):
- `addimage.js` - Image embedding (JPEG, PNG, GIF, BMP, WebP support via separate plugins)
- `acroform.js` - PDF form fields
- `annotations.js` - Comments, links, etc.
- `canvas.js` - Canvas API support
- `context2d.js` - 2D rendering context (depends on canvas, addimage, font metrics)
- `html.js` - HTML to PDF conversion (dynamically loads html2canvas & dompurify)
- `ttfsupport.js` - TrueType font support
- `utf8.js` - UTF-8 text handling with BiDi support
- `svg.js` - SVG rendering
- `cell.js` - Table cell rendering
- `split_text_to_size.js` - Text wrapping
- `standard_fonts_metrics.js` - Metrics for 14 standard PDF fonts
- `vfs.js` - Virtual file system for fonts
- `xmp_metadata.js` - XMP metadata support
- `autoprint.js`, `javascript.js`, `outline.js`, `total_pages.js`, `viewerpreferences.js`, etc.

**Library Files** (in `src/libs/`):
- `rgbcolor.js` - Color parsing
- `ttffont.js` - TTF font parsing
- `bidiEngine.js` - Bidirectional text processing
- `pdfsecurity.js` - PDF encryption (uses md5.js, rc4.js)
- Image decoders: `BMPDecoder.js`, `WebPDecoder.js`, `JPEGEncoder.js`, `omggif.js`
- `FileSaver.js`, `Blob.js` - File saving (browser only)
- `globalObject.js`, `console.js`, `AtobBtoa.js` - Environment abstraction

### API Modes

jsPDF has two API modes that can be switched:
- **"compat" mode** (default) - Original API, compatible with old plugins
- **"advanced" mode** - Extended API with transformation matrices, patterns, FormObjects

Switch modes using:
```javascript
doc.advancedAPI(doc => { /* your code */ });
doc.compatAPI(doc => { /* your code */ });
```

### Optional Dependencies

Some features require optional dependencies loaded dynamically:
- `html2canvas` - For HTML rendering
- `dompurify` - For HTML sanitization
- `canvg` - For SVG rendering

### Module Format Handling

The build uses preprocessor directives (`// @if MODULE_FORMAT!='cjs'`) to conditionally include code based on target format (UMD, ES, CJS). For example, FileSaver is only imported in browser builds, not in Node builds.

## Development Workflow

1. Install dependencies: `npm install`
2. Make changes to source files in `src/`
3. Run `npm run prettier` to format code
4. Run `npm run build` to compile
5. Test with `npm run test-local` (or `npm run test-unit` for faster iteration)
6. For new features, add tests in `test/specs/`
7. Update TypeScript types in `types/index.d.ts`
8. Do NOT commit built files in `dist/` for regular PRs (only for releases)

## Custom Font Integration

To use custom TrueType fonts:
1. Load .ttf file as binary string
2. Use `doc.addFileToVFS("FontName.ttf", binaryString)`
3. Use `doc.addFont("FontName.ttf", "FontName", "normal")`
4. Use `doc.setFont("FontName")`

Alternatively, use the fontconverter tool at `/fontconverter/fontconverter.html` to generate JS files.

## PDF Specification

The library implements parts of the PDF 1.3 specification. When adding features, ensure compliance with the PDF spec.

## PDF/UA Implementation

This project is currently implementing PDF/UA (Universal Accessibility) support in sprints:

**Current Status: Sprint 17 (COMPLETED ✅ - 2025-12-06)**

- ✅ **Sprint 1 (COMPLETED & VERIFIED)**: Basic PDF/UA mode, XMP metadata, DisplayDocTitle
  - Status: Text displays correctly in both Acrobat Reader and Firefox

- ✅ **Sprint 2+3 (COMPLETED & VERIFIED)**: Structure Tree + Marked Content system
  - **Status**: Content is now readable by screen readers in Acrobat Reader
  - **Issue Resolved**: "AVPageView Textrahmen" problem fixed by ensuring `/Lang` in BDC operators

  **What's been implemented and verified:**
  - ✅ StructTreeRoot with RoleMap and ParentTree
  - ✅ Document, H1-H6, P structure elements
  - ✅ Automatic MCID generation and BDC/EMC wrapping
  - ✅ ParentTree with indirect array objects (correct format)
  - ✅ /StructParents in page dictionaries
  - ✅ /Tabs /S for reading order
  - ✅ /Group with /Transparency for proper rendering
  - ✅ /Lang in Catalog AND in every BDC operator (CRITICAL FIX)
  - ✅ /K array format: `/K [0]` instead of `/K 0`
  - ✅ Complete parent hierarchy: Elements → Document → StructTreeRoot
  - ✅ Object numbering without collisions
  - ✅ MarkInfo with /Marked true
  - ✅ Content readable by screen readers (verified with test suite)

  **Critical Fix (2025-11-22):**
  - **Problem**: Acrobat Reader showed "AVPageView Textrahmen" instead of actual content
  - **Root Cause**: Missing `/Lang` attribute in BDC operators (src/jspdf.js:4099-4102)
  - **Solution**: Re-added `/Lang` attribute to BDC operators
  - **Format**: `/StructType <</Lang (language-code)/MCID n>> BDC`
  - **Verification**: 5 test PDFs with varying complexity all readable in Acrobat Reader

- ✅ **Sprint 4/5 (COMPLETED)**: Font Embedding with Atkinson Hyperlegible
  - **Status**: Automatic font embedding implemented and tested
  - **Font**: Atkinson Hyperlegible Regular (Braille Institute)
  - **Why**: Specifically designed for accessibility (low vision, magnification, character distinction)

  **What's been implemented:**
  - ✅ `src/modules/pdfua_fonts.js` - Font module with Base64-encoded Atkinson Hyperlegible (74 KB)
  - ✅ Auto-loading in `src/jspdf.js` - Font loaded automatically when `pdfUA: true`
  - ✅ No user configuration required - Works out of the box
  - ✅ VFS integration - Font added to Virtual File System
  - ✅ Font registration - Registered with jsPDF font system
  - ✅ Default font setting - Automatically set as active font
  - ✅ Test suite - 5 test PDFs verifying font embedding
  - ✅ Verification script - Shell script to check font embedding

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
  - ✅ Font embedded in all PDF/UA documents
  - ✅ FontFile2 present (TrueType font stream)
  - ✅ Regular PDFs do NOT include font (correct)
  - ✅ German umlauts work correctly (ä ö ü ß)
  - ✅ Screen reader testing (USER VERIFIED - successful)
  - ✅ veraPDF validation (ALL TESTS PASSED - PDF/UA-1 compliant)

  **veraPDF Validation Results (2025-11-22):**
  - ✅ `test-font-embedding-1.pdf` - PASS
  - ✅ `test-font-embedding-2.pdf` - PASS
  - ✅ `test-font-embedding-3.pdf` - PASS
  - ✅ `test-font-embedding-5-german.pdf` - PASS
  - ✅ All font embedding requirements met
  - ✅ Full PDF/UA-1 compliance achieved

  **Status:** ✅ **PRODUCTION READY** for text-based PDF/UA documents

- ✅ **Sprint 6 (COMPLETED)**: Images with Alternative Text
  - **Status**: Strict validation implemented and tested
  - **Key Feature**: Images MUST have alt text OR be marked as decorative

  **What's been implemented:**
  - ✅ `src/modules/addimage.js` - Extended addImage() with `alt` and `decorative` options
  - ✅ Strict validation - Throws errors for missing/empty alt text
  - ✅ Figure structure elements - Images wrapped in `/Figure` with `/Alt` attribute
  - ✅ Decorative images - Marked as `/Artifact` (skipped by screen readers)
  - ✅ BDC/EMC wrapping - Images properly tagged with marked content
  - ✅ Test suite - 6 comprehensive test cases
  - ✅ Validation tests - 7 tests for strict validation

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
  - ✅ All image tests pass
  - ✅ veraPDF validation passes
  - ✅ Screen reader testing successful (USER VERIFIED)
  - ✅ Errors thrown for missing/empty alt text

  **User Feedback (2025-11-22):**
  > "Ein sehr großes Ärgernis mit Bildern und Alternativtexten besteht darin,
  > dass sie sehr gerne vergessen werden."

  This led to implementing STRICT validation (errors, not warnings) to prevent forgetting alt text.

- ✅ **Sprint 7 (COMPLETED)**: Table Structures with Header Scope
  - **Status**: Full table accessibility implemented with veraPDF validation
  - **Key Feature**: Proper header-cell association for screen reader navigation

  **What's been implemented:**
  - ✅ `src/modules/structure_tree.js` - Table structure methods added
  - ✅ `beginTableHead()`, `beginTableBody()`, `beginTableFoot()` - Table sections
  - ✅ `beginTableRow()` - Convenience method for TR elements
  - ✅ `beginTableHeaderCell(scope)` - TH with Row/Column/Both scope
  - ✅ `beginTableDataCell()` - Convenience method for TD elements
  - ✅ Scope attribute in attribute dictionary - `/A << /O /Table /Scope /Column >>`
  - ✅ Test suite - 5 test cases covering simple to complex tables

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
  - ✅ All 4 table tests pass
  - ✅ veraPDF PDF/UA-1 validation passes
  - ✅ Simple tables (column headers only)
  - ✅ Tables with row headers
  - ✅ Complex tables with mixed headers
  - ✅ German language tables

  **Screen Reader Behavior:**
  When navigating to cell (2,2), screen reader announces:
  "Widget A, Q2, $12,000"
     ↑        ↑      ↑
   Row     Column  Cell
  header   header  value

  **User Requirement (2025-11-22):**
  > "Bei der Implementierung von Tabellen ist es wichtig, dass die Zeile und Spalte
  > für die Beschriftungen korrekt ausgezeichnet wird, damit der Screenreader bei
  > einer Navigation in den Tabellen die Überschriften von Zeilen und Spalten
  > korrekt ansagen kann."

- ✅ **Sprint 8 (COMPLETED)**: List Structures (ol/ul)
  - **Status**: Full list accessibility implemented with veraPDF validation
  - **Key Feature**: Lists with proper structure for screen reader navigation

  **What's been implemented:**
  - ✅ `src/modules/structure_tree.js` - List structure methods added
  - ✅ `beginList(numbered)` - Create unordered or ordered lists
  - ✅ `beginListNumbered()` - Convenience for ordered lists
  - ✅ `beginListItem()` - List item element
  - ✅ `addListLabel(label, x, y)` - Add bullet point or number
  - ✅ `beginListBody()` / `endListBody()` - List item content
  - ✅ `endList()` - Close list element
  - ✅ Nested lists support - Lists can contain other lists
  - ✅ Test suite - 5 test cases covering simple to nested lists

  **API Usage:**
  ```javascript
  // Unordered list (bullet points)
  doc.beginList();
    doc.beginListItem();
      doc.addListLabel('•', 15, 25);
      doc.beginListBody();
        doc.text('First item', 20, 25);
      doc.endListBody();
    doc.endStructureElement();

    doc.beginListItem();
      doc.addListLabel('•', 15, 35);
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
            doc.addListLabel('•', 25, 35);
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
  - ✅ All 5 list tests pass
  - ✅ veraPDF PDF/UA-1 validation passes (all 5 PDFs)
  - ✅ Simple unordered lists (bullet points)
  - ✅ Simple ordered lists (numbered)
  - ✅ Nested lists (multi-level)
  - ✅ Mixed nested lists (ordered + unordered)
  - ✅ German language lists

  **Structure Hierarchy:**
  ```
  L (List)
  ├─ LI (ListItem)
  │  ├─ Lbl (Label) - "•"
  │  └─ LBody (ListBody) - "Content"
  └─ LI (ListItem)
     └─ LBody (ListBody)
        └─ L (Nested List)
           └─ LI (ListItem)
              ├─ Lbl
              └─ LBody
  ```

  **Screen Reader Behavior:**
  When entering a list, screen reader announces:
  - "List with 3 items"
  - "Item 1 of 3, Bullet, First item"
  - For nested lists: announces sub-list separately

- ✅ **Sprint 9 (COMPLETED)**: Link Structures
  - **Status**: Link structure elements implemented with OBJR annotation connection
  - **Key Feature**: Accessible links with proper structure-annotation linkage

  **What's been implemented:**
  - ✅ `src/modules/structure_tree.js` - Link structure methods added
  - ✅ `beginLink()` / `endLink()` - Link structure element wrapper
  - ✅ OBJR (Object Reference) connection - Links annotation to structure tree
  - ✅ `/StructParent` attribute in annotations
  - ✅ External links (URLs) and internal links (page references)
  - ✅ Links work in paragraphs, lists, and tables

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
  - ✅ External links functional
  - ✅ Internal page links functional
  - ✅ Links in lists and tables
  - ✅ Screen reader announces links correctly

- ✅ **Sprint 10 (COMPLETED)**: Additional Font Styles (Bold, Italic, BoldItalic)
  - **Status**: All four Atkinson Hyperlegible font styles implemented
  - **Key Feature**: Complete typography support for accessible documents

  **What's been implemented:**
  - ✅ `src/modules/pdfua_fonts.js` - Extended with Bold, Italic, BoldItalic (~220KB additional)
  - ✅ `src/jspdf.js` - Auto-loads all four styles when `pdfUA: true`
  - ✅ `setFont()` API works for all styles
  - ✅ German umlauts in all styles

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
  - ✅ All 4 font styles available and working
  - ✅ Font embedding verified (FontFile2 streams)
  - ✅ German umlauts correct in all styles
  - ✅ Font styles work in lists and tables

- ✅ **Sprint 12 (COMPLETED)**: Comprehensive Test Document
  - **Status**: Multi-page test document demonstrating all features
  - **Key Feature**: Real-world example combining all implemented features

  **What's been implemented:**
  - ✅ `tests/pdfua/comprehensive-test.js` - Test document generator
  - ✅ 3-page PDF with all implemented features
  - ✅ German language throughout
  - ✅ All 4 font styles demonstrated

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
  - ✅ Document generates without errors
  - ✅ All features combined successfully
  - ✅ 99 KB file size (3 pages)

- ✅ **Sprint 13 (COMPLETED)**: Semantic Text Highlights (Strong/Em) + Font Detection Fix
  - **Status**: Strong/Em structure elements + screen reader font detection
  - **Key Feature**: Semantic markup AND proper font change announcements

  **What's been implemented:**

  **Part 1: Strong/Em Structure Elements**
  - ✅ `src/modules/structure_tree.js` - Strong/Em methods added
  - ✅ `beginStrong()` / `endStrong()` - Important text (semantic bold)
  - ✅ `beginEmphasis()` / `endEmphasis()` - Emphasized text (semantic italic)
  - ✅ Inline elements work within P, LBody, TD, etc.

  **Part 2: Font Detection Fix for Screen Readers**
  - ✅ `src/modules/utf8.js` - Font name generation based on style
  - ✅ Each font style now has unique PDF FontName:
    - `normal` → `/FontName /AtkinsonHyperlegible`
    - `bold` → `/FontName /AtkinsonHyperlegible-Bold`
    - `italic` → `/FontName /AtkinsonHyperlegible-Italic`
    - `bolditalic` → `/FontName /AtkinsonHyperlegible-BoldItalic`
  - ✅ Correct Flags for italic fonts (bit 6 set)
  - ✅ Correct ItalicAngle (-12°) for italic fonts
  - ✅ **Fully transparent** - no API changes required!

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
    - NVDA Settings → Document Formatting → Font attributes
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
  - ✅ All 5 test PDFs generated successfully
  - ✅ Strong/Em elements in structure tree
  - ✅ Font changes detected by NVDA (verified by user)
  - ✅ Behavior matches official PDF/UA reference documents
  - ✅ German umlauts work correctly

- ⏭️ **Sprint 11 (SKIPPED)**: Font-Subsetting
  - **Status**: Not necessary - already implemented
  - **Reason**: jsPDF already performs font subsetting during PDF export
    - Only used glyphs are embedded (`glyIdsUsed` in utf8.js)
    - WOFF2 compression not viable (PDF only supports TTF/OTF)
    - Bundle size (~700KB) acceptable for PDF/UA functionality
  - **Decision**: Focus on feature completeness instead of optimization

- ✅ **Sprint 14 (COMPLETED)**: Span Element for Inline Containers
  - **Status**: Span element with optional language attribute implemented
  - **Key Feature**: Generic inline container + language change support

  **What's been implemented:**
  - ✅ `src/modules/structure_tree.js` - Span methods added
  - ✅ `beginSpan(options)` / `endSpan()` - Generic inline container
  - ✅ `options.lang` - Optional language code for language changes
  - ✅ `src/jspdf.js` - BDC operator uses element's lang attribute if present
  - ✅ Works within P, LBody, TD, Strong, Em, etc.

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
  - ✅ All 5 test PDFs generated successfully
  - ✅ Span elements in structure tree
  - ✅ Language attribute in BDC operator (`/Span <</Lang (en-US)/MCID n>> BDC`)
  - ✅ Combines with Strong/Em
  - ✅ Works in lists

- ✅ **Sprint 15 (COMPLETED)**: Quote and BlockQuote Elements
  - **Status**: Inline and block-level quotation elements implemented
  - **Key Feature**: Semantic markup for quoted content

  **What's been implemented:**
  - ✅ `src/modules/structure_tree.js` - Quote/BlockQuote methods added
  - ✅ `beginQuote(options)` / `endQuote()` - Inline quotation (like HTML `<q>`)
  - ✅ `beginBlockQuote(options)` / `endBlockQuote()` - Block quotation (like HTML `<blockquote>`)
  - ✅ `options.lang` - Optional language code for foreign-language quotes
  - ✅ Works within P, LBody, TD, etc. (Quote) and as block-level (BlockQuote)

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
  - ✅ All 6 test PDFs generated successfully
  - ✅ Quote/BlockQuote elements in structure tree
  - ✅ Language attribute works for foreign quotes
  - ✅ Combines with Strong/Em/Span
  - ✅ Works in lists
  - ✅ German umlauts correct (ü, ö, ä)

- ✅ **Sprint 16 (COMPLETED)**: Code Element for Programming Code
  - **Status**: Code structure element implemented for inline and block code
  - **Key Feature**: Semantic markup for computer code, commands, file paths

  **What's been implemented:**
  - ✅ `src/modules/structure_tree.js` - Code methods added
  - ✅ `beginCode(options)` / `endCode()` - Code element wrapper
  - ✅ `options.lang` - Optional language code for code comments
  - ✅ Works as inline element within P, LBody, TD, etc.
  - ✅ Works as block-level element for multi-line code
  - ✅ Combines with Strong/Em for highlighted code

  **API Usage:**
  ```javascript
  // Inline code within paragraph
  doc.beginStructureElement('P');
  doc.text('Die Variable ', 10, 40);

  doc.beginCode();
  doc.text('counter', x, 40);
  doc.endCode();

  doc.text(' speichert den Zähler.', x, 40);
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
  - ✅ All 6 test PDFs generated successfully
  - ✅ Code elements in structure tree (`/S /Code`)
  - ✅ Language attribute works for code comments
  - ✅ Combines with Strong/Em
  - ✅ Works in lists
  - ✅ German text around code works correctly

  **Open Issue (Backlog):**
  - ⚠️ Screenreader-Verhalten für Code-Elemente konnte nicht abschließend verifiziert werden
  - Kein Referenz-PDF mit Code-Elementen verfügbar (auch nicht in der offiziellen PDF/UA Reference Suite)
  - NVDA zeigt keinen expliziten Hinweis auf Code-Blöcke an (möglicherweise erwartetes Verhalten)
  - TODO: Über Blindenverband geeignete Referenz-Dateien beschaffen

- ✅ **Sprint 17 (COMPLETED)**: Note and Reference for Footnotes/Endnotes
  - **Status**: Footnote structure elements implemented
  - **Key Feature**: Semantic markup for footnotes and endnotes with proper linking

  **What's been implemented:**
  - ✅ `src/modules/structure_tree.js` - Note/Reference methods added
  - ✅ `beginReference(options)` / `endReference()` - Footnote reference in text
  - ✅ `beginNote(options)` / `endNote()` - Footnote content
  - ✅ `options.id` - Unique ID for PDF/UA compliance
  - ✅ Works with Lbl element for numbering
  - ✅ Supports both footnotes (page bottom) and endnotes (document end)

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
    doc.text('Hier steht die Erklärung.', 15, 272);
    doc.endStructureElement();
  doc.endNote();
  ```

  **Structure Hierarchy:**
  ```
  P (Paragraph)
  ├── "Text content"
  ├── Reference
  │   └── Lbl ("1")
  └── "more text"

  Note (id="fn1")
  ├── Lbl ("1")
  └── P ("Footnote explanation text")
  ```

  **Screen Reader Behavior (expected):**
  - Reference: Should announce "footnote reference" or similar
  - Note: Should announce "footnote" on entry
  - Navigation: AT should allow jumping between Reference and Note

  **Test Results:**
  - ✅ All 5 test PDFs generated successfully
  - ✅ Reference elements in structure tree (`/S /Reference`)
  - ✅ Note elements in structure tree (`/S /Note`)
  - ✅ Lbl elements correctly nested
  - ✅ Multiple footnotes work
  - ✅ Endnotes on separate page work
  - ✅ German academic text with umlauts works

**Critical Learning:**
- PDF/UA structure tree REQUIRES marked content to work properly
- Acrobat Reader treats content without BDC/EMC as untagged (shows "empty page")
- **CRITICAL**: `/Lang` attribute MUST be present in EVERY BDC operator, not just in Catalog
  - Without `/Lang` in BDC: Acrobat shows "AVPageView Textrahmen" (treats content as artifact)
  - With `/Lang` in BDC: Content is recognized as tagged and readable by screen readers
  - Format: `/StructType <</Lang (language-code)/MCID n>> BDC`
- Firefox is more lenient and displays text even without proper tagging
- Always test with Acrobat Reader + screen reader for true PDF/UA compliance
- Reference PDFs consistently include `/Lang` in every BDC operator

**Testing Protocol:**
- The project maintainer tests with a screen reader (Acrobat Reader + screen reader)
- When working on PDF/UA features, always verify:
  1. Text displays in Acrobat Reader (not just Firefox)
  2. Structure tree exists (if implemented)
  3. Content is tagged with BDC/EMC operators (if structure tree exists)
  4. Screen reader can navigate and read the content
  5. Test file: Generate PDF → Open in Acrobat Reader → Verify with screen reader

## Tool Installation

When external tools are needed (e.g., `qpdf` for PDF inspection, `veraPDF` for validation), do NOT attempt to install them directly using `sudo` commands. The user must enter a password for such commands.

Instead:
1. Explain which tool is needed and why
2. Provide the installation command for the user to run manually
3. Wait for the user to confirm the tool is installed before proceeding

Example:
```
Tool needed: qpdf (for PDF structure inspection)
Installation: sudo apt-get install qpdf
Please install this tool and let me know when it's ready.
```

## Key Conventions

- Use modern ES6+ JavaScript for all new code (it will be transpiled)
- Add required polyfills to `src/polyfills.js` when using newer APIs
- Commit messages: Present tense, imperative mood, max 72 chars first line
- Make sure all tests pass before committing
- The project uses a PubSub pattern for inter-module communication (see PubSub class in jspdf.js)
