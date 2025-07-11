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
  } else if (currSentenceObj && currSentenceObj.sentence.length > currentTextSelection.length + MAX_LETTERS_MISSING_SELECTED_SENTENCE) {
    // Case - Only fragment of sentence selected. Select the entire sentence.
    nextSentenceObj = currSentenceObj
  } else if (currSentenceObj) {
    // Case - select next sentence 
    const nxtSentenceIdx = allSentencesObjs.indexOf(currSentenceObj) + 1
    if (nxtSentenceIdx >= allSentencesObjs.length) {
      console.error("Going to next paragraph. This should've been handled elsewhere.")
      return;
    }
    nextSentenceObj = allSentencesObjs[nxtSentenceIdx]
  } else {
    // Fallback to first sentence if we can't find current
    nextSentenceObj = allSentencesObjs[0]
  }

  if (!nextSentenceObj) {
    console.error("No next sentence found");
    return;
  }

  // Create range using improved text node finding
  const nextRange = createRangeForSentence(currentParagraph, nextSentenceObj);
  if (!nextRange) {
    console.error("Could not create range for sentence");
    return;
  }

  // Smooth scroll to keep text in view
  const focusOnElement = nextRange.startContainer.parentNode;
  focusOnElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest"
  });

  // Select the new range
  currentSelection.removeAllRanges();
  currentSelection.addRange(nextRange);

  // Apply highlighting
  applyStyleToRange(nextRange);
}

// Create a range for a sentence within a container
function createRangeForSentence(container, sentenceObj) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let currentOffset = 0;
  let startNode = null;
  let startOffset = 0;
  let endNode = null;
  let endOffset = 0;
  
  // Walk through all text nodes to find our sentence boundaries
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLength = node.textContent.length;
    const nodeEndOffset = currentOffset + nodeLength;
    
    // Check if this node contains the start of our sentence
    if (!startNode && sentenceObj.startOffset >= currentOffset && sentenceObj.startOffset < nodeEndOffset) {
      startNode = node;
      startOffset = sentenceObj.startOffset - currentOffset;
    }
    
    // Check if this node contains the end of our sentence
    if (!endNode && sentenceObj.endOffset > currentOffset && sentenceObj.endOffset <= nodeEndOffset) {
      endNode = node;
      endOffset = sentenceObj.endOffset - currentOffset;
    }
    
    // If we've found both, we're done
    if (startNode && endNode) {
      break;
    }
    
    currentOffset = nodeEndOffset;
  }
  
  // Create range if we found both nodes
  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      return range;
    } catch (e) {
      console.error("Error creating range:", e);
      return null;
    }
  }
  
  return null;
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

// Removed - no longer needed with improved text traversal

// Removed - no longer needed with improved text traversal

// Removed - no longer needed with improved text traversal

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
  
  // First, try to find the best readable container
  const readableContainer = findBestReadableContainer(currElement);
  if (readableContainer) {
    return readableContainer;
  }
  
  // Fallback to original logic if no good container found
  while (currElement) {
    // Check if it's a valid text container AND has substantial text content
    if (isParagraphTag(currElement) && currElement.textContent.trim().length > 20) {
      return currElement
    }
    currElement = currElement.parentNode
  }
  return null;
}

// Find the best container with readable text content
function findBestReadableContainer(startElement) {
  let current = startElement;
  let bestContainer = null;
  let bestScore = 0;
  
  while (current && current !== document.body) {
    if (isParagraphTag(current)) {
      const score = scoreReadableContainer(current);
      if (score > bestScore) {
        bestScore = score;
        bestContainer = current;
      }
    }
    current = current.parentElement;
  }
  
  // Only return if we found a good container
  return bestScore > 50 ? bestContainer : null;
}

// Score a container based on how likely it contains readable content
function scoreReadableContainer(element) {
  let score = 0;
  
  // Base score from text length
  const textLength = element.textContent.trim().length;
  if (textLength > 100) score += 50;
  else if (textLength > 50) score += 30;
  else if (textLength > 20) score += 10;
  else return 0; // Too short
  
  // Bonus for semantic elements
  const semanticTags = ['article', 'section', 'main', 'p', 'blockquote'];
  if (semanticTags.includes(element.tagName.toLowerCase())) {
    score += 20;
  }
  
  // Penalty for likely navigation/UI elements
  const classAndId = (element.className + ' ' + element.id).toLowerCase();
  const badPatterns = ['nav', 'menu', 'sidebar', 'header', 'footer', 'toolbar', 'widget', 'ad', 'banner', 'popup'];
  if (badPatterns.some(pattern => classAndId.includes(pattern))) {
    score -= 30;
  }
  
  // Bonus for content-indicating classes
  const goodPatterns = ['content', 'article', 'post', 'entry', 'text', 'body', 'main', 'story'];
  if (goodPatterns.some(pattern => classAndId.includes(pattern))) {
    score += 15;
  }
  
  // Check text-to-link ratio (too many links = probably navigation)
  const links = element.querySelectorAll('a');
  const linkTextLength = Array.from(links).reduce((sum, link) => sum + link.textContent.length, 0);
  if (linkTextLength > textLength * 0.5) {
    score -= 20;
  }
  
  return score;
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