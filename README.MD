# Introducing a Product for Seamless Reading using Visual Pointer Cue.

Are you tired of scrolling through long digital documents or books and losing track of where you are? Do you ever find yourself re-reading the same sentence multiple times because you lost your spot?

We have a solution for you. We developed a **feature that selects and highlights the current sentence being read** as a visual cue for readers. This feature enhances the reading experience by providing clear cues on the sentence you are currently reading, helping you to maintain focus and engagement with the content.

## Video Demo


To see our feature in action and better understand its benefits, watch our video demonstration. This demo showcases how our sentence selection and highlighting feature functions and how it can significantly improve your reading focus.

By clicking on the image above or following this link, you can access our [video demo.](https://www.loom.com/share/81dff89c31a3483396274790a4988d42)

## Usage

Our feature is easy to use and seamlessly integrates with existing web applications. To select a sentence in an article, simply highlight a word or phrase, press **space bar**, and our feature will determine the current sentence based on cursor position and surrounding text. The chosen sentence will be highlighted in real-time as you scroll through the document.

## Importing the Reading Assist Extension via "Load Unpacked"

This section explains how to import and test the Reading Assist extension from [https://github.com/llj0824/readingAssist](https://github.com/llj0824/readingAssist) in your browser using the "Load unpacked" option. We are pending Chrome Extension Store approval.

### Step 1: Download the Code

1. Visit [https://github.com/llj0824/readingAssist](https://github.com/llj0824/readingAssist).
2. Click the green "Code" button.
3. In the dropdown menu, choose "Download ZIP".
4. Extract the contents of the downloaded ZIP file to a folder on your computer.

### Step 2: Load the Extension in Chrome

1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" using the toggle at the top-right corner of the page.
3. Click "Load unpacked" and select the folder containing the extracted files from Step 1.
4. The Reading Assist extension should now be installed and appear in the list of extensions.

After completing these steps, you'll see the Reading Assist extension icon in the toolbar. You can click the icon to access its popup and interact with it while browsing websites.

To uninstall or disable the extension, visit `chrome://extensions/`, find the Reading Assist extension, and either click "Remove" to uninstall or toggle off the switch to disable it temporarily.

## Improved Accessibility

Our feature also improves accessibility for users with visual or learning disabilities by providing a clear and intuitive user interface. It is perfect for students, professionals, or anyone who wants to improve their digital reading experience.

## Technology and Testing

Our team used **JavaScript** and **CSS** to create a custom user interface and leveraged existing open-source libraries like `DOM Range` and `Selection` to handle text selection and highlight specific elements in the text. We have extensively tested and refined this feature to ensure that it provides optimal functionality and an enjoyable user experience.

---

We are excited to introduce our new feature that selects and highlights sentences as visual cues for digital reading. **Try it now** and see how it can improve your reading experience.


## Upcoming Functionality
- Shift + Space bar -> goes backwards.
- Option to highlight by paragraph or sentence.
- Allow users to change highlight color.

## Upcoming Support
- Support reading PDFs | read.amazon.com
- Reading lists `<ol>`/`<ul>` and table `<td>`/`<tr>`?
- Add literature on visual pointer effect on reading comprehension and speed. 
