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

  // Split raw PDF output into "<n> 0 obj ... endobj" chunks.
  function splitObjects(pdfString) {
    var objects = {};
    var re = /(\d+) 0 obj([\s\S]*?)endobj/g;
    var m;
    while ((m = re.exec(pdfString)) !== null) {
      objects[m[1]] = m[2];
    }
    return objects;
  }

  it("references the Note from both the Reference and the Link element", () => {
    const doc = jsPDF({ unit: "mm", format: "a4", pdfUA: true });
    doc.setLanguage("de-DE");
    doc.setProperties({ title: "Footnote ref" });
    doc.setFontSize(11);

    doc.beginStructureElement("P");
    doc.text("Ein Satz mit Fussnote.", 20, 40);
    doc.addFootnoteRef("1", 70, 40, { noteId: "fn1" });
    doc.endStructureElement();

    doc.addFootnote({
      id: "fn1",
      label: "1",
      x: 20,
      y: 270,
      text: "Der Fussnotentext."
    });

    const objects = splitObjects(doc.output());

    // Locate the Note structure element's object number.
    let noteObjNum = null;
    Object.keys(objects).forEach(num => {
      if (/\/S\s*\/Note\b/.test(objects[num])) noteObjNum = num;
    });
    expect(noteObjNum).not.toBeNull();

    // Both the Reference and the Link element must carry /Ref -> Note.
    const refSrc = ["Reference", "Link"].map(type => {
      let body = null;
      Object.keys(objects).forEach(num => {
        if (new RegExp("/S\\s*/" + type + "\\b").test(objects[num]))
          body = objects[num];
      });
      return { type, body };
    });

    refSrc.forEach(({ type, body }) => {
      expect(body)
        .withContext(type + " element exists")
        .not.toBeNull();
      const refMatch = /\/Ref\s*\[\s*(\d+)\s+0\s+R/.exec(body);
      expect(refMatch)
        .withContext(type + " has /Ref")
        .not.toBeNull();
      expect(refMatch[1])
        .withContext(type + " /Ref targets Note")
        .toBe(noteObjNum);
    });
  });
});
