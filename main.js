***********************************
********** Code snippets **********
***********************************

== spacebar highlights sentence ==
function highlightSentences(bodyElement) {
  // Get the inner text of the body element and split it into sentences
  const sentences = bodyElement.innerText.split(/(?<=\.|\?|\!)\s/g);
  
  // Highlight the first sentence
  let currentSentenceIndex = 0;
  sentences[currentSentenceIndex] = `<mark>${sentences[currentSentenceIndex]}</mark>`;
  bodyElement.innerText = sentences.join('');
  
  // Add an event listener for spacebar presses
  document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
      // Remove the highlight from the current sentence
      sentences[currentSentenceIndex] = sentences[currentSentenceIndex].replace(/<\/?mark>/g, '');
      
      // Move to the next sentence
      currentSentenceIndex = (currentSentenceIndex + 1) % sentences.length;
      
      // Highlight the next sentence
      sentences[currentSentenceIndex] = `<mark>${sentences[currentSentenceIndex]}</mark>`;
      bodyElement.innerHTML = sentences.join('');
      
      // Prevent the spacebar from scrolling the page
      event.preventDefault();
    }
  });
}

== spacebar moves selects next sentence ==
function selectNextSentence() {
  const currentSelection = window.getSelection();
  const currentRange = currentSelection.getRangeAt(0);
  const currentParagraph = currentRange.startContainer.parentNode;
  
  // find the current sentence by splitting the paragraph text at the period
  const currentSentence = currentParagraph.innerText
    .substring(0, currentRange.startOffset)
    .split(/(?<=\.|\?|\!)\s/g)
    .pop();
  
  // find the start and end offsets of the next sentence
  const nextSentenceStart = currentRange.startOffset + currentSentence.length + 1;
  const nextSentenceEnd = currentParagraph.textContent.indexOf('.', nextSentenceStart) + 1;
  debugger;
  // create a new range for the next sentence
  const nextRange = document.createRange();
  nextRange.setStart(currentRange.startContainer, nextSentenceStart);
  nextRange.setEnd(currentRange.startContainer, nextSentenceEnd);
  debugger;
  // select the new range
  currentSelection.removeAllRanges();
  currentSelection.addRange(nextRange);
}

document.addEventListener('keydown', function(event) {
  if (event.code === 'Space') {
    event.preventDefault(); 
    selectNextSentence();
  }
});