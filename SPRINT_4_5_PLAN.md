# Sprint 4/5: Font Embedding & Advanced Features for PDF/UA

## Current Status

**Sprint 2+3:** ✅ COMPLETED

- Structure Tree implemented
- Marked Content working
- `/Lang` in BDC operators verified
- Content readable by screen readers

**Remaining PDF/UA Requirements:**

1. **Font Embedding** (CRITICAL for PDF/UA compliance)
2. Images with Alt Text
3. Advanced semantic elements

---

## Sprint 4/5 Goals

### **Primary Goal: Font Embedding**

PDF/UA requires ALL fonts to be embedded. Standard PDF fonts (Helvetica, Times, Courier) are NOT allowed.

### **Secondary Goals:**

- Images with alternative text
- List structures (ordered/unordered)
- Table structures (optional)

---

## Current Font System

jsPDF already has font embedding infrastructure:

### **Existing Components:**

- `src/modules/ttfsupport.js` - TrueType font support ✅
- `src/libs/ttffont.js` - TTF parsing library ✅
- `API.addFileToVFS()` - Virtual file system for fonts ✅
- `API.addFont()` - Font registration ✅
- `src/libs/fontFace.js` - Font face utilities ✅

### **Current Usage:**

```javascript
// Load TTF file
doc.addFileToVFS("MyFont.ttf", base64EncodedString);
doc.addFont("MyFont.ttf", "MyFont", "normal");
doc.setFont("MyFont");
doc.text("Text with embedded font", 10, 10);
```

---

## Implementation Plan

### **Phase 1: Automatic Font Embedding for PDF/UA Mode**

When `pdfUA: true`, automatically:

1. Detect if current font is a standard PDF font
2. Switch to embedded fallback font (or require user to set one)
3. Warn if standard fonts are used in PDF/UA mode

### **Phase 2: Default Embedded Font**

Options:

1. **Embed a libre font by default** (e.g., Liberation Sans, similar to Helvetica)
2. **Require users to provide font** (strict mode)
3. **Convert standard fonts to embedded** (if possible)

### **Phase 3: Font Metadata for PDF/UA**

Ensure embedded fonts have proper:

- Font descriptors with required keys
- Character set mapping (CIDFont)
- Proper encoding (Identity-H)
- ToUnicode CMap for accessibility

---

## Technical Approach

### **Option A: Bundle Default Font (Recommended)**

```javascript
// In src/jspdf.js initialization
if (options.pdfUA) {
  // Load default embedded font (Liberation Sans or similar)
  this.addFileToVFS("LiberationSans.ttf", BUNDLED_FONT_DATA);
  this.addFont("LiberationSans.ttf", "LiberationSans", "normal");
  this.setFont("LiberationSans");
  this.internal.pdfUA.defaultFont = "LiberationSans";
}
```

**Pros:**

- Works out of the box
- User-friendly
- PDF/UA compliant by default

**Cons:**

- Increases bundle size (~200-400 KB for full font family)
- Need to find appropriate libre font

### **Option B: Require User-Provided Font**

```javascript
// User must provide font when using PDF/UA
const doc = new jsPDF({
  pdfUA: true,
  embeddedFont: {
    file: myFontData,
    name: "MyFont"
  }
});
```

**Pros:**

- No bundle size increase
- User controls font choice

**Cons:**

- More complex API
- Requires user action
- Less "automatic"

### **Option C: Subset Standard Fonts (Complex)**

Create embedded subsets of standard fonts on-the-fly.

**Pros:**

- Small file size (only used glyphs)
- Automatic

**Cons:**

- Very complex implementation
- Legal issues (font licensing)
- Not recommended

---

## Recommended Approach: Option A with Lazy Loading

1. **Bundle a small libre font** (e.g., Noto Sans subset)
2. **Lazy load only when PDF/UA is enabled**
3. **Provide override option** for custom fonts

### **Implementation Steps:**

#### Step 1: Select and Prepare Font

- Choose: **Noto Sans** or **Liberation Sans** (both SIL OFL licensed)
- Create minimal subset with common characters
- Base64 encode for embedding

#### Step 2: Add to jsPDF

```javascript
// In src/modules/pdfua_fonts.js (new module)
export const PDFUA_DEFAULT_FONT = {
  name: "NotoSans",
  data: "BASE64_ENCODED_TTF_DATA...",
  style: "normal"
};
```

#### Step 3: Auto-Load in PDF/UA Mode

```javascript
// In src/jspdf.js
if (options.pdfUA) {
  const defaultFont = require("./modules/pdfua_fonts.js").PDFUA_DEFAULT_FONT;
  this.addFileToVFS(defaultFont.name + ".ttf", defaultFont.data);
  this.addFont(defaultFont.name + ".ttf", defaultFont.name, defaultFont.style);
  this.setFont(defaultFont.name);
}
```

#### Step 4: Validation

Add warning if standard fonts used:

```javascript
// In text() function
if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
  if (isStandardFont(currentFont)) {
    console.warn(
      "PDF/UA Warning: Standard fonts should not be used. Use embedded fonts."
    );
  }
}
```

---

## Testing Strategy

### **Test Cases:**

1. PDF/UA with default embedded font
2. PDF/UA with custom embedded font
3. Verify font is actually embedded (check FontFile2)
4. Verify ToUnicode CMap exists
5. Verify CIDFont structure
6. Screen reader test with embedded font
7. veraPDF validation

### **Test Script:**

```javascript
// Test embedded font in PDF/UA mode
const doc = new jsPDF({ pdfUA: true });
doc.setDocumentTitle("Test Embedded Font");
doc.beginStructureElement("Document");
doc.beginStructureElement("P");
doc.text("Test with embedded font", 10, 10);
doc.endStructureElement();
doc.endStructureElement();
// Verify font is embedded, not standard
```

---

## Font Selection Criteria

For PDF/UA default font:

- ✅ Open license (SIL OFL, Apache, etc.)
- ✅ Good Unicode coverage
- ✅ Similar to Helvetica/Arial (familiar appearance)
- ✅ Includes regular, bold, italic, bold-italic
- ✅ Reasonable file size (<500 KB for family)

**Candidates:**

1. **Noto Sans** (Google, SIL OFL) - Excellent Unicode coverage
2. **Liberation Sans** (Red Hat, SIL OFL) - Metric-compatible with Arial
3. **Source Sans Pro** (Adobe, SIL OFL) - Good readability
4. **Roboto** (Google, Apache 2.0) - Modern, widely used

**Recommended: Liberation Sans**

- Metric-compatible with Arial/Helvetica
- Familiar appearance
- Excellent license
- ~200 KB per style

---

## Alternative: Font Subsetting

If bundle size is a concern, implement font subsetting:

1. Analyze used characters in document
2. Create minimal font subset with only those glyphs
3. Embed subset instead of full font
4. Reduces size from ~200 KB to ~20-50 KB

**Library Options:**

- `fontkit` (JavaScript TTF manipulation)
- `fontmin` (Font subsetting)
- `opentype.js` (OpenType font parsing)

---

## Sprint 4/5 Timeline

### **Phase 1: Research & Selection** (Current)

- ✅ Analyze existing font system
- ⏳ Select default font (Liberation Sans recommended)
- ⏳ Prepare font files and licensing

### **Phase 2: Implementation**

- Implement default font loading in PDF/UA mode
- Add validation warnings
- Update documentation

### **Phase 3: Testing**

- Test with screen readers
- veraPDF validation
- File size optimization

### **Phase 4: Advanced Features** (Optional)

- Images with Alt Text
- List structures
- Table structures

---

## Next Steps

1. **Download Liberation Sans font family**
2. **Convert to Base64 for embedding**
3. **Create pdfua_fonts.js module**
4. **Modify jsPDF initialization for auto-loading**
5. **Test and verify**

---

## Expected Outcomes

After Sprint 4/5:

- ✅ PDF/UA documents have embedded fonts by default
- ✅ No "font not embedded" errors in veraPDF
- ✅ Proper CIDFont structure
- ✅ ToUnicode CMap for screen readers
- ✅ Full PDF/UA-1 compliance for text documents

**Remaining for later:**

- Images with Alt Text
- Complex tables
- Form fields
- Annotations
