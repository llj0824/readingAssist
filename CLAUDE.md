# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: DOM Manipulation Warning

**DO NOT use `range.extractContents()`, `range.surroundContents()`, or any DOM-modifying operations in the highlighting logic!**

This extension relies on consistent text node structure for navigation between sentences. When you modify the DOM by wrapping text in spans or extracting content, it breaks the sentence navigation causing it to cycle between the same sentences instead of progressing through the text.

### Safe highlighting approach:
- Use CSS classes on existing elements only
- Never create new wrapper elements (no createElement('span'))
- Never extract or move text nodes
- The DOM structure must remain unchanged after highlighting

### This regression has happened multiple times:
- When trying to wrap sentences in spans for "cleaner" highlighting
- When trying to create precise highlighting by extracting content
- When trying to handle multi-element sentences with surroundContents

**Always test navigation after ANY highlighting changes!** Press space multiple times and ensure it moves through different paragraphs correctly.

## Project Overview

Reading Assist is a Chrome extension that enhances digital reading by providing visual pointer cues. It highlights the current sentence being read and allows navigation through text using the space bar.

## Architecture

### Core Files
- **main.js**: Contains all sentence detection, highlighting, and navigation logic (450 lines)
- **content.js**: Minimal message handler for popup communication
- **popup.js/popup.html**: Extension toggle interface
- **manifest.json**: Chrome extension v3 configuration

### Key Implementation Details

The extension works by:
1. Injecting content scripts into all web pages
2. Detecting text selection and space bar presses
3. Parsing paragraphs into sentences using punctuation-based splitting
4. Applying CSS styling to highlight current sentence (WITHOUT modifying DOM)
5. Managing navigation between sentences and paragraphs

## Development Guidelines

### No Build Process
This is a pure JavaScript Chrome extension with no build tools, package manager, or dependencies. All code runs directly in the browser.

### Chrome Extension Development
- Test changes by loading unpacked extension in Chrome
- Use Developer mode in chrome://extensions/
- Reload extension after code changes
- Check console logs in both the webpage and extension popup for debugging

### Code Patterns
- All DOM manipulation happens in main.js
- State management uses Chrome storage API
- Communication between popup and content scripts uses Chrome messaging
- Sentence detection relies on regex patterns for punctuation
- **Highlighting MUST NOT modify DOM structure**

### Testing Approach
Manual testing on various websites with different DOM structures and text layouts. Focus on:
- Nested paragraph tags
- Lists and complex HTML structures  
- Edge cases like empty paragraphs or special characters
- Performance on long documents
- **Navigation continuity**: Ensure space bar moves through paragraphs sequentially

## Current Limitations
- No support for PDFs or Kindle
- Space bar navigation only goes forward
- Highlighting style is fixed (subtle blue underline)
- May conflict with websites that use space bar for custom functionality