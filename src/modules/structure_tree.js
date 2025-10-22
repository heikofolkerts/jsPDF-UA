/**
 * @license
 * Copyright (c) 2025 Heiko Folkerts and contributors
 * Licensed under the MIT License.
 * https://github.com/parallax/jsPDF
 *
 * Structure Tree Module for PDF/UA
 *
 * This module implements the PDF structure tree (StructTreeRoot and StructElems)
 * which is required for PDF/UA compliance. The structure tree provides the logical
 * document structure that assistive technologies use to navigate the document.
 */

import { jsPDF } from "../jspdf.js";

(function(jsPDFAPI) {
  "use strict";

  /**
   * StructElement class - represents a structure element in the PDF structure tree
   */
  function StructElement(type, parent, api) {
    this.type = type;           // e.g. 'Document', 'P', 'H1', 'H2', etc.
    this.parent = parent;       // Parent structure element
    this.children = [];         // Child structure elements
    this.attributes = {};       // Element attributes
    this.mcids = [];            // Marked Content IDs (references to page content)
    this.objectNumber = null;   // PDF object number (assigned during output)
    this.id = null;             // Unique ID within the document
    this.api = api;             // Reference to jsPDF API
  }

  /**
   * Add a marked content ID to this structure element
   */
  StructElement.prototype.addMCID = function(pageNumber, mcid) {
    this.mcids.push({
      page: pageNumber,
      mcid: mcid
    });
  };

  /**
   * Add a child structure element
   */
  StructElement.prototype.addChild = function(child) {
    this.children.push(child);
    child.parent = this;
  };

  /**
   * Initialize the structure tree
   * This is called automatically when PDF/UA mode is enabled
   */
  var initStructureTree = function() {
    if (!this.internal.structureTree) {
      this.internal.structureTree = {
        root: null,              // StructTreeRoot
        currentParent: null,     // Current parent for new elements
        elements: [],            // All structure elements
        mcidCounter: {},         // MCID counter per page
        nextStructId: 0,         // Next unique structure ID
        stack: []                // Stack for nested elements
      };

      // Create root if PDF/UA is enabled
      if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
        createStructTreeRoot.call(this);
      }
    }
  };

  /**
   * Create the StructTreeRoot object
   * This is the top-level structure element that contains all other structure elements
   */
  var createStructTreeRoot = function() {
    if (this.internal.structureTree.root) {
      return this.internal.structureTree.root;
    }

    var root = {
      type: 'StructTreeRoot',
      id: this.internal.structureTree.nextStructId++,
      children: [],
      objectNumber: null,
      api: this
    };

    this.internal.structureTree.root = root;
    this.internal.structureTree.currentParent = root;

    return root;
  };

  /**
   * Begin a structure element
   * @param {string} type - Structure element type (e.g. 'Document', 'P', 'H1')
   * @param {object} attributes - Optional attributes for the element
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.beginStructureElement = function(type, attributes) {
    initStructureTree.call(this);

    var parent = this.internal.structureTree.currentParent;
    if (!parent) {
      parent = this.internal.structureTree.root;
    }

    var element = new StructElement(type, parent, this);
    element.attributes = attributes || {};
    element.id = this.internal.structureTree.nextStructId++;

    if (parent && parent.children) {
      parent.children.push(element);
    } else if (parent && parent.addChild) {
      parent.addChild(element);
    }

    // Push current parent to stack and set new parent
    this.internal.structureTree.stack.push(parent);
    this.internal.structureTree.currentParent = element;
    this.internal.structureTree.elements.push(element);

    return this;
  };

  /**
   * End the current structure element
   * @returns {jsPDF} - Returns jsPDF instance for method chaining
   */
  jsPDFAPI.endStructureElement = function() {
    if (!this.internal.structureTree || this.internal.structureTree.stack.length === 0) {
      return this;
    }

    // Pop parent from stack
    this.internal.structureTree.currentParent = this.internal.structureTree.stack.pop();

    return this;
  };

  /**
   * Get the current structure element
   * @returns {StructElement|null} - Current structure element or null
   */
  jsPDFAPI.getCurrentStructureElement = function() {
    if (!this.internal.structureTree) {
      return null;
    }
    return this.internal.structureTree.currentParent;
  };

  /**
   * Write a structure element to the PDF
   */
  var writeStructElement = function(elem) {
    elem.objectNumber = this.internal.newObject();

    this.internal.write('<< /Type /StructElem');
    this.internal.write('/S /' + elem.type);

    // Parent reference
    if (elem.parent && elem.parent.objectNumber) {
      this.internal.write('/P ' + elem.parent.objectNumber + ' 0 R');
    }

    // Children (K entry)
    if (elem.children.length > 0) {
      var kids = elem.children.map(function(c) {
        return c.objectNumber + ' 0 R';
      }).join(' ');
      this.internal.write('/K [' + kids + ']');
    } else if (elem.mcids.length > 0) {
      // If no children but has MCIDs, write MCID array
      if (elem.mcids.length === 1) {
        this.internal.write('/K ' + elem.mcids[0].mcid);
      } else {
        var mcidArray = elem.mcids.map(function(m) {
          return m.mcid;
        }).join(' ');
        this.internal.write('/K [' + mcidArray + ']');
      }
    }

    // Attributes (optional)
    if (elem.attributes && Object.keys(elem.attributes).length > 0) {
      // For now, we skip attributes - they will be added in later sprints
    }

    this.internal.write('>>');
    this.internal.write('endobj');
  };

  /**
   * Write the structure tree to the PDF
   * This is called during PDF generation after all content is written
   */
  var writeStructTree = function() {
    if (!this.internal.structureTree || !this.internal.structureTree.root) {
      return;
    }

    var root = this.internal.structureTree.root;

    // Write all structure elements first (depth-first)
    var elements = this.internal.structureTree.elements;
    for (var i = 0; i < elements.length; i++) {
      writeStructElement.call(this, elements[i]);
    }

    // Write StructTreeRoot
    root.objectNumber = this.internal.newObject();
    this.internal.write('<< /Type /StructTreeRoot');

    if (root.children.length > 0) {
      var rootKids = root.children.map(function(c) {
        return c.objectNumber + ' 0 R';
      }).join(' ');
      this.internal.write('/K [' + rootKids + ']');
    }

    this.internal.write('>>');
    this.internal.write('endobj');
  };

  /**
   * Add StructTreeRoot reference to Catalog
   */
  var putCatalog = function() {
    if (this.internal.structureTree && this.internal.structureTree.root) {
      var root = this.internal.structureTree.root;
      if (root.objectNumber) {
        this.internal.write('/StructTreeRoot ' + root.objectNumber + ' 0 R');
      }
    }
  };

  /**
   * Write MarkInfo dictionary to PDF
   * MarkInfo is required for PDF/UA and contains the Marked flag
   */
  var writeMarkInfo = function() {
    if (!this.isPDFUAEnabled || !this.isPDFUAEnabled()) {
      return;
    }

    if (!this.internal.markInfo) {
      this.internal.markInfo = {};
    }

    // Create MarkInfo dictionary
    var markInfoObjId = this.internal.newObject();
    this.internal.write('<< /Marked true');
    this.internal.write('>>');
    this.internal.write('endobj');

    // Store reference for Catalog
    this.internal.markInfo.objectNumber = markInfoObjId;
  };

  /**
   * Add MarkInfo reference to Catalog for PDF/UA
   */
  var putCatalogMarkInfo = function() {
    if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
      if (this.internal.markInfo && this.internal.markInfo.objectNumber) {
        this.internal.write('/MarkInfo ' + this.internal.markInfo.objectNumber + ' 0 R');
      }
    }
  };

  /**
   * Initialize structure tree when PDF/UA is enabled
   */
  jsPDFAPI.events.push([
    "initialized",
    function() {
      if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
        initStructureTree.call(this);
        createStructTreeRoot.call(this);
      }
    }
  ]);

  /**
   * Write MarkInfo dictionary before structure tree
   */
  jsPDFAPI.events.push([
    "postPutResources",
    writeMarkInfo
  ]);

  /**
   * Write structure tree before finalizing PDF
   */
  jsPDFAPI.events.push([
    "postPutResources",
    writeStructTree
  ]);

  /**
   * Add MarkInfo reference to Catalog
   */
  jsPDFAPI.events.push([
    "putCatalog",
    putCatalogMarkInfo
  ]);

  /**
   * Add StructTreeRoot to Catalog
   */
  jsPDFAPI.events.push([
    "putCatalog",
    putCatalog
  ]);

})(jsPDF.API);

export default jsPDF;
