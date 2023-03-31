const MAX_LETTERS_MISSING_SELECTED_SENTENCE = 5

function sentenceObject(startOffset, endOffset, sentence) {
  this.startOffset = startOffset
  this.endOffset = endOffset
  this.sentence = sentence
}

function highlightSentence(currentDom) {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentContainer = currentRange.startContainer.parentNode;
  const currentParagraph = isNestedParagraphTag(currentContainer) ? currentContainer.parentNode : currentContainer

  // case 1: initial load - nothing is selected
  const isTextSelected = window.getSelection()
    .type !== "None"
  if (!isTextSelected) {
    return
  }

  // case 2: moving to next paragraph
  if (isEndOfParagraph(currentParagraph)) {
    debugger
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

  if (isNestedParagraphTag(currentParagraph)) {
    // note: current element is nested tag: <span>, <em>, or <a>
    var currentElement = currentRange.startContainer.parentNode;
    const lastChildNode = currentParagraph.childNodes[currentParagraph.childNodes.length - 1]
    const isLastChildNode = currentElement == lastChildNode
    return isLastChildNode
  } else {
    // non-nested paragraph tag
    // check if current selection is the last sentence of paragraph tag text.
    const allSentencesObjs = splitParagraphBySentences(currentParagraph.textContent)

    // Get current & next sentence details
    const currSentenceObj = findCorrespondingSentence(allSentencesObjs, currentRange)
    const isLastSentence = (currSentenceObj === allSentencesObjs[allSentencesObjs.length - 1])
    return isLastSentence
  }
  // default move on to next paragraph. 
  return true
}

function nextParagraph(currentParagraph) {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);

  // case - nested <p> tag move to parent
  var nextParagraph = currentParagraph.nextSibling
  while (nextParagraph) {
    if (isParagraphTag(nextParagraph)) {
      return nextParagraph
    }
    nextParagraph = nextParagraph.nextSibling
  }
  return undefined
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
      // TODO - go to next <p> tag
      Console.log("Going to next paragraph still in-development")
    }
    nextSentenceObj = allSentencesObjs[nxtSentenceIdx]
  }


  // create a new range for the next sentence
  const nextRange = document.createRange();
  if (isNestedParagraphTag(currentParagraph)) {
    // need to find corresponding start & end textNode for nextSentence
    // it could span different nested tags
    nextRange.setStart(findNestedParagraphStartingTextNode(currentParagraph, nextSentenceObj), nextSentenceObj
      .startOffset);
    nextRange.setEnd(findNestedParagraphEndingTextNode(currentParagraph, nextSentenceObj), nextSentenceObj.endOffset);
  } else {
    // Note: non-nested <p> tags first child is [text] node.
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
}

// Find the text node of nested paragraph that corresponds with sentence.
function findNestedParagraphStartingTextNode(nestedParagraph, sentenceObj) {
  // find the nested children tag that contains begining of sentence
  const beginingSentenceOffset = sentenceObj.startOffset

  // make a map of nested tag -> [begining, end] range


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

function isParagraphTag(currentElement) {
  return currentElement.localName === 'p';
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

// similiarly get start/endOffset of each sentence
function splitNestedTagIntoSentences() {
  // return map<nestedTag, startOffset + endOffset of inner text>
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