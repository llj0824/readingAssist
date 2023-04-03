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

function highlightSentence(currentDom) {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentContainer = currentRange.startContainer.parentNode;
  const currentParagraph = isNestedParagraphTag(currentContainer) ? currentContainer.parentNode : currentContainer

  // case 1: initial load - nothing is selected
  debugger;
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

  if (isNestedParagraphTag(currentParagraph)) {
    // case 1: current element is nested tag: <span>, <em>, or <a>
    var currentElement = currentRange.endContainer.parentNode;
    const lastChildNode = currentParagraph.childNodes[currentParagraph.childNodes.length - 1]
    const isLastChildNode = currentElement == lastChildNode
    // end is the last nested tag/child node.
    return isLastChildNode
  } else {
    // case 2: non-nested paragraph tag
    // check if current selection is the last sentence of paragraph tag text.
    const allSentencesObjs = splitParagraphBySentences(currentParagraph.textContent)

    // Get current & next sentence details
    const currSentenceObj = findCorrespondingSentence(allSentencesObjs, currentRange)
    const isLastSentence = (currSentenceObj === allSentencesObjs[allSentencesObjs.length - 1])
    return isLastSentence
  }
  // default case: move on to next paragraph. 
  return true
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
    const {
      startingTextNode,
      endingTextNode
    } = findNestedParagraphStartEndNodes(currentParagraph, nextSentenceObj)

    // Note: first child of html elements are Text Node. Range expected Text Nodes.
    nextRange.setStart(startingTextNode.node.firstChild, startingTextNode.startOffset);
    nextRange.setEnd(endingTextNode.node.firstChild, endingTextNode.endOffset);
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
  // make a map of nested tag -> [begining, end] index offset
  const mapOfHtmlNodeToStartEndCharacterIndex = new Map();
  const allText = nestedParagraph.innerText;

  var startingIndex = 0;
  var endingIndex = 0;
  for (let i = 0; i < nestedParagraph.childNodes.length; i++) {
    var child = nestedParagraph.childNodes[i];
    var childText = child.innerText
    var startingIndexInParagraph = allText.indexOf(childText)
    if (startingIndexInParagraph == -1) {
      console.log(`Could not find nested element text inside paragraph ${nestedParagraph}`);
      continue
    }
    startingIndex = startingIndexInParagraph
    endingIndex = startingIndex + childText.length
    mapOfHtmlNodeToStartEndCharacterIndex.set(child, {
      startIndex: startingIndex,
      endIndex: endingIndex
    })
  }
  return mapOfHtmlNodeToStartEndCharacterIndex
}

function isNestedParagraphTag(element) {
  // check if it is child of nested paragraph
  var isSpanNode = (element.localName === 'span');
  var isLinkNode = (element.localName === 'a');
  var isEmNode = (element.localName === 'em');
  if (isSpanNode || isLinkNode || isEmNode) {
    return true
  }

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
    // add the sentence to the array and move the start index to the next character
    var isEndOfParagraph = (i == paragraph.length - 1)
    if (char === '.' || char === '!' || char === '?' || isEndOfParagraph) {
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