const MAX_LETTERS_MISSING_SELECTED_SENTENCE = 5

function sentenceObject(startOffset, endOffset, sentence) {
  this.startOffset = startOffset
  this.endOffset = endOffset
  this.sentence = sentence
}

function highlightSentence(currentDom) {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentParagraph = currentRange.startContainer.parentNode;
  // case 1: initial load - nothing is selected
  const isTextSelected = window.getSelection().type !== "None"
  if (!isTextSelected) {
    return
  }

  // case 2: moving to next paragraph
  if (isEndOfParagraph()) {
    debugger
    console.log("Going to next paragraph")
    nextParagraph()
    return
  }

  // case 3 - increment to next sentence 
  console.log("Incrementing current sentence")
  var isNewParagraphNode = false
  highlightNextSentence(currentParagraph, isNewParagraphNode)
}

function isEndOfParagraph() {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentParagraph = currentRange.startContainer.parentNode;
  const allSentences = splitParagraphBySentences(currentParagraph.textContent)
  const allSentencesObjs = []
  var startIndex = 0
  for (let i = 0; i < allSentences.length; i++) {
    var sentence = allSentences[i]
    var endIndex = startIndex + sentence.length
    allSentencesObjs.push(new sentenceObject(startIndex, endIndex, sentence))
    startIndex += sentence.length
  }

  // Get current & next sentence details
  const currSentenceObj = findCorrespondingSentence(allSentencesObjs, currentRange)
  const isLastSentence = (currSentenceObj === allSentencesObjs[allSentencesObjs.length - 1])
  return isLastSentence
}

function nextParagraph() {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentElement = currentRange.startContainer.parentNode;

  // Find the next valid element (paragraph or span)
  // case - if nested tag and final tag then move to next <p> tag

  var isParagraphNode = (currentElement.localName === 'p');
  const currentParagraph = isParagraphNode ? currentElement : currentElement.parentNode;
  var nextElement = findNextSection(currentParagraph);

  if (nextElement) {
    var isNewParagraph = true;
    return highlightNextSentence(nextElement, isNewParagraph);
  } else {
    console.log("No more paragraph nodes. Returning...");
    return null;
  }
}

// Depth First Search for finding the next valid element (paragraph or span)
function findNextSection(element) {
  if (!element) return null;

  if (!isNestedParagraphTag(element)) {
    // case 1 - <p> to another <p> tag.
    return element.nextSibling
  } else {
    // case 2 - nested text nodes inside <p> tag.
    // go to next sibling or go to parent's next sibling.

    let stack = [element];
    // case 2 - going into <p> with nested tags <span>,<em>, <a>
    while (stack.length > 0) {
      element = stack.pop();

      // Check if this is a text node with non-whitespace content,
      // a <span> tag, an <a> tag, or an <em> tag.
      var isAnyNonWhiteSpaceCharacters = /\S/.test(element.textContent)
      var isTextNode = (element.nodeType === Node.TEXT_NODE && isAnyNonWhiteSpaceCharacters);
      var isParagraphNode = (element.localName === 'p');
      var isSpanNode = (element.localName === 'span');
      var isLinkNode = (element.localName === 'a');
      var isEmNode = (element.localName === 'em');

      if (isParagraphNode || isTextNode || isSpanNode || isLinkNode || isEmNode) {
        return findFirstTextNode(element);
      }

      if (element.nextSibling) {
        // Try next sibling.
        stack.push(element.nextSibling);
      } else {
        // Try parent node.
        return findNextSection(element.parentNode)
      }
    }
  }

  // If we reached here, it means we couldn't find any valid elements.
  return null;
}

// Given a paragraph html text node, selects the next sentence.
// Note this should take nested <p> tag and non-nested <p> tag.
function highlightNextSentence(currentParagraph, isNewParagraphNode) {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentTextSelection = currentRange.toString();

  const allSentences = splitParagraphBySentences(currentParagraph.textContent)
  const allSentencesObjs = []
  var startIndex = 0
  for (let i = 0; i < allSentences.length; i++) {
    var sentence = allSentences[i]
    var endIndex = startIndex + sentence.length
    allSentencesObjs.push(new sentenceObject(startIndex, endIndex, sentence))
    startIndex += sentence.length
  }

  // Get current & next sentence details
  const currSentenceObj = findCorrespondingSentence(allSentencesObjs, currentRange)
  var nextSentence
  if (isNewParagraphNode) {
    // Case - New paragraph, use the first sentence.
    nextSentence = allSentencesObjs[0]
  } else if (currSentenceObj.sentence.length > currentTextSelection.length + MAX_LETTERS_MISSING_SELECTED_SENTENCE) {
    // Case - Only fragment of sentence selected. Select the entire sentence.
    nextSentence = currSentenceObj
  } else {
    // Case - select next sentence 
    nxtSentenceIdx = allSentencesObjs.indexOf(currSentenceObj) + 1
    if (nxtSentenceIdx > allSentencesObjs.length) {
      // TODO - go to next <p> tag
      Console.log("Going to next paragraph still in-development")
    }

    nextSentence = allSentencesObjs[nxtSentenceIdx]
  }

  // create a new range for the next sentence
  const nextRange = document.createRange();
  if (isNestedParagraphTag(currentParagraph)) {
    nextRange.setStart(findFirstTextNode(currentParagraph), nextSentence.startOffset);
    nextRange.setEnd(findFirstTextNode(currentParagraph), nextSentence.endOffset);
  } else {
    // Note: non-nested <p> tags first child is [text] node.
    nextRange.setStart(currentParagraph.firstChild, nextSentence.startOffset);
    nextRange.setEnd(currentParagraph.firstChild, nextSentence.endOffset);
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
}

// Recursively search for the first text node in the given element or return an error
function findFirstTextNode(element) {
  if (!element) {
    console.error("Could not find the first text node:", element);
    return;
  }

  var isAnyNonWhiteSpaceCharacters = /\S/.test(element.textContent)
  var isTextNode = (element.nodeType === Node.TEXT_NODE && isAnyNonWhiteSpaceCharacters);

  if (isTextNode) {
    return element;
  }

  return findFirstTextNode(element.firstChild);
}

function isNestedParagraphTag(element) {
  // checks if there are nested text elements inside paragraph tag
  // Example - <p> <span> ... </span> <em> ... </em> <a> ... </a> </p> 
  if (element.hasChildNodes()) {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      var isSpanNode = (child.localName === 'span');
      var isLinkNode = (child.localName === 'a');
      var isEmNode = (child.localName === 'em');
      if (isSpanNode || isLinkNode || isEmNode) {
        return true
      }
    }
  }
  return false
}

function findCorrespondingSentence(allSentencesObjs, currentRange) {
  const targetStartIndex = currentRange.startOffset
  const targetEndIndex = currentRange.endOffset

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
    // add the sentence to the array and move the start index to the next character
    if (char === '.' || char === '!' || char === '?') {
      end = i;
      sentences.push(paragraph.slice(start, end + 1));
      start = i + 1;
    }
  }

  // If there's a sentence that ends with the last character of the paragraph,
  // add it to the array as well
  if (start < paragraph.length) {
    sentences.push(paragraph.slice(start));
  }

  // Return the array of sentences
  return sentences;
}

// Disable default space scrolling down the screen
document.addEventListener('keydown', function(event) {
  const isTyping = document.activeElement.tagName === 'INPUT' ||
    document.activeElement.tagName === 'TEXTAREA';

  if (event.code === 'Space' && !isTyping) {
    event.preventDefault();
  }
});

// Disable default space scrolling down the screen
document.addEventListener('keyup', function(event) {
  const isTyping = document.activeElement.tagName === 'INPUT' ||
    document.activeElement.tagName === 'TEXTAREA';

  if (event.code === 'Space' && !isTyping) {
    highlightSentence();
  }
});