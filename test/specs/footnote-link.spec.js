/* global describe, it, expect, jsPDF, loadGlobals, beforeAll */
/**
 * Footnote link destination tests.
 *
 * Regression guard for the footnote forward-/back-link destination offset:
 * a /XYZ destination aligns the viewport top edge with its Y coordinate, so
 * using the raw text baseline made the reader land ~one line too low. The
 * destination must be shifted up by about one line height instead.
 *
 * Second guard: the destination must also carry an X. Without it the viewer
 * falls back to the left page edge, which scrolls the footnote out of view for
 * readers using strong magnification.
 */

describe("Module: Footnote links", () => {
  beforeAll(loadGlobals);

  // Extract the first /XYZ destination Y (PDF points from page bottom).
  function firstXYZTop(pdfString) {
    var match = /\/XYZ\s+\S+\s+([\d.]+)/.exec(pdfString);
    return match ? parseFloat(match[1]) : null;
  }

  // Extract all named destinations as { name: {left, top} } in PDF points.
  function namedDestinations(pdfString) {
    var objects = splitObjects(pdfString);
    var namesBody = null;
    Object.keys(objects).forEach(num => {
      if (/<<\s*\/Names\s*\[/.test(objects[num])) namesBody = objects[num];
    });
    var result = {};
    if (!namesBody) return result;
    var re = /\(([^)]*)\)\s*(\d+)\s+0\s+R/g;
    var m;
    while ((m = re.exec(namesBody)) !== null) {
      var xyz = /\/XYZ\s+([-\d.]+)\s+([-\d.]+)/.exec(objects[m[2]] || "");
      if (xyz) {
        result[m[1]] = { left: parseFloat(xyz[1]), top: parseFloat(xyz[2]) };
      }
    }
    return result;
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

  it("auto-captures the note destination from drawn content when no y is given", () => {
    const baselineY = 262; // mm, where the note content is actually drawn
    const fontSizePt = 11;
    const doc = jsPDF({ unit: "mm", format: "a4", pdfUA: true });
    doc.setLanguage("de-DE");
    doc.setProperties({ title: "Auto-capture note" });
    doc.setFontSize(fontSizePt);

    doc.beginStructureElement("P");
    doc.text("Satz mit Fussnote.", 20, 40);
    doc.addFootnoteRef("1", 70, 40, { noteId: "fn1" });
    doc.endStructureElement();

    // beginNote WITHOUT y: the author draws the content, the destination
    // position must be derived from the first content drawn.
    doc.beginNote({ id: "fn1" });
    doc.beginStructureElement("Lbl");
    doc.text("1", 16, baselineY);
    doc.endStructureElement();
    doc.beginStructureElement("P");
    doc.text("Manuell gezeichneter Fussnotentext.", 20, baselineY);
    doc.endStructureElement();
    doc.endNote();

    const top = firstXYZTop(doc.output());
    expect(top).not.toBeNull();

    const scaleFactor = doc.internal.scaleFactor;
    const baselineTopPt = (297 - baselineY) * scaleFactor;
    const expectedShiftPt = 1.25 * fontSizePt;

    // Captured from the drawn baseline (not 0/top of page) and shifted up.
    expect(top).toBeCloseTo(baselineTopPt + expectedShiftPt, 0);
  });

  it("gives the footnote destination an X instead of the left page edge", () => {
    const fontSizePt = 9;
    const doc = jsPDF({ unit: "mm", format: "a4", pdfUA: true });
    doc.setLanguage("de-DE");
    doc.setProperties({ title: "Footnote X" });
    doc.setFontSize(fontSizePt);

    doc.addFootnote({
      id: "fn1",
      label: "1",
      text: "Der Fussnotentext.",
      x: 25,
      y: 260,
      labelX: 20
    });

    const dest = namedDestinations(doc.output())["note-fn1"];
    expect(dest).toBeDefined();

    const scaleFactor = doc.internal.scaleFactor;
    const shiftMm = (1.25 * fontSizePt) / scaleFactor;
    // Derived from the label (leftmost part of the note), minus the same
    // margin that is applied vertically.
    expect(dest.left).toBeCloseTo((20 - shiftMm) * scaleFactor, 0);
    expect(dest.left).toBeGreaterThan(0);
  });

  it("pins the forward destination to xNote/yNote given on the reference", () => {
    const fontSizePt = 9;
    const doc = jsPDF({ unit: "mm", format: "a4", pdfUA: true });
    doc.setLanguage("de-DE");
    doc.setProperties({ title: "Footnote xNote" });
    doc.setFontSize(11);

    doc.beginStructureElement("P");
    doc.text("Satz mit Fussnote.", 20, 40);
    // Strings are accepted too: positions are frequently authored as strings.
    doc.addFootnoteRef("1", 70, 40, {
      noteId: "fn1",
      xNote: "60",
      yNote: "200"
    });
    doc.endStructureElement();

    // The note is drawn somewhere else entirely; the pinned position must win.
    doc.setFontSize(fontSizePt);
    doc.addFootnote({
      id: "fn1",
      label: "1",
      text: "Der Fussnotentext.",
      x: 25,
      y: 260,
      labelX: 20
    });

    const dest = namedDestinations(doc.output())["note-fn1"];
    expect(dest).toBeDefined();

    const scaleFactor = doc.internal.scaleFactor;
    const shiftMm = (1.25 * fontSizePt) / scaleFactor;
    expect(dest.left).toBeCloseTo((60 - shiftMm) * scaleFactor, 0);
    expect(dest.top).toBeCloseTo((297 - (200 - shiftMm)) * scaleFactor, 0);
  });

  it("creates a same-page back-link pinned to xRef/yRef", () => {
    const refFontSizePt = 11;
    const doc = jsPDF({ unit: "mm", format: "a4", pdfUA: true });
    doc.setLanguage("de-DE");
    doc.setProperties({ title: "Footnote xRef" });
    doc.setFontSize(refFontSizePt);

    doc.beginStructureElement("P");
    doc.text("Satz mit Fussnote.", 20, 40);
    doc.addFootnoteRef("1", 70, 40, { noteId: "fn1" });
    doc.endStructureElement();

    doc.setFontSize(9);
    doc.addFootnote({
      id: "fn1",
      label: "1",
      text: "Der Fussnotentext.",
      x: 25,
      y: 260,
      labelX: 20,
      xRef: 70,
      yRef: 40
    });

    const out = doc.output();
    const dest = namedDestinations(out)["noteref-fn1"];
    expect(dest).toBeDefined();

    const scaleFactor = doc.internal.scaleFactor;
    // Shift taken from the reference's font size, not the note's.
    const shiftMm = (1.25 * refFontSizePt) / scaleFactor;
    expect(dest.left).toBeCloseTo((70 - shiftMm) * scaleFactor, 0);
    expect(dest.top).toBeCloseTo((297 - (40 - shiftMm)) * scaleFactor, 0);

    // Forward link + back-link, and the label is drawn once: the back-link
    // lives inside the Lbl element (Note > Lbl > Link) instead of being a
    // second, overprinted child of the Note.
    expect((out.match(/\/Subtype \/Link/g) || []).length).toBe(2);

    const objects = splitObjects(out);
    let noteBody = null;
    const lblNums = [];
    Object.keys(objects).forEach(num => {
      if (/\/S\s*\/Note\b/.test(objects[num])) noteBody = objects[num];
      if (/\/S\s*\/Lbl\b/.test(objects[num])) lblNums.push(num);
    });
    expect(noteBody).not.toBeNull();
    // Note children: Lbl and P only.
    const kids = /\/K\s*\[([^\]]*)\]/.exec(noteBody)[1].match(/\d+\s+0\s+R/g);
    expect(kids.length).toBe(2);

    const noteLbl = lblNums
      .map(num => objects[num])
      .find(body =>
        /\/S\s*\/Link\b/.test(
          objects[(/\/K\s*\[\s*(\d+)\s+0\s+R/.exec(body) || [])[1]] || ""
        )
      );
    expect(noteLbl)
      .withContext("a Lbl wraps a Link")
      .toBeDefined();
  });

  it("omits the same-page back-link when no xRef/yRef is given", () => {
    const doc = jsPDF({ unit: "mm", format: "a4", pdfUA: true });
    doc.setLanguage("de-DE");
    doc.setProperties({ title: "Footnote no back-link" });
    doc.setFontSize(11);

    doc.beginStructureElement("P");
    doc.text("Satz mit Fussnote.", 20, 40);
    doc.addFootnoteRef("1", 70, 40, { noteId: "fn1" });
    doc.endStructureElement();

    doc.setFontSize(9);
    doc.addFootnote({
      id: "fn1",
      label: "1",
      text: "Der Fussnotentext.",
      x: 25,
      y: 260,
      labelX: 20
    });

    const out = doc.output();
    // Only the forward link.
    expect((out.match(/\/Subtype \/Link/g) || []).length).toBe(1);
  });
});
