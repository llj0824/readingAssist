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
    console.log("Going to next paragraph")
    return nextParagraph()
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
  // gets currentSelection, loops till next <p> tag, selects first sentence of that tag
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentTextSelection = currentRange.toString();

  // Keep transversing for next paragraph. Until no more
  var nextElement = currentSelection.baseNode.parentNode.nextSibling
  while (nextElement) {
    var isParagraphNode = nextElement?.localName === 'p'
    if (isParagraphNode) {
      // update current selection to be this node 
      var isNewParagraph = true
      return highlightNextSentence(nextElement, isNewParagraph)
    }
    nextElement = nextElement.nextSibling
  }
  // reaching here means no more paragraph nodes
  console.log("No more paragraph nodes. Returning...")
  return
}

// Given a paragraph html text node, selects the next sentence.
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
  // const nextRangeNode = isNewParagraphNode ? currentParagraph.firstChild : currentRange.startContainer
  nextRange.setStart(currentParagraph.firstChild, nextSentence.startOffset);
  nextRange.setEnd(currentParagraph.firstChild, nextSentence.endOffset);

  // scroll the screen down
  currentParagraph.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  // select the new range
  currentSelection.removeAllRanges();
  currentSelection.addRange(nextRange);
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