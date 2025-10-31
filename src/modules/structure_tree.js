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
   * Get next MCID for current page
   * @returns {number} - Next MCID for the current page
   */
  jsPDFAPI.getNextMCID = function() {
    initStructureTree.call(this);
    var pageNumber = this.internal.getCurrentPageInfo().pageNumber;
    if (!this.internal.structureTree.mcidCounter[pageNumber]) {
      this.internal.structureTree.mcidCounter[pageNumber] = 0;
    }
    return this.internal.structureTree.mcidCounter[pageNumber]++;
  };

  /**
   * Add MCID to current structure element
   * @param {number} mcid - Marked Content ID
   * @param {number} pageNumber - Page number
   */
  jsPDFAPI.addMCIDToCurrentStructure = function(mcid, pageNumber) {
    if (!this.internal.structureTree || !this.internal.structureTree.currentParent) {
      return;
    }
    var currentElem = this.internal.structureTree.currentParent;
    if (currentElem.type !== 'StructTreeRoot') {
      currentElem.addMCID(pageNumber, mcid);
    }
  };

  /**
   * Write ParentTree - maps page MCIDs to structure elements
   */
  var writeParentTree = function() {
    if (!this.internal.structureTree || !this.internal.structureTree.root) {
      return;
    }

    // Build mapping: page -> mcid -> structElement
    var parentTree = {};
    var elements = this.internal.structureTree.elements;

    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      if (elem.mcids && elem.mcids.length > 0) {
        for (var j = 0; j < elem.mcids.length; j++) {
          var mcidInfo = elem.mcids[j];
          var pageKey = mcidInfo.page - 1; // Pages are 0-indexed in ParentTree

          if (!parentTree[pageKey]) {
            parentTree[pageKey] = [];
          }

          if (!parentTree[pageKey][mcidInfo.mcid]) {
            parentTree[pageKey][mcidInfo.mcid] = elem.objectNumber;
          }
        }
      }
    }

    // First, create indirect array objects for each page
    var pageKeys = Object.keys(parentTree).sort(function(a, b) { return a - b; });
    var pageArrayObjects = {};

    for (var k = 0; k < pageKeys.length; k++) {
      var pageNum = pageKeys[k];
      var mcidMap = parentTree[pageNum];

      // Build the array for this page
      var pageArray = [];
      var maxMcid = 0;

      for (var mcid in mcidMap) {
        if (parseInt(mcid) > maxMcid) maxMcid = parseInt(mcid);
      }

      for (var m = 0; m <= maxMcid; m++) {
        if (mcidMap[m]) {
          pageArray.push(mcidMap[m] + ' 0 R');
        } else {
          pageArray.push('null');
        }
      }

      // Create an indirect object for this array
      var arrayObjNum = this.internal.newObject();
      this.internal.write('[' + pageArray.join(' ') + ']');
      this.internal.write('endobj');

      pageArrayObjects[pageNum] = arrayObjNum;
    }

    // Now write ParentTree as NumberTree with references to the array objects
    var parentTreeObj = this.internal.newObject();
    this.internal.write('<< /Nums [');

    for (var k = 0; k < pageKeys.length; k++) {
      var pageNum = pageKeys[k];
      this.internal.write(pageNum + ' ' + pageArrayObjects[pageNum] + ' 0 R');
    }

    this.internal.write(']');
    this.internal.write('>>');
    this.internal.write('endobj');

    // Store reference for StructTreeRoot
    this.internal.structureTree.parentTreeObj = parentTreeObj;
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
    var elements = this.internal.structureTree.elements;

    // PASS 1: Reserve object numbers for all elements first
    for (var i = 0; i < elements.length; i++) {
      elements[i].objectNumber = this.internal.newObjectDeferred();
    }

    // PASS 2: Write all structure elements with correct references
    for (var i = 0; i < elements.length; i++) {
      var elem = elements[i];
      this.internal.out(elem.objectNumber + ' 0 obj');
      this.internal.write('<< /Type /StructElem');
      this.internal.write('/S /' + elem.type);

      // Parent reference
      if (elem.parent && elem.parent.objectNumber) {
        this.internal.write('/P ' + elem.parent.objectNumber + ' 0 R');
      }

      // Page reference (required when element has MCIDs)
      if (elem.mcids.length > 0) {
        var pageNum = elem.mcids[0].page;
        var pageObjId = 2 + pageNum;
        this.internal.write('/Pg ' + pageObjId + ' 0 R');
      }

      // Children (K entry)
      if (elem.children.length > 0) {
        var kids = elem.children.map(function(c) {
          return c.objectNumber + ' 0 R';
        }).join(' ');
        this.internal.write('/K [' + kids + ']');
      } else if (elem.mcids.length > 0) {
        if (elem.mcids.length === 1) {
          this.internal.write('/K ' + elem.mcids[0].mcid);
        } else {
          var mcidArray = elem.mcids.map(function(m) {
            return m.mcid;
          }).join(' ');
          this.internal.write('/K [' + mcidArray + ']');
        }
      }

      this.internal.write('>>');
      this.internal.write('endobj');
    }

    // Write ParentTree
    writeParentTree.call(this);

    // Write RoleMap (empty but required for PDF/UA)
    var roleMapObj = this.internal.newObject();
    this.internal.write('<< >>');
    this.internal.write('endobj');

    // Write StructTreeRoot
    root.objectNumber = this.internal.newObject();
    this.internal.write('<< /Type /StructTreeRoot');

    if (root.children.length > 0) {
      var rootKids = root.children.map(function(c) {
        return c.objectNumber + ' 0 R';
      }).join(' ');
      this.internal.write('/K [' + rootKids + ']');
    }

    // Add ParentTree reference
    if (this.internal.structureTree.parentTreeObj) {
      this.internal.write('/ParentTree ' + this.internal.structureTree.parentTreeObj + ' 0 R');
    }

    // Add RoleMap reference
    this.internal.write('/RoleMap ' + roleMapObj + ' 0 R');

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

  /**
   * Add /Lang to Catalog for document language
   */
  var putCatalogLang = function() {
    if (this.isPDFUAEnabled && this.isPDFUAEnabled()) {
      this.internal.write('/Lang (en-US)');
    }
  };

  jsPDFAPI.events.push([
    "putCatalog",
    putCatalogLang
  ]);

  /**
   * Add StructParents to each page
   */
  var putStructParentsInPage = function() {
    if (!this.isPDFUAEnabled || !this.isPDFUAEnabled()) {
      return;
    }
    var pageNumber = this.internal.getCurrentPageInfo().pageNumber;
    this.internal.write('/StructParents ' + (pageNumber - 1));
  };

  jsPDFAPI.events.push(["putPage", putStructParentsInPage]);

})(jsPDF.API);

export default jsPDF;
