# Sprint 6 Update: Strict Image Validation for PDF/UA

**Date:** 2025-11-22
**Change:** Enhanced from warning-based to error-based validation

---

## Problem Statement

**Initial Implementation:**

- Images without alt text were automatically marked as decorative with a warning
- This was too permissive and allowed developers to forget alt text
- Result: PDFs were technically valid but potentially inaccessible

**User Feedback:**

> "Ein sehr großes Ärgernis mit Bildern und Alternativtexten besteht darin,
> dass sie sehr gerne vergessen werden."

---

## Solution: Strict Validation Mode

When `pdfUA: true`, jsPDF now **enforces** proper image accessibility:

### Rules:

1. **Images MUST have alternative text OR be explicitly marked as decorative**

   ```javascript
   // ✅ VALID: Image with alt text
   doc.addImage({
     imageData: chart,
     x: 10,
     y: 10,
     width: 100,
     height: 80,
     alt: "Sales chart showing 25% growth in Q4"
   });

   // ✅ VALID: Explicitly decorative image
   doc.addImage({
     imageData: logo,
     x: 10,
     y: 10,
     width: 50,
     height: 20,
     decorative: true
   });

   // ❌ ERROR: No alt text, not marked as decorative
   doc.addImage({
     imageData: photo,
     x: 10,
     y: 10,
     width: 100,
     height: 80
     // Missing: alt or decorative
   });
   ```

2. **Alternative text cannot be empty or whitespace-only**

   ```javascript
   // ❌ ERROR: Empty alt text
   doc.addImage({..., alt: ''});

   // ❌ ERROR: Whitespace-only alt text
   doc.addImage({..., alt: '   '});

   // ✅ VALID: Meaningful alt text
   doc.addImage({..., alt: 'Company logo'});
   ```

3. **Regular PDFs (without pdfUA) are unaffected**
   ```javascript
   // ✅ VALID: Regular PDF doesn't require alt text
   const doc = new jsPDF(); // NO pdfUA: true
   doc.addImage(image, "PNG", 10, 10, 100, 80);
   ```

---

## Error Messages

### Missing Alt Text or Decorative Flag:

```
PDF/UA Error: Images must have alternative text or be marked as decorative.
Use: addImage({..., alt: "Description"}) or addImage({..., decorative: true})
```

### Empty Alt Text:

```
PDF/UA Error: Alternative text cannot be empty.
Provide meaningful description or mark image as decorative: true
```

---

## Migration Guide

### Before (Permissive Mode - WARNING):

```javascript
const doc = new jsPDF({ pdfUA: true });

// This would work but show warning:
doc.addImage(image, "PNG", 10, 10, 100, 80);
// Warning: Image without alternative text will be marked as decorative artifact
```

### After (Strict Mode - ERROR):

```javascript
const doc = new jsPDF({ pdfUA: true });

// This now throws an error:
doc.addImage(image, "PNG", 10, 10, 100, 80);
// Error: Images must have alternative text or be marked as decorative

// Fix: Add alt text
doc.addImage({
  imageData: image,
  format: "PNG",
  x: 10,
  y: 10,
  width: 100,
  height: 80,
  alt: "Descriptive text here"
});

// OR mark as decorative
doc.addImage({
  imageData: image,
  format: "PNG",
  x: 10,
  y: 10,
  width: 100,
  height: 80,
  decorative: true
});
```

---

## Benefits

### 1. **Prevents Accidental Omissions**

Developers cannot forget to add alt text - the PDF generation will fail with a clear error message.

### 2. **Enforces Best Practices**

Forces conscious decision: "Is this image informative (needs alt text) or decorative (needs decorative flag)?"

### 3. **Improves Accessibility**

Ensures all informative images have proper descriptions for screen reader users.

### 4. **Clear Error Messages**

Developers immediately know what's wrong and how to fix it.

### 5. **Backward Compatible**

Regular PDFs (without `pdfUA: true`) are completely unaffected.

---

## Testing

### Validation Test Suite: `test-strict-image-validation.js`

Tests all validation scenarios:

| Test | Scenario                    | Expected Result              |
| ---- | --------------------------- | ---------------------------- |
| 1    | No alt, no decorative flag  | ❌ Error thrown              |
| 2    | Empty alt text (`''`)       | ❌ Error thrown              |
| 3    | Whitespace-only alt (`' '`) | ❌ Error thrown              |
| 4    | Valid alt text              | ✅ Success                   |
| 5    | Marked as decorative        | ✅ Success                   |
| 6    | Regular PDF, no alt         | ✅ Success (not enforced)    |
| 7    | Both alt and decorative     | ✅ Success (decorative wins) |

**All tests pass:** ✅

---

## Best Practices

### Writing Good Alt Text:

**✅ DO:**

- Be descriptive and specific
- Convey the purpose/content of the image
- Keep it concise (under 125 characters ideally)
- Use complete sentences

**Examples:**

```javascript
// Charts/Graphs
alt: "Bar chart showing 25% revenue growth in Q4 2024";

// Photos
alt: "Team photo of 8 people at annual conference";

// Diagrams
alt: "Flowchart illustrating order processing workflow";

// Icons with text
alt: "Warning icon: System maintenance required";
```

**❌ DON'T:**

- Use generic text like "image", "picture", "photo"
- State the obvious: "Image of..."
- Include file names: "IMG_1234.jpg"
- Duplicate surrounding text
- Use empty or whitespace-only strings

### Decorative Images:

Mark as decorative if the image is:

- Purely aesthetic (borders, backgrounds)
- Redundant with surrounding text
- For spacing/layout purposes
- Logos in headers/footers

```javascript
// Logo in header
doc.addImage({
  imageData: logo,
  x: 10,
  y: 10,
  width: 50,
  height: 20,
  decorative: true // Decorative - company name in text nearby
});

// Decorative separator line
doc.addImage({
  imageData: separator,
  x: 0,
  y: 100,
  width: 210,
  height: 2,
  decorative: true // Purely visual separator
});
```

---

## Implementation Details

### Code Changes:

**File:** `src/modules/addimage.js`

**Before:**

```javascript
if (isPDFUA) {
  if (!altText && !isDecorative) {
    console.warn(
      "PDF/UA Warning: Image without alternative text will be marked as decorative artifact."
    );
    isDecorative = true; // Auto-convert to decorative
  }
  // ... continue processing
}
```

**After:**

```javascript
if (isPDFUA) {
  // Strict validation: MUST have alt text OR be decorative
  if (!altText && !isDecorative) {
    throw new Error(
      "PDF/UA Error: Images must have alternative text or be marked as decorative.\n" +
        'Use: addImage({..., alt: "Description"}) or addImage({..., decorative: true})'
    );
  }

  // Validate alt text is not empty
  if (altText && typeof altText === "string" && altText.trim() === "") {
    throw new Error(
      "PDF/UA Error: Alternative text cannot be empty.\n" +
        "Provide meaningful description or mark image as decorative: true"
    );
  }
  // ... continue processing
}
```

---

## Impact

### Positive Impact:

✅ **Accessibility:** Ensures all informative images have descriptions
✅ **Developer Experience:** Clear, actionable error messages
✅ **Compliance:** Enforces PDF/UA requirements at development time
✅ **Quality:** Prevents shipping inaccessible PDFs

### Breaking Change:

⚠️ **Existing code using PDF/UA with images needs update**

- Existing code that added images without alt text will now throw errors
- **Migration Required:** Add `alt` or `decorative` to all images
- **Impact:** Low (PDF/UA was just implemented in Sprint 6)

### Mitigation:

- Clear error messages guide developers to fix
- Simple fixes: Add `alt: "..."` or `decorative: true`
- Regular PDFs unaffected

---

## Validation Results

### All Tests Pass:

```bash
node tests/pdfua/test-strict-image-validation.js
```

**Output:**

```
[Test 1] Image without alt text or decorative flag
✅ PASS: Error thrown as expected

[Test 2] Image with empty alt text
✅ PASS: Error thrown as expected

[Test 3] Image with whitespace-only alt text
✅ PASS: Error thrown as expected

[Test 4] Image with valid alt text
✅ PASS: Image with alt text accepted

[Test 5] Image marked as decorative
✅ PASS: Decorative image accepted

[Test 6] Regular PDF without PDF/UA
✅ PASS: Regular PDF accepts images without alt text

[Test 7] Image with both decorative flag and alt text
✅ PASS: Decorative flag accepted (alt text ignored)
```

### veraPDF Validation:

All generated PDFs still pass PDF/UA-1 validation ✅

---

## Conclusion

The strict validation mode significantly improves PDF/UA compliance by:

1. **Preventing errors at development time** rather than discovering them later
2. **Enforcing accessibility best practices**
3. **Providing clear guidance** to developers
4. **Maintaining high quality** of generated PDFs

This change aligns with the principle: **"Make it hard to do the wrong thing."**

---

## References

- **WCAG 2.1 Success Criterion 1.1.1:** Non-text Content
- **PDF/UA Standard (ISO 14289-1):** Section 7.18 - Graphics
- **W3C Alt Text Decision Tree:** https://www.w3.org/WAI/tutorials/images/decision-tree/
