/* global describe, it, jsPDF, comparePdf */
/**
 * Standard spec tests
 *
 * These tests return the datauristring so that reference files can be generated.
 * We compare the exact output.
 */

describe("Module: Outline", () => {
  beforeAll(loadGlobals);
  it("should create a bookmark in a pdf generated with units in points", () => {
    var doc = new jsPDF({ unit: "pt", floatPrecision: 2 });
    doc.outline.add(null, "Page 1", { pageNumber: 1 });
    doc.addPage();

    comparePdf(doc.output(), "bookmark-pt.pdf", "outline");
  });

  // @TODO: Document
  it("should create a bookmark in a pdf generated with units in inches", () => {
    var doc = new jsPDF({ unit: "in", floatPrecision: 2 });
    doc.outline.add(null, "Page 1", { pageNumber: 1 });
    doc.addPage();

    comparePdf(doc.output(), "bookmark-in.pdf", "outline");
  });

  // @TODO: Document
  it("should create a bookmark in a pdf generated with units in mm", () => {
    var doc = new jsPDF({ unit: "mm", floatPrecision: 2 });
    doc.outline.add(null, "Page 1", { pageNumber: 1 });
    doc.addPage();

    comparePdf(doc.output(), "bookmark-mm.pdf", "outline");
  });

  it("should resolve a bookmark targetId to a named destination", () => {
    var doc = new jsPDF({ unit: "mm", floatPrecision: 2 });
    // targetId is the abstract markLinkTarget handle; the outline resolves it
    // to a named destination at render time (here the deterministic fallback
    // name, since no explicit destName was registered).
    doc.outline.add(null, "Section 1", { targetId: "sec-1" });
    doc.addPage();

    expect(doc.output().indexOf("/Dest (__sid_sec-1)")).toBeGreaterThan(-1);
  });

  it("should prefer targetId over destinationName for bookmarks", () => {
    var doc = new jsPDF({ unit: "mm", floatPrecision: 2 });
    doc.outline.add(null, "Section 1", {
      targetId: "sec-1",
      destinationName: "ignored-name"
    });
    doc.addPage();

    var out = doc.output();
    expect(out.indexOf("/Dest (__sid_sec-1)")).toBeGreaterThan(-1);
    expect(out.indexOf("ignored-name")).toBe(-1);
  });

  // @TODO: Document
});
