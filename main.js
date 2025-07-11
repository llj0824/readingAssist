const MAX_LETTERS_MISSING_SELECTED_SENTENCE = 5

function sentenceObject(startOffset, endOffset, sentence) {
  this.startOffset = startOffset
  this.endOffset = endOffset
  this.sentence = sentence
}

function NodeObject(startOffset, endOffset, node) {
  this.startOffset = startOffset
  this.endOffset = endOffset
  this.node = node
}

// Style element for highlighted text.
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  .reading-assist-highlight {
    background-color: rgba(255, 235, 59, 0.5) !important;
    font-weight: bold !important;
    border-radius: 2px;
    box-shadow: 0 0 0 2px rgba(255, 235, 59, 0.3);
    transition: all 0.2s ease;
  }
  
  /* Remove highlight from all text nodes */
  .reading-assist-clear * {
    background-color: transparent !important;
    font-weight: inherit !important;
    box-shadow: none !important;
  }
`;
document.head.appendChild(styleElement);

function highlightSentence() {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentContainer = currentRange.startContainer;
  const currentParagraph = findParagraphTag(currentContainer)

  // case 1: initial load - nothing is selected
  const isTextSelected = window.getSelection().type !== "None"
  if (!isTextSelected) {
    return
  }

  // case 2: moving to next paragraph
  if (isEndOfParagraph(currentParagraph)) {
    console.log("Going to next paragraph")
    var nextParagraphElement = nextParagraph(currentParagraph)
    var isNewParagraphNode = true
    return highlightNextSentence(nextParagraphElement, isNewParagraphNode)
  }

  // case 3 - increment to next sentence 
  console.log("Incrementing current sentence")
  var isNewParagraphNode = false
  highlightNextSentence(currentParagraph, isNewParagraphNode)
}

function isEndOfParagraph(currentParagraph) {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);

  const allSentencesObjs = splitParagraphBySentences(currentParagraph.textContent)
  const lastSentenceObj = allSentencesObjs[allSentencesObjs.length - 1]
  const isEntireSentenceSelected = lastSentenceObj.sentence.trim() === currentRange.toString().trim()
  if (!isEntireSentenceSelected) {
    return false
  }

  // check if current selection is the last sentence of paragraph tag text.
  const currSentenceObj = findCorrespondingSentence(allSentencesObjs, currentRange)
  const isLastSentence = (currSentenceObj === lastSentenceObj)
  return isLastSentence
}

function nextParagraph(currentParagraph) {
  // Note: expected input is <p> tag, nested or non_nested.
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);

  var nextParagraph = currentParagraph.nextSibling
  while (nextParagraph) {
    if (isParagraphTag(nextParagraph)) {
      return nextParagraph
    }
    nextParagraph = nextParagraph.nextSibling
  }
  return undefined
}

// Given a paragraph html text node, selects the next sentence.
// Note this should take nested <p> tag and non-nested <p> tag.
function highlightNextSentence(currentParagraph, isNewParagraphNode) {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentTextSelection = currentRange.toString();

  // Remove style from previous sentence if any
  removeStyleFromRange(currentRange);

  const allSentencesObjs = splitParagraphBySentences(currentParagraph.textContent)
  // Get current & next sentence details
  const currSentenceObj = findCorrespondingSentence(allSentencesObjs, currentRange)

  var nextSentenceObj
  if (isNewParagraphNode) {
    // Case - New paragraph, use the first sentence.
    nextSentenceObj = allSentencesObjs[0]
  } else if (currSentenceObj.sentence.length > currentTextSelection.length + MAX_LETTERS_MISSING_SELECTED_SENTENCE) {
    // Case - Only fragment of sentence selected. Select the entire sentence.
    nextSentenceObj = currSentenceObj
  } else {
    // Case - select next sentence 
    nxtSentenceIdx = allSentencesObjs.indexOf(currSentenceObj) + 1
    if (nxtSentenceIdx > allSentencesObjs.length) {
      console.error("Going to next paragraph. This should've been handled elsewhere.")
    }
    nextSentenceObj = allSentencesObjs[nxtSentenceIdx]
  }


  // create a new range for the next sentence
  const nextRange = document.createRange();
  if (isNestedParagraphTag(currentParagraph)) {
    // need to find corresponding start & end textNode for nextSentence
    // it could span different nested tags
    const {
      startingTextNode,
      endingTextNode
    } = findNestedParagraphStartEndNodes(currentParagraph, nextSentenceObj)

    // Note: first child of html elements are Text Node. Range expected Text Nodes.
    nextRange.setStart(findEmbeddedTextNode(startingTextNode.node), startingTextNode.startOffset);
    nextRange.setEnd(findEmbeddedTextNode(endingTextNode.node), endingTextNode.endOffset);
  } else {
    nextRange.setStart(currentParagraph.firstChild, nextSentenceObj.startOffset);
    nextRange.setEnd(currentParagraph.firstChild, nextSentenceObj.endOffset);
  }

  // scroll the screen down
  const focusOnElement = nextRange.startContainer.parentNode;
  focusOnElement.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  // select the new range
  currentSelection.removeAllRanges();
  currentSelection.addRange(nextRange);

  // Apply bold and light red style on selected element
  applyStyleToRange(nextRange);
}

function applyStyleToRange(range) {
  try {
    // Clear any existing highlights first
    clearAllHighlights();
    
    // Get all text nodes in the range
    const textNodes = getTextNodesInRange(range);
    
    // Apply highlight class to parent elements of text nodes
    textNodes.forEach(node => {
      const parent = node.parentElement;
      if (parent) {
        parent.classList.add('reading-assist-highlight');
      }
    });
  } catch (e) {
    console.error("Error while applying styles:", e);
  }
}

// Helper function to get all text nodes within a range
function getTextNodesInRange(range) {
  const textNodes = [];
  const container = range.commonAncestorContainer;
  
  function collectTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Check if this text node is within our range
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(node);
      
      if (range.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0 &&
          range.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0) {
        textNodes.push(node);
      }
    } else {
      for (let child of node.childNodes) {
        collectTextNodes(child);
      }
    }
  }
  
  collectTextNodes(container);
  return textNodes;
}

// Clear all highlights in the document
function clearAllHighlights() {
  document.querySelectorAll('.reading-assist-highlight').forEach(el => {
    el.classList.remove('reading-assist-highlight');
  });
}

function removeStyleFromRange(range) {
  // Simply clear all highlights - much simpler and safer
  clearAllHighlights();
}

// Find the text node of nested paragraph that corresponds with sentence.
function findNestedParagraphStartEndNodes(nestedParagraph, sentenceObj) {
  const beginingSentenceOffset = sentenceObj.startOffset
  const endingSentenceOffset = sentenceObj.endOffset
  const mapOfHtmlNodeToStartEndCharacterIndex = mapOfNestedTagToStartEndCharacterOffsets(nestedParagraph)


  var startingNode;
  var endingNode;
  for (const [node, range] of mapOfHtmlNodeToStartEndCharacterIndex.entries()) {
    // [rangeStart, sentenceBegining, rangeEnd] => this node contains begining section of sentence.
    if (range.startIndex <= beginingSentenceOffset && range.endIndex >= beginingSentenceOffset) {
      startingNode = {
        startOffset: (beginingSentenceOffset - range.startIndex),
        endOffset: undefined,
        node: node
      }
    }
    // [rangeStart, sentenceEnd, rangeEnd] => this node contains ending section of sentence.
    if (range.startIndex <= endingSentenceOffset && range.endIndex >= endingSentenceOffset) {
      endingNode = {
        startOffset: undefined,
        endOffset: (endingSentenceOffset - range.startIndex),
        node: node
      }
    }
    // [rangeStart, sentenceBegining, sentenceEnding, rangeEnd] => this node contains entirety of sentence.
    if (range.startIndex <= beginingSentenceOffset && range.endingIndex >= endingSentenceOffset) {
      startingNode = {
        startOffset: (beginingSentenceOffset - range.startIndex),
        endOffset: (range.endIndex - endingSentenceOffset),
        node: node
      }
      endingNode = {
        startOffset: (beginingSentenceOffset - range.startIndex),
        endOffset: (range.endIndex - endingSentenceOffset),
        node: node
      }
    }
  }

  if (!startingNode || !endingNode) {
    console.log(`Unable to find corresponding nested tag for sentenceObj: ${sentenceObj}`)
    console.log(`nestedParagraph: ${nestedParagraph}`)
  }
  return {
    startingTextNode: startingNode,
    endingTextNode: endingNode
  }
}

// return map<nestedTag, startOffset + endOffset of inner text>
function mapOfNestedTagToStartEndCharacterOffsets(nestedParagraph) {
  // make a map of nested tag -> [beginning, end] index offset
  const mapOfHtmlNodeToStartEndCharacterIndex = new Map();
  const allText = nestedParagraph.textContent;

  // Recursively process child nodes.
  function processChildNodes(node, lastMatchedIndex) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];

      if (child.nodeType === Node.TEXT_NODE) {
        const childText = child.textContent;
        const startingIndexInParagraph = lastMatchedIndex;
        const endingIndex = startingIndexInParagraph + childText.length;

        // lastMatchedIndex is to prevent overlapping text in different child nodes
        // from matching to same index in parent paragraph.
        lastMatchedIndex = endingIndex;

        mapOfHtmlNodeToStartEndCharacterIndex.set(child, {
          startIndex: startingIndexInParagraph,
          endIndex: endingIndex,
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // Process nested element nodes recursively
        lastMatchedIndex = processChildNodes(child, lastMatchedIndex);
      }
    }

    return lastMatchedIndex;
  }

  processChildNodes(nestedParagraph, 0);

  return mapOfHtmlNodeToStartEndCharacterIndex;
}

function isNestedParagraphTag(element) {
  // Note: we may not need this nested paragraph logic.
  // Treat nonnested paragraph as just nested paragraph with one child.
  return element.childNodes.length > 1
}

function isParagraphTag(currentElement) {
  // Support common text containers, not just <p> tags
  const textContainers = ['p', 'div', 'article', 'section', 'span', 'li', 'td', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  return textContainers.includes(currentElement.localName);
}

function isTextNode(currentElement) {
  return currentElement.nodeType === Node.TEXT_NODE
}

// Keep searching for text container by moving up DOM tree.
function findParagraphTag(currentContainer) {
  var currElement = currentContainer
  while (currElement) {
    // Check if it's a valid text container AND has substantial text content
    if (isParagraphTag(currElement) && currElement.textContent.trim().length > 20) {
      return currElement
    }
    currElement = currElement.parentNode
  }
}

// Keep searching for text node by moving down the DOM tree.
function findEmbeddedTextNode(currentElement) {
  // Check if the current element itself is a text node
  if (isTextNode(currentElement)) {
    return currentElement;
  }

  // Loop through child nodes and search for text nodes recursively
  for (let i = 0; i < currentElement.childNodes.length; i++) {
    const childNode = currentElement.childNodes[i];
    const foundTextNode = findEmbeddedTextNode(childNode);

    if (foundTextNode) {
      return foundTextNode;
    }
  }

  // If no text node is found, return null
  return null;
}

// This function is no longer needed with the new CSS-based approach

function findCorrespondingSentence(allSentencesObjs, currentRange) {
  const targetStartIndex = currentRange.startOffset
  const targetEndIndex = currentRange.endOffset

  // case 1 - a full sentence is selected.
  for (let i = 0; i < allSentencesObjs.length; i++) {
    var sentenceObj = allSentencesObjs[i]
    if (sentenceObj.sentence.trim() === currentRange.toString().trim()) {
      return sentenceObj
    }
  }

  // case 2 - only a subset of words are selected. 
  // Note this will still break if selection is spans multiple tags...
  for (let i = 0; i < allSentencesObjs.length; i++) {
    sentenceObj = allSentencesObjs[i]
    if (sentenceObj.startOffset <= targetStartIndex && sentenceObj.endOffset >= targetEndIndex) {
      return sentenceObj
    }
  }

  return undefined
}


function splitParagraphBySentences(paragraph) {
  // Common abbreviations to avoid splitting on
  const abbreviations = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Sr.', 'Jr.', 'Ph.D', 'M.D', 'B.A', 'M.A', 'B.S', 'M.S', 
                        'i.e.', 'e.g.', 'etc.', 'vs.', 'Inc.', 'Ltd.', 'Co.', 'Corp.', 'U.S.', 'U.K.'];
  
  // First, protect abbreviations by replacing their dots temporarily
  let protectedText = paragraph;
  abbreviations.forEach(abbr => {
    protectedText = protectedText.replace(new RegExp(abbr.replace('.', '\\.'), 'g'), abbr.replace(/\./g, '$$DOT$$'));
  });
  
  // Also protect decimal numbers and URLs
  protectedText = protectedText.replace(/(\d)\.(\d)/g, '$1$$DOT$$$2');
  protectedText = protectedText.replace(/(https?:\/\/[^\s]+)/g, (match) => match.replace(/\./g, '$$DOT$$'));
  
  const sentences = [];
  let start = 0;
  
  // Split on sentence endings followed by space and capital letter (or end of text)
  const sentenceEndings = /([.!?])\s+(?=[A-Z])|([.!?])$/g;
  let match;
  
  while ((match = sentenceEndings.exec(protectedText)) !== null) {
    let end = match.index + match[1].length;
    let sentence = protectedText.slice(start, end);
    
    // Restore protected dots
    sentence = sentence.replace(/\$\$DOT\$\$/g, '.');
    
    if (sentence.trim().length > 0) {
      sentences.push(sentence);
    }
    start = end;
  }
  
  // Don't forget the last sentence if text doesn't end with punctuation
  if (start < protectedText.length) {
    let sentence = protectedText.slice(start);
    sentence = sentence.replace(/\$\$DOT\$\$/g, '.');
    if (sentence.trim().length > 0) {
      sentences.push(sentence);
    }
  }
  
  // Return the array of sentence objects
  const allSentencesObjs = [];
  let startIndex = 0;
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const endIndex = startIndex + sentence.length;
    allSentencesObjs.push(new sentenceObject(startIndex, endIndex, sentence));
    startIndex += sentence.length;
  }
  return allSentencesObjs;
}

// Event listener functions
const onKeyDown = (event) => {
  const isTyping =
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA";

  if (event.code === "Space" && !isTyping) {
    // Disable default space scrolling down the screen
    event.preventDefault();
  }
};

const onKeyUp = (event) => {
  const isTyping =
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA";

  if (event.code === "Space" && !isTyping) {
    highlightSentence();
  }
};

// Function to enable/disable functionality based on extension toggle state
function setExtensionOnOff(isExtensionOn) {
  if (isExtensionOn) {
    console.log("Disabling space bar default behaviors")
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  } else {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
  }
}

// Turn off extension by default. Otherwise "space bar" doesn't work when typing.
chrome.storage.sync.set({
  isExtensionOn: false
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.hasOwnProperty('isExtensionOn')) {
    setExtensionOnOff(request.isExtensionOn);
  }
});

chrome.storage.sync.get(['isExtentionON'], result => {
  setExtensionOnOff(result.isExtentionON);
});