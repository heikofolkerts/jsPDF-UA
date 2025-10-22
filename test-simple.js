// Simple test to create a basic PDF for veraPDF testing
const { jsPDF } = require('./dist/jspdf.node.min.js');

const doc = new jsPDF();
doc.setProperties({ title: 'Test Document' });
doc.text('Hello World!', 10, 10);
doc.save('test-simple.pdf');

console.log('Created test-simple.pdf');
