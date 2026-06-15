/* global describe, it, expect, jsPDF, loadGlobals, beforeAll */
/**
 * Footnote link destination tests.
 *
 * Regression guard for the footnote forward-/back-link destination offset:
 * a /XYZ destination aligns the viewport top edge with its Y coordinate, so
 * using the raw text baseline made the reader land ~one line too low. The
 * destination must be shifted up by about one line height instead.
 */

describe("Module: Footnote links", () => {
  beforeAll(loadGlobals);

  // Extract the first /XYZ destination Y (PDF points from page bottom).
  function firstXYZTop(pdfString) {
    var match = /\/XYZ\s+\S+\s+([\d.]+)/.exec(pdfString);
    return match ? parseFloat(match[1]) : null;
  }

  it("places the footnote destination above the text baseline", () => {
    const baselineY = 270; // mm, near page bottom
    const fontSizePt = 10;
    const doc = jsPDF({ unit: "mm", format: "a4", floatPrecision: 4 });
    doc.setFontSize(fontSizePt);
    doc.addFootnote({
      label: "1",
      x: 20,
      y: baselineY,
      text: "This is the footnote text."
    });

    const out = doc.output();
    const destTop = firstXYZTop(out);
    expect(destTop).not.toBeNull();

    const scaleFactor = doc.internal.scaleFactor;
    const pageHeightPt = 297 * scaleFactor;
    const baselineTopPt = pageHeightPt - baselineY * scaleFactor;
    // Destination shifted up by 1.25 line heights -> larger Y (further from bottom).
    const expectedShiftPt = 1.25 * fontSizePt;

    expect(destTop).toBeGreaterThan(baselineTopPt + 1); // clearly above baseline
    expect(destTop).toBeCloseTo(baselineTopPt + expectedShiftPt, 0);
  });
});
