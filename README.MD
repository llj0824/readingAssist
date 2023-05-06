# Chrome Extension for Seamless Reading using Visual Pointer Cue.

Are you tired of scrolling through long digital documents or books and losing track of where you are? Do you ever find yourself re-reading the same sentence multiple times because you lost your spot?

We have a solution for you. We developed a **feature that selects and highlights the current sentence being read** as a visual cue for readers. This feature enhances the reading experience by providing clear cues on the sentence you are currently reading, helping you to maintain focus and engagement with the content.

## Empirical Studies on Impact of Visual Cues on Reading
 
1. Huestegge et al. (2009): In second-grade children with low reading fluency levels, the use of a finger significantly reduced word skipping rates by 42% and regression rates (re-reading words) by 61%. This study provides strong evidence that using a visual pointer can improve both reading speed and comprehension. 

2. Ben-Yehudah & Ahissar (2004): Showed that using an external aid like a moving window or finger-reading could improve reading fluency for struggling readers such as adult dyslexics. Participants showed an increase in reading speed of 25% when using a moving window technique compared to when they read without any external aid.

3. Schotter et al. (2014): Found that using an external device like a pen stabilizes gaze position during reading and reduces backward movements called regressions—a frequent cause of inefficiency when reading. They found that using an external device like a pen could reduce the number of regressions (backward eye movements) during reading by approximately 10%. 

4. Rayner et al.(2010): After six sessions of training with gaze-contingent display change technique, participants reduced their number of saccadic regressions from about 4 regressions per sentence to about 2 regressions per sentence on average, leading to increased reading efficiency.

5. Begeny, J. C., Krouse, H. E., Ross, S. G., & Mitchell, R. C. (2009): Students who participated in the HELPS program showed an average increase of 38.5 words correct per minute (WCPM) compared to students who did not participate, who only improved by an average of 13.3 WCPM over a 12-week period.

Using a pointer helps control the pace at which you read, making it easier to avoid subvocalization and supporting chunking as you focus on groups of words rather than individual words. By using a pointer, you provide your brain with a clear target for each fixation, effectively improving your reading speed and concentration. While these studies offer empirical evidence of improvements in reading speed and comprehension, it's important to note that individual results may vary depending on factors such as age, baseline skill level, learning disabilities, and consistency in practicing these techniques. Additionally, there is no one-size-fits-all solution; different strategies may be more effective for different people based on their unique circumstances and needs.


References:
1) Huestegge L., Radach R., & Corbic D., & Huestegge S.M.. (2009). Oculomotor and linguistic determinants of reading development: A longitudinal study. Vision Research. https://www.sciencedirect.com/science/article/pii/S0042698909004301
2) Ben-Yehudah G., & Ahissar M. (2004). Sequential spatial frequency discrimination is consistently impaired among adult dyslexics. Vision Res. https://pubmed.ncbi.nlm.nih.gov/15031099/
3) Schotter E.R., Tran R., & Rayner K. (2014). Don't believe what you read (only once): Comprehension is supported by regressions during reading. Psychological Science. https://library.ucsd.edu/dc/object/bb4916286v
4) Rayner K., Schotter E.R., Masson M.E.J., Potter M.C., & Treiman R. (2010). So Much to Read, So Little Time: How Do We Read, and Can Speed Reading Help? Psychological Science in the Public Interest. https://journals.sagepub.com/doi/full/10.1177/1529100615623267
5) Begeny, J. C., Krouse, H. E., Ross, S. G., & Mitchell, R. C. (2009). Increasing elementary-aged students' reading fluency with small-group interventions: A comparison of repeated reading, listening passage preview, and continuous reading strategies. Journal of Behavioral Education. https://link.springer.com/article/10.1007/s10864-009-9090-9

## Video Demo

To see our feature in action and better understand its benefits, watch our video demonstration. This demo showcases how our sentence selection and highlighting feature functions and how it can significantly improve your reading focus.

By clicking on the image above or following this link, you can access our video demo: 

https://www.loom.com/share/b17f9d891f3b408d8ff52fb7a2f81a45

## Usage

Our feature is easy to use and seamlessly integrates with existing web applications. To select a sentence in an article, simply highlight a word or phrase, press **space bar**, and our feature will determine the current sentence based on cursor position and surrounding text. The chosen sentence will be highlighted in real-time as you scroll through the document.

## Installing Reading Assist Chrome Extension

This section explains how to install the Reading Assist extension. 

### Option 1: Install via Chrome Extension Store [Recommended]
1. Install via Chrome Extension Store - [link](https://chrome.google.com/webstore/detail/reading-assist/mdpcpdnelomalncmjbdcnledmmfepkco).

### Option 2: Github load unpacked extension

1. Visit [github repo](https://github.com/llj0824/readingAssist).
2. Click the green "Code" button.
3. In the dropdown menu, choose "Download ZIP".
4. Extract the contents of the downloaded ZIP file to a folder on your computer.
5. Open Google Chrome and go to `chrome://extensions/`.
6. Enable "Developer mode" using the toggle at the top-right corner of the page.
7. Click "Load unpacked" and select the folder containing the extracted files from Step 1.
8. The Reading Assist extension should now be installed and appear in the list of extensions.

## Uninstalling/Disabling Reading Assist Chrome Extension

To uninstall visit `chrome://extensions/`, find the Reading Assist extension, and either click "Remove" to uninstall or toggle off the switch to disable it temporarily.

## Upcoming Functionality
- Shift + Space bar -> goes backwards.
- Option to highlight by paragraph or sentence.
- Allow users to customize highlight color.

## Upcoming Support
- Add literature on visual pointer effect on reading comprehension and speed. 
- Support reading PDFs | read.amazon.com
- Reading lists `<ol>`/`<ul>` and table `<td>`/`<tr>`?

## Upcoming UI Changes
- Change automatic scrolling of screen - it can be disorienting right now
