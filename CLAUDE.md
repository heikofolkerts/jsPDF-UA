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

**Current Status: Sprint 2+3 (COMPLETED ✅ - 2025-11-22)**

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

  **Remaining requirements:**
  - ⏳ Font embedding (Sprint 5) - required for full PDF/UA compliance but not blocking

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

## Key Conventions

- Use modern ES6+ JavaScript for all new code (it will be transpiled)
- Add required polyfills to `src/polyfills.js` when using newer APIs
- Commit messages: Present tense, imperative mood, max 72 chars first line
- Make sure all tests pass before committing
- The project uses a PubSub pattern for inter-module communication (see PubSub class in jspdf.js)
