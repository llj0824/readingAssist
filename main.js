const MAX_LETTERS_MISSING_SELECTED_SENTENCE = 5

function sentenceObject(startOffset, endOffset, sentence) {
  this.startOffset = startOffset
  this.endOffset = endOffset
  this.sentence = sentence
}

function highlightSentence(currentDom) {
  // case 1: initial load - nothing is selected
  // case 2: end of search
  const isTextSelected = window.getSelection().type !== "None"
  if (currentDom == undefined && !isTextSelected) {
    return
  }

  // case 3: moving to next paragraph

  // case 4 - main loop 
  toggleCurrentAndNextSentence()
}

// spacebar moves selects next sentence 
function toggleCurrentAndNextSentence() {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentTextSelection = currentRange.toString()

  // Track the begining and end of each sentence in paragraph.
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
  var nextSentence
  // Case - Only fragment of sentence selected. Select the entire sentence.
  if (currSentenceObj.sentence.length > currentTextSelection.length + MAX_LETTERS_MISSING_SELECTED_SENTENCE) {
    nextSentence = currSentenceObj
  } else { // Case - select next sentence 
    nxtSentenceIdx = allSentencesObjs.indexOf(currSentenceObj) + 1
    if (nxtSentenceIdx > allSentencesObjs.length) {
      // TODO - go to next <p> tag
      Console.log("Going to next paragraph still in-development")
    }

    nextSentence = allSentencesObjs[nxtSentenceIdx]
  }

  // create a new range for the next sentence
  const nextRange = document.createRange();
  nextRange.setStart(currentRange.startContainer, nextSentence.startOffset);
  nextRange.setEnd(currentRange.startContainer, nextSentence.endOffset);

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
  if (event.code === 'Space') {
    event.preventDefault();
    highlightSentence();
  }
});