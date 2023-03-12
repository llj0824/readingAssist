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

  // Track the begining and end of each sentence in paragraph.
  const currentParagraph = currentRange.startContainer.parentNode;
  const allSentences = currentParagraph.textContent.split(/(?<=\.|\?|\!)\s/g)
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
  if (currSentenceObj.sentence.length + MAX_LETTERS_MISSING_SELECTED_SENTENCE > currentRange.toString().trim()) {
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

document.addEventListener('keydown', function(event) {
  if (event.code === 'Space') {
    event.preventDefault();
    highlightSentence();
  }
});