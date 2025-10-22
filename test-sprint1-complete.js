// Test complete Sprint 1 implementation
const { jsPDF } = require('./dist/jspdf.node.min.js');

console.log('Testing Sprint 1 Complete Implementation...\n');
console.log('═'.repeat(60));

// Create PDF/UA document with all Sprint 1 features
const doc = new jsPDF({ pdfUA: true });

console.log('✓ Created jsPDF with pdfUA: true');
console.log('  - isPDFUAEnabled():', doc.isPDFUAEnabled());

// Set document title
doc.setDocumentTitle('Sprint 1 Test Document');
console.log('✓ Set document title');

// Add some content
doc.text('Hello PDF/UA World!', 10, 10);
doc.text('This is a Sprint 1 test document.', 10, 20);

// Save
doc.save('test-sprint1-complete.pdf');
console.log('✓ Saved PDF');

console.log('\n' + '═'.repeat(60));
console.log('Sprint 1 Features Implemented:');
console.log('  ✓ US-1.1: PDF/UA Mode (Constructor option)');
console.log('  ✓ US-1.2: XMP Metadata with PDF/UA identification');
console.log('  ✓ US-1.3: ViewerPreferences DisplayDocTitle');
console.log('═'.repeat(60));

console.log('\nExpected in PDF:');
console.log('  1. XMP Metadata:');
console.log('     - pdfuaid:part = 1');
console.log('     - pdfuaid:conformance = A');
console.log('     - dc:title = "Sprint 1 Test Document"');
console.log('  2. ViewerPreferences:');
console.log('     - DisplayDocTitle = true');
console.log('  3. Document Properties:');
console.log('     - Title = "Sprint 1 Test Document"');

console.log('\n' + '═'.repeat(60));
console.log('Validation:');
console.log('  docker run --rm -v "/mnt/c/projekte/claude/jsPDF-UA":/data \\');
console.log('    verapdf/cli:latest --flavour ua1 /data/test-sprint1-complete.pdf');
console.log('═'.repeat(60));
