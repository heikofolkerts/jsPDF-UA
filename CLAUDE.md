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

This project is currently implementing PDF/UA (Universal Accessibility) support in sprints.

**Current Status: Sprint 25 (IN PROGRESS - 2025-12-12)**

For detailed sprint history and implementation notes, see [SPRINT_HISTORY.md](./SPRINT_HISTORY.md).

### Completed Sprints Summary

| Sprint | Feature | Status |
|--------|---------|--------|
| 1 | Basic PDF/UA mode, XMP metadata, DisplayDocTitle | ✅ |
| 2+3 | Structure Tree + Marked Content system | ✅ |
| 4/5 | Font Embedding (Atkinson Hyperlegible) | ✅ |
| 6 | Images with Alternative Text | ✅ |
| 7 | Table Structures with Header Scope | ✅ |
| 8 | List Structures (ol/ul) | ✅ |
| 9 | Link Structures | ✅ |
| 10 | Additional Font Styles (Bold, Italic, BoldItalic) | ✅ |
| 11 | Font-Subsetting | ⏭️ Skipped (already implemented) |
| 12 | Comprehensive Test Document | ✅ |
| 13 | Semantic Text Highlights (Strong/Em) + Font Detection | ✅ |
| 14 | Span Element for Inline Containers | ✅ |
| 15 | Quote and BlockQuote Elements | ✅ |
| 16 | Code Element for Programming Code | ✅ |
| 17 | Note and Reference for Footnotes/Endnotes | ✅ |
| 18 | Caption Element for Figure/Table Descriptions | ✅ |
| 19 | TOC Structure + Bookmarks Navigation | ✅ |
| 20 | Artifacts for Headers, Footers, Decorative Content | ✅ |
| 21 | Accessible Form Fields (AcroForm + PDF/UA) | ✅ |
| 22 | Abbreviations + Formula Elements | ✅ |
| 23 | BibEntry + Index Elements | ✅ |
| 24 | NonStruct/Private + Art/Sect/Div/Part Grouping | ✅ |
| 25 | Ruby/Warichu CJK Annotations | 🔄 |

### Critical Requirements

- **`/Lang` attribute**: MUST be present in EVERY BDC operator, not just in Catalog
- **Format**: `/StructType <</Lang (language-code)/MCID n>> BDC`
- **Testing**: Always test with Acrobat Reader + screen reader (Firefox is too lenient)

### Testing Protocol

When working on PDF/UA features, verify:
1. Text displays in Acrobat Reader (not just Firefox)
2. Structure tree exists
3. Content is tagged with BDC/EMC operators
4. Screen reader can navigate and read the content

## BITi Prüfschritte (PDF/UA Accessibility Testing)

Reference: https://biti-wiki.de/index.php?title=Prüfschritte

These test steps are used to verify PDF/UA compliance. When implementing or modifying PDF/UA features, consider which test steps are affected.

### 00 - OCR & Structure
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 00.0 | OCR-Validierung / Parsing | Text extraction quality |
| BITi 00.1 | Hierarchie der Baumstruktur | Structure tree hierarchy |

### 01 - Tagged Content
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 01.0 | Getaggter realer Inhalt / Artefakte | Real content vs artifacts |
| BITi 01.1 | Artefakte / Kopfzeile und Fußzeile | Headers/footers as artifacts |

### 02 - Structure Elements
**02.0 - General**
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 02.0 | Rollenzuordnung und Strukturelemente allg. | Role mapping, RoleMap |

**02.1 - Grouping Elements**
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 02.1.0 | Gruppierende Strukturelemente / Rootelemente | Document, Part, Art, Sect, Div |
| BITi 02.1.1 | Gruppierende Strukturelemente / Inhaltsverzeichnis | TOC, TOCI (Sprint 19) |
| BITi 02.1.2 | Gruppierende Strukturelemente / BlockQuote, Index, NonStruct, Private | BlockQuote (Sprint 15) |

**02.2 - Block-Level Elements**
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 02.2.0 | Blocklevel Strukturelemente / Überschriften | H1-H6 (Sprint 2/3) |
| BITi 02.2.1 | Blocklevel Strukturelemente / Listen | L, LI, Lbl, LBody (Sprint 8) |
| BITi 02.2.2 | Blocklevel Strukturelemente / Tabellen | Table, TR, TH, TD (Sprint 7) |
| BITi 02.2.3 | Blocklevel Strukturelemente / Absätze | P element (Sprint 2/3) |
| BITi 02.2.3.1 | Abkürzungen | Abbreviation handling |

**02.3 - Inline-Level Elements**
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 02.3.0 | Inlinelevel Strukturelemente / Fuß- Endnoten und Verweise | Note, Reference (Sprint 17) |
| BITi 02.3.1 | Inlinelevel Strukturelemente / Links | Link, OBJR (Sprint 9) |
| BITi 02.3.2 | Inlinelevel Strukturelemente / Annotationen | Annotation handling |
| BITi 02.3.3 | Inlinelevel Strukturelemente / Ruby / Warichu | Ruby text (CJK) |
| BITi 02.3.4 | Inlinelevel Strukturelemente / Span, Quote, BibEntry, Code | Span (Sprint 14), Quote (Sprint 15), Code (Sprint 16) |

**02.4 - Presentational Elements**
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 02.4.0 | Darstellende Elemente / Mathematische Ausdrücke | Formula element |
| BITi 02.4.1 | Darstellende Elemente / Grafiken | Figure element (Sprint 18) |
| BITi 02.4.1.1 | Grafiken / Alternativtexte | Alt text for images (Sprint 6) |
| BITi 02.4.2 | Darstellende Elemente / Formulare | Form elements |
| BITi 02.4.2.1 | Nicht-interaktive Formularfelder | Non-interactive forms |

### 03-16 - Additional Requirements
| Step | Title | Relevance |
|------|-------|-----------|
| BITi 03 | Flimmer-, Blink- oder Blitzeffekte | No flashing content |
| BITi 04 | Farben, Kontraste und Textvergrößerung | Color contrast, text scaling |
| BITi 05 | Media | Audio/video accessibility |
| BITi 06 | Metadaten / Dokumenttitel | XMP metadata, title (Sprint 1) |
| BITi 07 | Ausgewiesene natürliche Sprache | Lang attribute (Sprint 1, 14) |
| BITi 08.0 | Logische Lesereihenfolge | Reading order (/Tabs /S) |
| BITi 08.1 | Lesereihenfolge Artikelabschnitte | Article sections order |
| BITi 08.2 | Geeignete Verschachtelung der Tags | Proper tag nesting |
| BITi 09 | Zeichenkodierungen | Character encoding (UTF-8) |
| BITi 10 | Streckbare Zeichen | Scalable characters |
| BITi 11 | Optional Content | Optional content groups |
| BITi 12 | Sicherheit | Security settings |
| BITi 13 | Navigation | Bookmarks, outlines |
| BITi 14 | Aktionen | JavaScript actions |
| BITi 15 | XObjects | Form XObjects |
| BITi 16 | Schriften | Font embedding (Sprint 4/5, 10) |

### Implementation Status by BITi Step

| BITi Step | jsPDF-UA Status | Sprint |
|-----------|-----------------|--------|
| 00.1 | ✅ Implemented | 2/3 |
| 01.0 | ✅ Implemented | 2/3, 20 |
| 01.1 | ✅ Implemented | 20 |
| 02.0 | ✅ Implemented | 2/3 |
| 02.1.0 | ✅ Implemented | 2/3 |
| 02.1.1 | ✅ Implemented | 19 |
| 02.1.2 | ✅ BlockQuote, Index | 15, 23 |
| 02.2.0 | ✅ Implemented | 2/3 |
| 02.2.1 | ✅ Implemented | 8 |
| 02.2.2 | ✅ Implemented | 7 |
| 02.2.3 | ✅ Implemented | 2/3 |
| 02.2.3.1 | ✅ Abbreviations | 22 |
| 02.3.0 | ✅ Implemented | 17 |
| 02.3.1 | ✅ Implemented | 9 |
| 02.3.4 | ✅ Span, Quote, BibEntry, Code | 14-16, 23 |
| 02.4.0 | ✅ Formula | 22 |
| 02.4.1 | ✅ Implemented | 18 |
| 02.4.1.1 | ✅ Implemented | 6 |
| 02.4.2 | ✅ Implemented | 21 |
| 06 | ✅ Implemented | 1 |
| 07 | ✅ Implemented | 1, 14 |
| 08.0 | ✅ Implemented | 2/3 |
| 13 | ✅ Implemented | 19 |
| 16 | ✅ Implemented | 4/5, 10 |

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
