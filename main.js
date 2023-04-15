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
  .highlighted-text {
    font-weight: bold;
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
  const el = document.createElement("span");
  el.classList.add("highlighted-text");

  try {
    el.appendChild(range.extractContents());
    range.insertNode(el);
    // Normalize the text nodes after applying styles
    el.parentNode.normalize();
  } catch (e) {
    console.error("Error while applying styles:", e);
  }
}

function removeStyleFromRange(range) {
  const currentParagraph = findParagraphTag(range.startContainer);
  const spanEl = findHighlightSpanTag(currentParagraph)

  if (spanEl && spanEl.classList.contains('highlighted-text')) {
    range.selectNodeContents(spanEl);

    try {
      const content = range.extractContents();
      range.deleteContents();
      spanEl.remove();
      range.insertNode(content);

      // Normalize the text nodes after removing styles
      content.parentNode.normalize();

    } catch (e) {
      console.error("Error while removing styles:", e);
    }
  }
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
  return currentElement.localName === 'p';
}

function isTextNode(currentElement) {
  return currentElement.nodeType === Node.TEXT_NODE
}

// Keep searching for paragraph tag by moving up DOM tree.
function findParagraphTag(currentContainer) {
  var currElement = currentContainer
  while (currElement) {
    if (isParagraphTag(currElement)) {
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

function findHighlightSpanTag(currentElement) {
  function isHighlightSpanTag(currentElem) {
    return currentElem && currentElem?.classList?.contains('highlighted-text');
  }

  // Check if the current element itself is a text node
  if (isHighlightSpanTag(currentElement)) {
    return currentElement;
  }

  // Loop through child nodes and search for text nodes recursively
  for (let i = 0; i < currentElement.childNodes.length; i++) {
    const childNode = currentElement.childNodes[i];
    const foundHighlightSpanNode = findHighlightSpanTag(childNode);

    if (foundHighlightSpanNode) {
      return foundHighlightSpanNode;
    }
  }

  // If no text node is found, return null
  return null;
}

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
  const sentences = [];
  let start = 0;
  let end = 0;

  // Loop through each character in the paragraph
  for (let i = 0; i < paragraph.length; i++) {
    const char = paragraph.charAt(i);

    // If the character is a period, exclamation point, or question mark,
    // add the sentence to the array and move the start index to the next character.
    // meake sure it's not part of a decimal number.
    var isEndOfParagraph = (i == paragraph.length - 1);
    var isNotDecimal = isNaN(paragraph.charAt(i - 1)) || isNaN(paragraph.charAt(i + 1));

    if ((char === '.' || char === '!' || char === '?' || isEndOfParagraph) && isNotDecimal) {
      end = i;
      var sentence = paragraph.slice(start, end + 1);
      if (sentence.trim().length > 0) {
        sentences.push(sentence);
      }
      start = i + 1;
    }
  }

  // Return the array of sentences objs.
  const allSentencesObjs = []
  var startIndex = 0
  for (let i = 0; i < sentences.length; i++) {
    var sentence = sentences[i]
    var endIndex = startIndex + sentence.length
    allSentencesObjs.push(new sentenceObject(startIndex, endIndex, sentence))
    startIndex += sentence.length
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