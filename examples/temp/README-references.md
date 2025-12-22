# PDF/UA Reference Documents for Abbreviations and Formulas

## Abbreviations (E-Attribut)

### reference-expansion-text.pdf

- **Source**: [taggedpdf.com](https://taggedpdf.com/508-pdf-help-center/actual-text-alt-text-expansion-text-contents-key/)
- **Content**: Demonstrates Expansion Text (/E attribute) for abbreviations
- **Examples in PDF**:
  - "W3C" → "World Wide Web Consortium (W3C)"
  - "WCAG" → "Web Content Accessibility Guidelines (WCAG)"
- **PDF Structure**: Uses `/Span` elements with `/E` attribute
- **NVDA Behavior**: Screen reader should announce the expansion text

### How to test with NVDA:

1. Open `reference-expansion-text.pdf` in Acrobat Reader
2. Navigate to the abbreviations (W3C, WCAG)
3. NVDA should read: "World Wide Web Consortium (W3C)" instead of just "W3C"

---

## Formulas (Formula + Alt)

### reference-math-latex.pdf

- **Source**: [LaTeX3 Tagging Project](https://github.com/latex3/tagging-project/discussions/72)
- **Content**: Mathematical formulas with MathML (PDF/UA-2)
- **Note**: This is PDF/UA-2 (PDF 2.0), uses MathML instead of Alt text
- **NVDA Behavior**: Requires MathCat add-on for NVDA to read MathML

### PDF/UA-1 vs PDF/UA-2 for Formulas:

- **PDF/UA-1**: Uses `/Formula` element with `/Alt` attribute (readable description)
- **PDF/UA-2**: Uses `/Formula` element with embedded MathML (needs special add-on)

### Our jsPDF-UA implementation:

Uses PDF/UA-1 approach with `/Alt` attribute:

- Alt text should be a readable description (e.g., "E gleich m mal c Quadrat")
- Screen reader reads the alt text directly (no add-on needed)
- Works with standard NVDA settings

### Test files created by jsPDF-UA:

- `test-formula-1-einstein.pdf` - E=mc²
- `test-formula-2-pythagoras.pdf` - a²+b²=c² (Block-Level)
- `test-abbr-1-basic.pdf` - EU → "Europäische Union"

---

## PDF/UA Reference Suite

The PDF Association's official reference suite is in:

- `PDFUA-Ref-2-*.pdf` files

Note: The Reference Suite (version 1.1) does not contain specific examples
for abbreviations (/E attribute) or formulas (/Formula element).

---

## Sources

- [W3C WCAG PDF8 Technique](https://www.w3.org/WAI/WCAG22/Techniques/pdf/PDF8.html)
- [PDF Association Reference Suite](https://pdfa.org/resource/pdfua-reference-suite/)
- [taggedpdf.com Examples](https://taggedpdf.com/508-pdf-help-center/)
- [LaTeX3 PDF/UA-2 Examples](https://github.com/latex3/tagging-project/discussions/72)
