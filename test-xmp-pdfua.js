// Test PDF/UA XMP metadata implementation (US-1.2)
const { jsPDF } = require('./dist/jspdf.node.min.js');

console.log('Testing PDF/UA XMP Metadata (US-1.2)...\n');

// Test: PDF with PDF/UA and title
console.log('Creating PDF with PDF/UA mode and title...');
const doc = new jsPDF({ pdfUA: true });
doc.setDocumentTitle('My Accessible PDF Document');
doc.text('Hello PDF/UA!', 10, 10);
doc.save('test-xmp-pdfua.pdf');

console.log('✓ PDF created: test-xmp-pdfua.pdf');
console.log('\nExpected XMP metadata:');
console.log('  - pdfuaid:part = 1');
console.log('  - pdfuaid:conformance = A');
console.log('  - dc:title = "My Accessible PDF Document"');
console.log('\nValidate with:');
console.log('  docker run --rm -v $(pwd):/data verapdf/cli:latest --flavour ua1 /data/test-xmp-pdfua.pdf');
