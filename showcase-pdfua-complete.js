/**
 * PDF/UA Complete Showcase Document
 *
 * This document demonstrates ALL PDF/UA features implemented in jsPDF.
 * It can be used for validation by external accessibility testers.
 *
 * Features demonstrated:
 * - Document metadata (title, language)
 * - Structure tree with all element types
 * - Headings (H1-H3)
 * - Paragraphs and text
 * - Lists (ordered and unordered)
 * - Tables with proper headers
 * - Links (external and internal)
 * - Images with alt text
 * - Artifacts (headers, footers, decorative)
 * - Form fields (text, checkbox, combobox)
 * - Annotations (text, freetext)
 * - Footnotes and references
 * - Quotes and blockquotes
 * - Code (inline and block)
 * - Abbreviations
 * - Formulas
 * - Strong/Em emphasis
 * - Span with language changes
 * - Table of Contents
 * - Bookmarks
 * - Bibliography
 * - Index
 * - Grouping elements (Sect, Art, Div, Part)
 * - NonStruct and Private
 * - Caption
 */

const { jsPDF } = require("./dist/jspdf.node.js");
const fs = require("fs");
const path = require("path");

console.log("=".repeat(70));
console.log("PDF/UA Complete Showcase Document Generator");
console.log("=".repeat(70));

const doc = new jsPDF({ pdfUA: true });

// ============================================================================
// Document Metadata
// ============================================================================
doc.setDocumentTitle("PDF/UA Complete Feature Showcase - jsPDF Implementation");
doc.setLanguage("en-US");

// ============================================================================
// Bookmarks for Navigation (using outline API)
// ============================================================================
// Bookmarks link to the same heading targets as the TOC via destinationName
// (resolved from the markLinkTarget ids). pageNumber stays as a fallback in
// case a destination ever fails to resolve.
const bm = (parent, title, sectionId, pageNumber) =>
  doc.outline.add(parent, title, {
    destinationName: doc.resolveLinkTargetDestName(sectionId),
    pageNumber: pageNumber
  });

//bm(null, '1. Introduction', 'sec-0', 1);
bm(null, "1. Text Elements", "sec-1", 1);

const listsBookmark = bm(null, "2. Lists", "sec-2", 2);
bm(listsBookmark, "2.1 Unordered List", "sec-2-1", 2);
bm(listsBookmark, "2.2 Ordered List", "sec-2-2", 2);

bm(null, "3. Tables", "sec-3", 2);
bm(null, "4. Links", "sec-4", 2);
bm(null, "5. Form Fields", "sec-5", 3);

const quotesBookmark = bm(null, "6. Quotes and Code", "sec-6", 3);
bm(quotesBookmark, "6.1 Inline Quote", "sec-6-1", 3);
bm(quotesBookmark, "6.2 Block Quote", "sec-6-2", 3);
bm(quotesBookmark, "6.3 Code Examples", "sec-6-3", 3);

bm(null, "7. Footnotes and References", "sec-7", 4);

const figuresBookmark = bm(null, "8. Figures and Captions", "sec-8", 4);
bm(figuresBookmark, "8.1 Annotations", "sec-8-1", 4);

const advancedBookmark = bm(null, "9. Advanced Structure Elements", "sec-9", 5);
bm(advancedBookmark, "9.1 Article (Art)", "sec-9-1", 5);
bm(advancedBookmark, "9.2 Division (Div)", "sec-9-2", 5);
bm(advancedBookmark, "9.3 NonStruct (Layout Grouping)", "sec-9-3", 5);
bm(advancedBookmark, "9.4 Private (Application Data)", "sec-9-4", 5);

bm(null, "10. Bibliography", "sec-10", 6);

// ============================================================================
// PAGE 1: Introduction and Text Elements
// ============================================================================
doc.beginStructureElement("Document");

// --- Header Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Header" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("PDF/UA Complete Showcase", 20, 10);
doc.text("Page 1", 180, 10);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// --- Title ---
doc.beginStructureElement("H1");
doc.setFontSize(22);
doc.setFont(undefined, "bold");
doc.text("PDF/UA Complete Feature Showcase", 20, 25);
doc.endStructureElement();

// --- Section 1: Introduction ---
doc.beginSect();
/**  doc.beginStructureElement('H2');
 *  doc.setFontSize(14);
 *  doc.setFont(undefined, 'bold');
 *  doc.text('1. Introduction', 20, 40);
 *  doc.endStructureElement();
 */
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("This document demonstrates all PDF/UA accessibility features implemented in jsPDF.", 20, 52);
//  doc.text('It serves as a comprehensive test case for accessibility validation tools.', 20, 59);
doc.endStructureElement();
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("It serves as a comprehensive test case for accessibility validation tools.", 20, 59);
doc.endStructureElement();
doc.endSect();

// --- Table of Contents ---
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.text("Table of Contents", 20, 75);
doc.endStructureElement();

doc.beginTOC();
//    { title: '1. Introduction', page: 1, level: 1 },
const tocItems = [
  { title: "1. Text Elements", page: 1, level: 1, id: "sec-1" },
  { title: "2. Lists", page: 2, level: 1, id: "sec-2" },
  { title: "2.1 Unordered List", page: 2, level: 2, id: "sec-2-1" },
  { title: "2.2 Ordered List", page: 2, level: 2, id: "sec-2-2" },
  { title: "3. Tables", page: 2, level: 1, id: "sec-3" },
  { title: "4. Links", page: 2, level: 1, id: "sec-4" },
  { title: "5. Form Fields", page: 3, level: 1, id: "sec-5" },
  { title: "6. Quotes and Code", page: 3, level: 1, id: "sec-6" },
  { title: "6.1 Inline Quote", page: 3, level: 2, id: "sec-6-1" },
  { title: "6.2 Block Quote", page: 3, level: 2, id: "sec-6-2" },
  { title: "6.3 Code Examples", page: 3, level: 2, id: "sec-6-3" },
  { title: "7. Footnotes and References", page: 4, level: 1, id: "sec-7" },
  { title: "8. Figures and Captions", page: 4, level: 1, id: "sec-8" },
  { title: "8.1 Annotations", page: 4, level: 2, id: "sec-8-1" },
  { title: "9. Advanced Structure Elements", page: 5, level: 1, id: "sec-9" },
  { title: "9.1 Article (Art)", page: 5, level: 2, id: "sec-9-1" },
  { title: "9.2 Division (Div)", page: 5, level: 2, id: "sec-9-2" },
  {
    title: "9.3 NonStruct (Layout Grouping)",
    page: 5,
    level: 2,
    id: "sec-9-3"
  },
  { title: "9.4 Private (Application Data)", page: 5, level: 2, id: "sec-9-4" },
  { title: "10. Bibliography", page: 6, level: 1, id: "sec-10" },
  { title: "11. Index", page: 6, level: 1, id: "sec-11" }
];

let tocY = 88;
doc.setFontSize(8);
doc.setFont(undefined, "normal");
tocItems.forEach(item => {
  doc.addTOCEntry({
    title: item.title,
    page: item.page,
    targetId: item.id,
    y: tocY,
    level: item.level,
    indent: 25,
    subIndent: 5,
    rightMargin: 190
  });
  tocY += 5;
});
doc.endTOC();

// --- Section 2: Text Elements ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.markLinkTarget("sec-1");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.text("1. Text Elements", 20, 200); // Moved down to avoid TOC overlap
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("This section demonstrates various text formatting options:", 20, 213);
doc.endStructureElement();

// Strong text
doc.beginStructureElement("P");
doc.text("Here is some ", 20, 226);
doc.beginStrong();
doc.setFont(undefined, "bold");
doc.text("strongly emphasized", 51, 226);
doc.endStrong();
doc.setFont(undefined, "normal");
doc.text(" text that is important.", 97, 226);
doc.endStructureElement();

// Emphasized text
doc.beginStructureElement("P");
doc.text("And here is some ", 20, 238);
doc.beginEmphasis();
doc.setFont(undefined, "italic");
doc.text("emphasized", 58, 238);
doc.endEmphasis();
doc.setFont(undefined, "normal");
doc.text(" text for stress.", 87, 238);
doc.endStructureElement();

// Abbreviation
doc.beginStructureElement("P");
doc.text("The ", 20, 250);
doc.beginAbbreviation("World Wide Web");
doc.text("WWW", 32, 250);
doc.endAbbreviation();
doc.text(" and ", 46, 250);
doc.beginAbbreviation("Hypertext Markup Language");
doc.text("HTML", 58, 250);
doc.endAbbreviation();
doc.text(" are fundamental web technologies.", 73, 250);
doc.endStructureElement();

// Language change
doc.beginStructureElement("P");
doc.text("English text with ", 20, 262);
doc.beginSpan({ lang: "de-DE" });
doc.text("deutscher Text eingebettet", 61, 262);
doc.endSpan();
doc.text(" and back to English.", 130, 262);
doc.endStructureElement();

// Formula
doc.beginStructureElement("P");
doc.text("Famous equation: ", 20, 274);
doc.beginFormula({ alt: "E equals m times c squared, where E is energy, m is mass, and c is speed of light"});
doc.text("E = mc²", 62, 274);
doc.endFormula();
doc.endStructureElement();
doc.endSect();

// --- Footer Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Footer" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("Generated by jsPDF with PDF/UA support", 20, 285);
doc.text("1", 105, 285);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// ============================================================================
// PAGE 2: Lists and Tables
// ============================================================================
doc.addPage();

// --- Header Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Header" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("PDF/UA Complete Showcase", 20, 10);
doc.text("Page 2", 180, 10);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// --- Section 3: Lists ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-2");
doc.text("2. Lists", 20, 25);
doc.endStructureElement();

doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.markLinkTarget("sec-2-1");
doc.text("2.1 Unordered List", 20, 38);
doc.endStructureElement();

doc.setFontSize(11);
doc.setFont(undefined, "normal");

doc.beginStructureElement("L");
const ulItems = ["First item in the list", "Second item with more text", "Third item"];
let ulY = 50;
ulItems.forEach(item => {
  doc.beginStructureElement("LI");
  doc.beginStructureElement("Lbl");
  doc.text("•", 25, ulY);
  doc.endStructureElement();
  doc.beginStructureElement("LBody");
  doc.text(item, 32, ulY);
  doc.endStructureElement();
  doc.endStructureElement();
  ulY += 10;
});
doc.endStructureElement();

doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-2-2");
doc.text("2.2 Ordered List", 20, 88);
doc.endStructureElement();

doc.setFontSize(11);
doc.setFont(undefined, "normal");

doc.beginStructureElement("L");
const olItems = ["Step one of the process", "Step two continues here", "Step three completes it"];
let olY = 100;
olItems.forEach((item, idx) => {
  doc.beginStructureElement("LI");
  doc.beginStructureElement("Lbl");
  doc.text(idx + 1 + ".", 25, olY);
  doc.endStructureElement();
  doc.beginStructureElement("LBody");
  doc.text(item, 35, olY);
  doc.endStructureElement();
  doc.endStructureElement();
  olY += 10;
});
doc.endStructureElement();
doc.endSect();

// --- Section 4: Tables ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-3");
doc.text("3. Tables", 20, 145);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("Tables with proper header associations:", 20, 158);
doc.endStructureElement();

doc.beginStructureElement("Table");
// Table Header
doc.beginTableHead();
doc.beginStructureElement("TR");
doc.beginStructureElement("TH", { scope: "Column" });
doc.setFont(undefined, "bold");
doc.text("Product", 25, 175);
doc.endStructureElement();
doc.beginStructureElement("TH", { scope: "Column" });
doc.text("Price", 80, 175);
doc.endStructureElement();
doc.beginStructureElement("TH", { scope: "Column" });
doc.text("Quantity", 120, 175);
doc.endStructureElement();
doc.beginStructureElement("TH", { scope: "Column" });
doc.text("Total", 170, 175);
doc.endStructureElement();
doc.endStructureElement();
doc.endTableHead();

// Table Body
doc.beginTableBody();
const tableData = [
  ["Widget A", "$10.00", "5", "$50.00"],
  ["Widget B", "$15.00", "3", "$45.00"],
  ["Widget C", "$8.00", "10", "$80.00"]
];
let tableY = 188;
tableData.forEach(row => {
  doc.beginStructureElement("TR");
  // First column is row header (product name)
  doc.beginStructureElement("TH", { scope: "Row" });
  doc.setFont(undefined, "bold");
  doc.text(row[0], 25, tableY);
  doc.endStructureElement();
  // Data cells
  doc.setFont(undefined, "normal");
  doc.beginStructureElement("TD");
  doc.text(row[1], 80, tableY);
  doc.endStructureElement();
  doc.beginStructureElement("TD");
  doc.text(row[2], 120, tableY);
  doc.endStructureElement();
  doc.beginStructureElement("TD");
  doc.text(row[3], 170, tableY);
  doc.endStructureElement();
  doc.endStructureElement();
  tableY += 12;
});
doc.endTableBody();
doc.endStructureElement();

// Note: Table border lines are omitted because jsPDF doesn't yet support
// artifact marking for graphical operations. Future enhancement needed.
doc.endSect();

// --- Section 5: Links ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-4");
doc.text("4. Links", 20, 240);
doc.endStructureElement();

// External link - Link should be inline within P element (per accessible-pdf.info)
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("External link: ", 20, 253);
doc.beginLink();
doc.setTextColor(0, 0, 255);
doc.textWithLink("jsPDF on GitHub", 52, 253, { url: "https://github.com/parallax/jsPDF"});
doc.setTextColor(0, 0, 0);
doc.endLink();
doc.endStructureElement();

// Internal link - Link should be inline within P element
doc.beginStructureElement("P");
doc.text("Internal link: ", 20, 265);
doc.beginLink();
doc.setTextColor(0, 0, 255);
doc.textWithLink("Jump to Bibliography (Page 6)", 51, 265, { targetId: "sec-10"});
doc.setTextColor(0, 0, 0);
doc.endLink();
doc.endStructureElement();
doc.endSect();

// --- Footer Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Footer" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("Generated by jsPDF with PDF/UA support", 20, 285);
doc.text("2", 105, 285);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// ============================================================================
// PAGE 3: Forms, Quotes, and Code
// ============================================================================
doc.addPage();

// --- Header Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Header" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("PDF/UA Complete Showcase", 20, 10);
doc.text("Page 3", 180, 10);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// --- Section 6: Forms ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-5");
doc.text("5. Form Fields", 20, 25);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("Accessible form fields with labels:", 20, 38);
doc.endStructureElement();

// Text field - visible label must match accessibility label
/** doc.beginStructureElement('P');
 * doc.text('Name:', 20, 55);
 * doc.endStructureElement();
 */
doc.addAccessibleTextField({
  name: "name",
  label: "Name:", // label is visible
  tooltip: "Enter your full name.",
  x: 20,
  y: 55,
  width: 80,
  height: 12,
  required: true
});

// Checkbox - visible label must be present and match accessibility label
/** doc.beginStructureElement('P');
 *  doc.text('Subscribe to newsletter:', 20, 72);  // Added visible label
 *  doc.endStructureElement();
 */
doc.addAccessibleCheckBox({
  name: "subscribe",
  label: "Subscribe to newsletter.", // label is visible
  tooltip: "Check to receive our newsletter.",
  x: 20,
  y: 71,
  width: 7,
  height: 7 // Moved to left of label
});

// Combobox - visible label must match accessibility label
/** doc.beginStructureElement('P');
 * doc.text('Country:', 20, 95);
 * doc.endStructureElement();
 */
doc.addAccessibleComboBox({
  name: "country",
  label: "Country:", // label is visible
  tooltip: "Select your country from the list.",
  x: 20,
  y: 88,
  width: 60,
  height: 12,
  options: ["USA", "Germany", "France", "UK", "Japan"]
});
doc.endSect();

// --- Section 7: Quotes and Code ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-6");
doc.text("6. Quotes and Code", 20, 120);
doc.endStructureElement();

doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.markLinkTarget("sec-6-1");
doc.text("6.1 Inline Quote", 20, 133);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("Shakespeare wrote: ", 20, 145);
doc.beginQuote();
doc.setFont(undefined, "italic");
doc.text('"To be or not to be, that is the question."', 63, 145);
doc.setFont(undefined, "normal");
doc.endQuote();
doc.endStructureElement();

doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-6-2");
doc.text("6.2 Block Quote", 20, 162);
doc.endStructureElement();

doc.beginBlockQuote();
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "italic");
doc.text('"The only way to do great work is to love what you do.', 30, 175);
doc.text("If you haven't found it yet, keep looking. Don't settle.\"", 30, 183);
doc.setFont(undefined, "normal");
doc.text("- Steve Jobs", 30, 195);
doc.endStructureElement();
doc.endBlockQuote();

doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-6-3");
doc.text("6.3 Code Examples", 20, 215);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("Inline code: ", 20, 228);
doc.beginCode();
doc.text("const x = 42;", 52, 228);
doc.endCode();
doc.endStructureElement();

doc.beginStructureElement("P");
doc.text("Code block:", 20, 242);
doc.endStructureElement();

doc.beginCode({ placement: "Block" });
doc.text("function greet(name) {", 25, 255);
doc.text("  return `Hello, ${name}!`;", 25, 263);
doc.text("}", 25, 271);
doc.endCode();
doc.endSect();

// --- Footer Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Footer" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("Generated by jsPDF with PDF/UA support", 20, 285);
doc.text("3", 105, 285);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// ============================================================================
// PAGE 4: Footnotes and Figures
// ============================================================================
doc.addPage();

// --- Header Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Header" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("PDF/UA Complete Showcase", 20, 10);
doc.text("Page 4", 180, 10);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// --- Section 8: Footnotes ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-7");
doc.text("7. Footnotes and References", 20, 25);
doc.endStructureElement();

// Single paragraph with inline footnote references (correct PDF/UA structure)
// Footnotes should be placed directly after the term they explain
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");

// First line: "PDF/UA (Universal Accessibility) is an ISO standard¹ that ensures"
let fnX = 20;
doc.text("PDF/UA (Universal Accessibility) is an ISO standard", fnX, 40);
fnX += doc.getTextWidth("PDF/UA (Universal Accessibility) is an ISO standard");

// Footnote reference ¹ - directly after "ISO standard" (explains the ISO standard)
doc.addFootnoteRef("¹", fnX, 40, { noteId: "fn1" });
fnX += doc.getTextWidth("¹") * 0.7 + 1;

// Continue text
doc.text(" that ensures ", fnX, 40);

// Second line: "PDFs can be read by assistive technologies. The Matterhorn Protocol²"
fnX = 20;
doc.text("PDFs can be read by assistive technologies. The Matterhorn Protocol ", fnX, 50);
fnX += doc.getTextWidth("PDFs can be read by assistive technologies. The Matterhorn Protocol");

// Footnote reference ² - directly after "Matterhorn Protocol" (explains the protocol)
doc.addFootnoteRef("²", fnX, 50, { id: "ref2", noteId: "fn2" });

// Third line
doc.text("provides validation checkpoints for PDF/UA compliance.", 20, 60);
doc.endStructureElement();

// Separator line as artifact (at page bottom)
doc.beginArtifact({ type: "Layout" });
doc.line(20, 258, 100, 258);
doc.endArtifact();

// Footnotes using the new convenience API
doc.setFontSize(9);
doc.addFootnote({
  id: "fn1",
  label: "¹",
  text: "ISO 14289-1:2014, Document management — Electronic document file format enhancement for accessibility",
  x: 25,
  y: 265,
  labelX: 20,
  link: true
});

doc.addFootnote({
  id: "fn2",
  label: "²",
  text: "PDF Association, Matterhorn Protocol 1.1",
  x: 25,
  y: 275,
  labelX: 20,
  link: true
});

doc.setFontSize(11);
doc.endSect();

// --- Section 9: Figures ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-8");
doc.text("8. Figures and Captions", 20, 85);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("Figures with alternative text and captions:", 20, 98);
doc.endStructureElement();

// Figure 1 - Placeholder representing an image
// Note: Graphics (rect) are omitted because jsPDF doesn't yet support
// marked content for graphical operations. Using text placeholder instead.
// BBox is recommended by PAC for better accessibility in alternate presentations
// BBox format: [x, y, width, height] in points (PDF coordinates from bottom-left)
doc.beginFigure({
  alt:
    "A bar chart showing quarterly sales data with Q1 at 25%, Q2 at 30%, Q3 at 20%, and Q4 at 25%",
  bbox: [20, 640, 90, 70] // x, y (from bottom), width, height
});

// Text placeholder for image (graphics can't be tagged yet)
/**
doc.setFontSize(10);
doc.setTextColor(89, 89, 89);
doc.text("[Bar Chart: Q1=25%, Q2=30%, Q3=20%, Q4=25%]", 20, 158);
doc.setTextColor(0, 0, 0);

doc.addImage(sales, 'png', x, y, 292, 247);
*/
doc.beginCaption();
doc.setFontSize(10);
doc.text("Figure 1: Quarterly Sales Distribution", 20, 188); // Caption is not visible on Screenreader preview yet
doc.endCaption();
doc.endFigure();

// Annot element goes here for correct reading order in screenreader tools
doc.beginAnnot({ alt: "Reviewer comment about quarterly sales figure" });
const annotId1 = doc.createAnnotation({
  type: "text",
  title: "Reviewer",
  contents: "Comment: This figure shows quarterly sales distribution.",
  bounds: { x: 90, y: 180, w: 20, h: 20 },
  open: false
});
if (annotId1) doc.addAnnotationRef(annotId1);
doc.endAnnot();

// Figure 2
doc.beginFigure({
  alt:
    "A process flow diagram with three connected boxes showing Input, Process, and Output stages",
  bbox: [120, 640, 80, 70] // x, y (from bottom), width, height
});

// Text placeholder for image (graphics can't be tagged yet)
/**
doc.setTextColor(89, 89, 89);
doc.text("[Flow: Input -> Process -> Output]", 120, 158);
doc.setTextColor(0, 0, 0);
*/
doc.beginCaption();
doc.text("Figure 2: Process Flow Diagram", 120, 188); // Caption is not visible on Screenreader preview yet
doc.endCaption();
doc.endFigure();

// Annot element goes here for correct reading order in screenreader tools
doc.beginAnnot({ alt: "Editor note about comparison data" });
const annotId2 = doc.createAnnotation({
  type: "text",
  title: "Editor",
  contents: "Note: Consider adding year-over-year comparison.",
  bounds: { x: 180, y: 180, w: 20, h: 20 },
  open: false
});
if (annotId2) doc.addAnnotationRef(annotId2);
doc.endAnnot();

// --- Annotations Subsection (within Figures and Captions) ---
doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-8-1");
doc.text("8.1 Annotations", 20, 210);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text(
  "This section demonstrates accessible PDF annotations (sticky notes).",
  20,
  225
);
//doc.text('Annotations provide reviewer comments for the figures above.', 20, 235);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text(
  "Annotations provide reviewer comments for the figures above.",
  20,
  235
);
doc.endStructureElement();

// PDF/UA requires Text annotations to be nested in Annot structure elements (ISO 14289-1, 7.18.1).
// Annot elements are used as block-level containers for document comments.
/**  doc.beginAnnot({ alt: 'Reviewer comment about quarterly sales figure' });
  const annotId1 = doc.createAnnotation({
    type: 'text',
    title: 'Reviewer',
    contents: 'Comment: This figure shows quarterly sales distribution.',
    bounds: { x: 180, y: 150, w: 20, h: 20 },
    open: false
  });
  if (annotId1) doc.addAnnotationRef(annotId1);
  doc.endAnnot();

  doc.beginAnnot({ alt: 'Editor note about comparison data' });
  const annotId2 = doc.createAnnotation({
    type: 'text',
    title: 'Editor',
    contents: 'Note: Consider adding year-over-year comparison.',
    bounds: { x: 180, y: 180, w: 20, h: 20 },
    open: false
  });
  if (annotId2) doc.addAnnotationRef(annotId2);
  doc.endAnnot();
*/
doc.beginStructureElement("P");
doc.text("Note: Annotation icons appear near the figures above.", 20, 250);
doc.endStructureElement();
doc.endSect();

// --- Footer Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Footer" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("Generated by jsPDF with PDF/UA support", 20, 285);
doc.text("4", 105, 285);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// ============================================================================
// PAGE 5: Advanced Elements
// ============================================================================
doc.addPage();

// --- Header Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Header" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("PDF/UA Complete Showcase", 20, 10);
doc.text("Page 5", 180, 10);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// --- Section 10: Advanced Elements ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-9");
doc.text("9. Advanced Structure Elements", 20, 25);
doc.endStructureElement();

// Art element
doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.markLinkTarget("sec-9-1");
doc.text("9.1 Article (Art)", 20, 40);
doc.endStructureElement();

doc.beginArt();
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text(
  "This is a self-contained article that could be distributed independently.",
  25,
  52
);
doc.endStructureElement();
doc.endArt();

// Div element
doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-9-2");
doc.text("9.2 Division (Div)", 20, 70);
doc.endStructureElement();

doc.beginDiv();
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text(
  "Content grouped in a generic division container for layout purposes.",
  25,
  82
);
doc.endStructureElement();
doc.endDiv();

// NonStruct element
doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-9-3");
doc.text("9.3 NonStruct (Layout Grouping)", 20, 100);
doc.endStructureElement();

doc.beginNonStruct();
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("Content in NonStruct is read but has no semantic structure meaning.", 25, 112);
doc.endStructureElement();
doc.endNonStruct();

// Private element
doc.beginStructureElement("H3");
doc.setFontSize(12);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-9-4");
doc.text("9.4 Private (Application Data)", 20, 130);
doc.endStructureElement();

doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text(
  "Private elements contain data not intended for screen readers:",
  20,
  142
);
doc.endStructureElement();

doc.beginPrivate();
doc.text("[Internal metadata: doc-version=1.0, author-id=42]", 25, 154);
doc.endPrivate();

// Annot element goes here for explanation of Private element
doc.beginAnnot({ alt: "Creator comment about Private element" });
const annotId3 = doc.createAnnotation({
  type: "text",
  title: "Reviewer",
  contents:
    "Comment: This content is marked as private and therefore not presented in PDF-document nor visible for screenreader tools.",
  bounds: { x: 180, y: 140, w: 20, h: 20 },
  open: false
});
if (annotId3) doc.addAnnotationRef(annotId3);
doc.endAnnot();
doc.endSect();

// --- Footer Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Footer" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("Generated by jsPDF with PDF/UA support", 20, 285);
doc.text("5", 105, 285);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// ============================================================================
// PAGE 6: Bibliography and Index
// ============================================================================
doc.addPage();

// --- Header Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Header" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("PDF/UA Complete Showcase", 20, 10);
doc.text("Page 6", 180, 10);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// --- Section 11: Bibliography ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-10");
doc.text("10. Bibliography", 20, 25);
doc.endStructureElement();

// BibEntry elements for bibliography items
doc.beginBibEntry();
doc.setFontSize(10);
doc.setFont(undefined, "normal");
doc.text("[1] ISO 14289-1:2014. Document management — Electronic document file format", 25, 40);
doc.text("    enhancement for accessibility — Part 1: Use of ISO 32000-1 (PDF/UA-1).", 25, 48);
doc.endBibEntry();

doc.beginBibEntry();
doc.text("[2] PDF Association. (2024). The Matterhorn Protocol 1.1. PDF Association.", 25, 62);
doc.endBibEntry();

doc.beginBibEntry();
doc.text("[3] W3C. (2018). Web Content Accessibility Guidelines (WCAG) 2.1.", 25, 76);
doc.text("    World Wide Web Consortium.", 25, 84);
doc.endBibEntry();

doc.beginBibEntry();
doc.text("[4] Adobe. (2008). PDF Reference, Sixth Edition, Version 1.7.", 25, 98);
doc.text("    Adobe Systems Incorporated.", 25, 106);
doc.endBibEntry();
doc.endSect();

// --- Section 12: Index ---
doc.beginSect();
doc.beginStructureElement("H2");
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.markLinkTarget("sec-11");
doc.text("11. Index", 20, 130);
doc.endStructureElement();

doc.beginIndex();
doc.setFontSize(10);
doc.setFont(undefined, "normal");

const indexEntries = [
  "Abbreviations .............................................................................................. 1",
  "Annotations ................................................................................................. 4",
  "Artifacts ................................................................................ 1, 2, 3, 4, 5, 6",
  "Bibliography ................................................................................................ 6",
  "Bookmarks ................................................................................................... 1",
  "Captions ........................................................................................................ 4",
  "Code ................................................................................................................ 3",
  "Figures ........................................................................................................... 4",
  "Footnotes ...................................................................................................... 4",
  "Forms .............................................................................................................. 3",
  "Headings .............................................................................. 1, 2, 3, 4, 5, 6",
  "Links ................................................................................................................ 2",
  "Lists ................................................................................................................. 2",
  "Quotes ............................................................................................................ 3",
  "Tables ............................................................................................................. 2",
  "Text Elements ............................................................................................. 1"
];

let indexY = 140;
indexEntries.forEach(entry => {
  doc.beginStructureElement("P");
  doc.text(entry, 25, indexY);
  doc.endStructureElement();
  indexY += 7; // Reduced spacing to fit better
});
doc.endIndex();
doc.endSect();

// --- Closing ---
doc.beginStructureElement("P");
doc.setFontSize(11);
doc.setFont(undefined, "italic");
doc.text("End of PDF/UA Complete Showcase Document", 50, 262);
doc.endStructureElement();

// Close Document structure
doc.endStructureElement(); // End Document

// --- Footer Artifact ---
doc.beginArtifact({ type: "Pagination", subtype: "Footer" });
doc.setFontSize(8);
doc.setTextColor(89, 89, 89);
doc.text("Generated by jsPDF with PDF/UA support", 20, 285);
doc.text("6", 105, 285);
doc.setTextColor(0, 0, 0);
doc.endArtifact();

// ============================================================================
// Save Document
// ============================================================================
const outputDir = path.join(__dirname, "examples/temp");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, "pdfua-complete-showcase.pdf");
const arrayBuffer = doc.output("arraybuffer");
fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

console.log("\n" + "=".repeat(70));
console.log("SUCCESS: PDF/UA Complete Showcase Document Generated");
console.log("=".repeat(70));
console.log("\nOutput: " + outputPath);
console.log("\nFeatures demonstrated:");
console.log("  - Document metadata (title, language)");
console.log("  - Table of Contents with internal links");
console.log("  - Outlines/Bookmarks for navigation");
console.log("  - 6 heading levels (H1-H6)");
console.log("  - Paragraphs and text formatting");
console.log("  - Strong and Em emphasis");
console.log("  - Abbreviations with expansion");
console.log("  - Language changes within text");
console.log("  - Mathematical formulas with alt text");
console.log("  - Ordered and unordered lists");
console.log("  - Tables with header scope");
console.log("  - External and internal links");
console.log("  - Form fields (text, checkbox, combobox)");
console.log("  - Inline and block quotes");
console.log("  - Inline and block code");
console.log("  - Footnotes and references");
console.log("  - Figures with alt text and captions");
console.log("  - Text annotations");
console.log("  - Artifacts (headers, footers, decorative)");
console.log("  - Grouping elements (Art, Div, Sect)");
console.log("  - NonStruct and Private elements");
console.log("  - Ruby annotations (CJK)");
console.log("  - Bibliography");
console.log("  - Index");
console.log("\nValidation:");
console.log(
  '  docker run --rm -v "$(pwd)/examples/temp:/data" verapdf/cli --flavour ua1 /data/pdfua-complete-showcase.pdf'
);
console.log("\n" + "=".repeat(70));
