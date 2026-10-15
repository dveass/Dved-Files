# DVEDFILES — Portfolio Website

A responsive, high-performance web portfolio built for motion graphics and video editing showcases.

## Features & Visual Specifications

- **Replaceable Media by Path**:
  - Every project in **MOTION GRAPHICS & VIDEO EDITING** and **PERSONAL WORKS** has direct, easily swappable `src` paths in `index.html`.
  - Starter poster files are placed in `assets/images/` ready for your own renders or screenshots.
- **Interactive Play Button**:
  - Compact glassmorphism circular play button with clean hover response (without neon glare/glow).
  - Clicking the play button (or anywhere on the card) launches an immersive **Cinema Video Player Modal** (`<dialog closedby="any">`) with theater backdrop blur, nodownload security controls, and title display.
- **Media Save Protection**:
  - Right-click context menus, image dragging, native video download buttons, and page-saving shortcuts are blocked to prevent unauthorized saving of portfolio assets.
- **Refined Small Style & Cursor**:
  - Compact typography, tighter grid margins, and refined proportions for a minimalist, editorial look.
  - Seamless drag-to-scroll with custom mini dot cursor (no OS hand cursor while scrolling).
- **Hero Intro Section (Fitted to Screen)**:
  - Exact 100vh / 100dvh viewport fit ensuring no content peeks in from below until scrolled.
  - Centered responsive brand banner photo (`assets/images/dved-logo-original.png`).
  - **Inactivity Auto-Scroll Countdown**: If idle at the top for 5 seconds without scrolling, the prompt switches to an animated countdown (`AUTO SCROLL DOWN [3] > [2] > [1]`) and automatically scrolls into the portfolio. Clicks or manual scrolls immediately cancel the countdown.
  - Amber / golden accent divider line cleanly seated along the bottom edge.
- **Motion Graphics & Video Editing Section (White)**:
  - 3 × Widescreen centered items (`aspect-ratio: 16 / 9`) with metadata.
  - 1 × Vertical mobile video item (`aspect-ratio: 9 / 16`) centered with metadata.
- **Personal Works Section (White)**:
  - 2-column grid featuring square containers (`aspect-ratio: 1 / 1`).
  - 7th item centered at the bottom of the grid.
- **Drag & Drop Instant Testing**:
  - Drag and drop any local `.mp4`, `.webm`, `.png`, `.jpg`, or `.gif` file directly onto any media box in the browser to test your media in real time.

---

## How to Replace Your Images and Videos

### 1. Replacing Images (Thumbnails):
In `index.html`, locate any project slot and replace the `src` attribute:
```html
<div class="media-box aspect-16-9" data-slot="motion-01" data-video="assets/video/takeyourmaskoff.mp4">
  <!-- Change this path to your image file: -->
  <img src="assets/images/my-cool-thumbnail.jpg" alt="Warframe 1999" class="media-thumb" loading="lazy">
  ...
</div>
```
You can also simply overwrite the starter image files located in `assets/images/`:
- `assets/images/motion-01.jpg`
- `assets/images/motion-02.jpg`
- `assets/images/motion-03.jpg`
- `assets/images/motion-04.jpg`
- `assets/images/personal-01.jpg` through `personal-07.jpg`

### 2. Replacing Videos:
On any `.media-box`, update the `data-video` attribute to point to your video file:
```html
<div class="media-box aspect-16-9" data-slot="motion-01" data-video="assets/video/my-reel.mp4">
```
When a visitor clicks the **Play Button**, the Cinema Lightbox Modal will play this video immediately.

---

## Running Locally

Double-click `index.html` or run the included Node.js server:

```bash
node server.mjs
```
Then open `http://localhost:4173` in your browser.
