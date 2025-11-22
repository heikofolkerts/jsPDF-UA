# Sprint 6: Images with Alternative Text for PDF/UA

**Goal:** Implement accessible image support with alternative text for PDF/UA compliance

**Status:** Planning

---

## Current Status

### What's Already Working:
- ✅ Basic image support (`addImage()`)
- ✅ Multiple image formats (JPEG, PNG, GIF, WebP, BMP)
- ✅ Image options object support
- ✅ Structure tree implementation
- ✅ Marked content (BDC/EMC operators)

### What's Missing:
- ❌ Alternative text (Alt text) for images
- ❌ Structure tree integration for images
- ❌ Figure elements (`/Figure`) in structure tree
- ❌ BDC/EMC wrapping for image content
- ❌ MCID assignment for images

---

## PDF/UA Requirements for Images

According to PDF/UA (ISO 14289-1:2014), all images must:

1. **Have alternative text** - Descriptive text for screen readers
2. **Be tagged** - Wrapped in BDC/EMC operators with MCID
3. **Be in structure tree** - Part of the document structure
4. **Use correct structure type** - `/Figure` for images
5. **Have actual text** - `/Alt` entry in structure element

### PDF Structure for Accessible Images:

```pdf
% Structure element (in structure tree)
10 0 obj
<< /Type /StructElem
   /S /Figure
   /P 5 0 R          % Parent element
   /Pg 3 0 R         % Page reference
   /K [0]            % MCID reference
   /Alt (Alternative text description)  % CRITICAL for accessibility
>>
endobj

% Page content stream
/Figure <</Lang (en-US)/MCID 0>> BDC
q
100 0 0 80 50 700 cm
/I1 Do               % Image XObject
Q
EMC
```

---

## Implementation Plan

### Phase 1: Extend addImage API

Add support for alternative text and PDF/UA mode:

```javascript
// Option 1: Via options object (recommended)
doc.addImage({
  imageData: imageData,
  format: 'PNG',
  x: 10,
  y: 10,
  width: 100,
  height: 80,
  alt: 'Photo of a sunset over mountains'  // NEW
});

// Option 2: Additional parameter
doc.addImage(imageData, 'PNG', 10, 10, 100, 80, 'alias', 'FAST', 0, 'Alternative text');
```

### Phase 2: Modify writeImageToPDF

Update `writeImageToPDF` to wrap images in BDC/EMC when PDF/UA is enabled:

**Current code (addimage.js:492-521):**
```javascript
this.internal.write("q"); //Save graphics state
// ... transformation matrices ...
this.internal.write("/I" + image.index + " Do"); //Paint Image
this.internal.write("Q"); //Restore graphics state
```

**Modified code:**
```javascript
var altText = image.alt || null;
var isPDFUA = this.isPDFUAEnabled && this.isPDFUAEnabled();

// PDF/UA: Wrap image in marked content
if (isPDFUA && altText) {
  var mcid = this.internal.pdfUA.getCurrentMCID();
  var lang = this.getLanguage();
  this.internal.write("/Figure <</Lang (" + lang + ")/MCID " + mcid + ">> BDC");
}

this.internal.write("q"); //Save graphics state
// ... existing transformation matrices ...
this.internal.write("/I" + image.index + " Do"); //Paint Image
this.internal.write("Q"); //Restore graphics state

if (isPDFUA && altText) {
  this.internal.write("EMC");
}
```

### Phase 3: Structure Tree Integration

Create structure element for each image:

```javascript
if (isPDFUA && altText) {
  // Get current structure parent
  var parent = this.internal.pdfUA.getCurrentStructureParent();

  // Create Figure structure element
  var figureElement = {
    type: 'Figure',
    alt: altText,
    mcid: mcid,
    parent: parent
  };

  this.internal.pdfUA.addStructureElement(figureElement);
}
```

### Phase 4: Handle Images Without Alt Text

For PDF/UA compliance, images MUST have alternative text. Options:

**Option A: Warn and provide default**
```javascript
if (isPDFUA && !altText) {
  console.warn('PDF/UA Warning: Image added without alternative text. Using default.');
  altText = 'Image';
}
```

**Option B: Throw error (strict mode)**
```javascript
if (isPDFUA && !altText) {
  throw new Error('PDF/UA requires alternative text for all images. Use alt option.');
}
```

**Option C: Mark as artifact (decorative image)**
```javascript
if (isPDFUA && !altText) {
  // Mark as artifact (decorative, not part of content)
  this.internal.write("/Artifact BMC");
  // ... image drawing ...
  this.internal.write("EMC");
  return; // Don't add to structure tree
}
```

**Recommendation:** Use Option C (artifact) as default, with warning.

---

## API Design

### New Options for addImage:

```javascript
doc.addImage({
  imageData: imageData,      // Existing
  format: 'PNG',             // Existing
  x: 10,                     // Existing
  y: 10,                     // Existing
  width: 100,                // Existing
  height: 80,                // Existing
  alias: 'img1',             // Existing
  compression: 'FAST',       // Existing
  rotation: 0,               // Existing

  // NEW PDF/UA options:
  alt: 'Description',        // Alternative text
  decorative: false          // If true, mark as artifact (no alt text needed)
});
```

### Convenience Method:

```javascript
// For PDF/UA documents, wrap in structure element
doc.beginStructureElement('Document');
  doc.beginStructureElement('H1');
  doc.text('My Report', 10, 10);
  doc.endStructureElement();

  // Images automatically added to current structure context
  doc.addImage({
    imageData: chart,
    x: 10,
    y: 30,
    width: 180,
    height: 100,
    alt: 'Bar chart showing sales by quarter'
  });

  // Decorative image (not read by screen readers)
  doc.addImage({
    imageData: logo,
    x: 10,
    y: 140,
    width: 50,
    height: 20,
    decorative: true  // Marked as artifact
  });
doc.endStructureElement();
```

---

## Implementation Steps

### Step 1: Extend Image Object
File: `src/modules/addimage.js`

Add `alt` and `decorative` to image object:
```javascript
var processImageData = function(imageData, format, alias, compression, alt, decorative) {
  // ... existing code ...

  result.alt = alt || null;
  result.decorative = decorative || false;

  return result;
};
```

### Step 2: Update addImage Signature
File: `src/modules/addimage.js` (line 786)

```javascript
jsPDFAPI.addImage = function() {
  var imageData, format, x, y, w, h, alias, compression, rotation, alt, decorative;

  // ... existing argument parsing ...

  if (typeof imageData === "object" && !isDOMElement(imageData) && "imageData" in imageData) {
    var options = imageData;

    // ... existing options ...
    alt = options.alt || options.altText || alt;
    decorative = options.decorative || options.isDecorative || decorative;
  }

  var image = processImageData.call(this, imageData, format, alias, compression, alt, decorative);

  writeImageToPDF.call(this, x, y, w, h, image, rotation);

  return this;
};
```

### Step 3: Modify writeImageToPDF
File: `src/modules/addimage.js` (line 463)

Add BDC/EMC wrapping:
```javascript
var writeImageToPDF = function(x, y, width, height, image, rotation) {
  var isPDFUA = this.isPDFUAEnabled && this.isPDFUAEnabled();
  var altText = image.alt;
  var isDecorative = image.decorative;

  // PDF/UA: Check if we need to wrap image
  if (isPDFUA) {
    if (!altText && !isDecorative) {
      console.warn('PDF/UA Warning: Image without alternative text will be marked as decorative.');
      isDecorative = true;
    }

    if (isDecorative) {
      // Mark as artifact (decorative)
      this.internal.write("/Artifact BMC");
    } else {
      // Create marked content with MCID
      var mcid = this.internal.pdfUA.getCurrentMCID();
      this.internal.pdfUA.incrementMCID();
      var lang = this.getLanguage();

      this.internal.write("/Figure <</Lang (" + lang + ")/MCID " + mcid + ">> BDC");

      // Add to structure tree
      this.internal.pdfUA.addImageToStructure({
        type: 'Figure',
        alt: altText,
        mcid: mcid
      });
    }
  }

  // ... existing image drawing code (q, transformations, /I Do, Q) ...

  if (isPDFUA) {
    if (isDecorative) {
      this.internal.write("EMC");
    } else {
      this.internal.write("EMC");
    }
  }
};
```

### Step 4: Add Structure Tree Helper
File: `src/modules/structure_tree.js`

```javascript
addImageToStructure: function(imageInfo) {
  var currentParent = this.getCurrentStructureParent();
  if (!currentParent) {
    console.warn('PDF/UA: Image added outside structure context');
    return;
  }

  var element = {
    type: 'Figure',
    alt: imageInfo.alt,
    mcid: imageInfo.mcid,
    parent: currentParent,
    page: this.currentPage
  };

  this.structureElements.push(element);
  currentParent.children.push(element);
}
```

---

## Testing Strategy

### Test Suite: `tests/pdfua/test-suite-image-alt-text.js`

Generate test PDFs:

1. **test-image-1-with-alt.pdf** - Image with alt text
2. **test-image-2-decorative.pdf** - Decorative image (artifact)
3. **test-image-3-multiple.pdf** - Multiple images with different alt texts
4. **test-image-4-no-alt-warning.pdf** - Image without alt (should warn)
5. **test-image-5-in-structure.pdf** - Images within structure elements

### Verification:

```bash
# Screen reader test
# - Should read alt text for images
# - Should skip decorative images

# veraPDF validation
docker run --rm -v "$PWD:/data" verapdf/cli:latest \
  --flavour ua1 --format text "/data/examples/temp/test-image-1-with-alt.pdf"

# Check structure tree
python3 tests/pdfua/decompress-pdf.py test-image-1-with-alt.pdf output.pdf
grep "/Figure" output.pdf
grep "/Alt" output.pdf
```

---

## Expected Outcomes

After Sprint 6:
- ✅ `addImage()` accepts `alt` and `decorative` options
- ✅ Images wrapped in BDC/EMC operators in PDF/UA mode
- ✅ Figure elements in structure tree
- ✅ Alternative text in `/Alt` entry
- ✅ Decorative images marked as artifacts
- ✅ Screen readers can read image descriptions
- ✅ veraPDF validation passes

---

## Migration Path

### For Existing Code:

```javascript
// Before (works, but not PDF/UA compliant)
doc.addImage(image, 'PNG', 10, 10, 100, 80);

// After (PDF/UA compliant)
doc.addImage({
  imageData: image,
  format: 'PNG',
  x: 10,
  y: 10,
  width: 100,
  height: 80,
  alt: 'Meaningful description'
});
```

### Backward Compatibility:

- ✅ Existing code continues to work
- ⚠️ Warning shown if PDF/UA enabled without alt text
- ✅ Automatic artifact marking for images without alt text
- ✅ No breaking changes

---

## Next Steps

1. Implement extended addImage API
2. Modify writeImageToPDF for BDC/EMC wrapping
3. Add structure tree integration
4. Create test suite
5. Verify with screen readers
6. Run veraPDF validation
7. Document usage

---

## Questions to Resolve

1. **Default behavior without alt text?**
   - Current plan: Warn and mark as artifact
   - Alternative: Throw error (strict mode)

2. **Alt text length limit?**
   - PDF spec has no limit
   - Recommendation: Warn if > 200 characters?

3. **Support for captions?**
   - PDF/UA supports `<Figure><Caption>` structure
   - Defer to later sprint?

4. **Image inside structure element context?**
   - Current plan: Automatically add to current structure parent
   - Verified with `getCurrentStructureParent()`

---

## References

- **PDF/UA Standard:** ISO 14289-1:2014 Section 7.18 (Graphics)
- **PDF Reference:** Section 10.5 (Marked Content)
- **WCAG 2.1:** Success Criterion 1.1.1 (Non-text Content)
- **Existing Implementation:** `src/modules/addimage.js`
