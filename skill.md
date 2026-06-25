# Skill: Vanilla JS SPA with API Integration

## Role
You are an expert Front-End Developer. Your task is to build a complete, production-ready Single Page Application (SPA) using strictly HTML5, CSS3, and Vanilla JavaScript (no frameworks or libraries like React, Vue, or jQuery). 

## Project Overview
Create a dynamic, responsive SPA that fetches and displays data from a free public API. The application must feature smooth animations, a fully functional navigation menu, a Light/Dark theme toggle, and heavily documented code.

## Tech Stack
- **Markup:** HTML5 (Semantic tags like `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- **Styling:** CSS3 (Custom Properties, Flexbox, CSS Grid, Keyframe Animations, Media Queries).
- **Logic:** Vanilla ECMAScript 6+ (ES Modules, Fetch API, Async/Await, DOM Manipulation).
- **API:** [Random User Generator](https://randomuser.me/api/) (Use this to generate a "Team Members" or "User Directory" section).

## Architecture & Routing
Since this is a Vanilla JS SPA, do **not** use multiple HTML files for routing. Implement a client-side Hash Router (`#/home`, `#/about`, `#/users`).
- Listen to the `window.addEventListener('hashchange', ...)` event.
- Create a router function that hides/shows different `<section>` elements based on the current URL hash, or dynamically injects HTML templates into a main container.

## Detailed Requirements

### 1. HTML5 (`index.html`)
- Include a standard HTML5 boilerplate with correct meta tags (viewport for responsiveness, charset, description).
- Structure:
  - `<nav>`: Logo/Brand, Navigation Links (Home, Users, About), Theme Toggle Button.
  - `<main>`: Container for SPA views (sections to be swapped by the router).
  - `<footer>`: Copyright info, social links.
- Ensure all accessibility best practices are met (ARIA labels, semantic structure).

### 2. CSS3 (`css/styles.css`)
- **CSS Variables:** Define a `:root` block for Light Theme colors and a `[data-theme="dark"]` block for Dark Theme colors (backgrounds, text, card backgrounds, borders).
- **Responsive Design:** Use Mobile-First approach. The navbar should collapse into a "Hamburger" menu on screens smaller than 768px.
- **Animations:** 
  - Page transition animations (fade-in/slide-up) when changing SPA routes.
  - Hover effects on buttons and user cards (scale, shadow transitions).
  - A subtle loading spinner animation while fetching API data.
- **Layout:** Use CSS Grid for the User Cards gallery and Flexbox for the Navbar and Footer.

### 3. JavaScript (`js/app.js`)
- **Theme Toggle:** 
  - Add an event listener to the theme button.
  - Toggle the `data-theme` attribute on the `<html>` element.
  - Save the user's preference in `localStorage` and apply it on page load.
- **Hamburger Menu:**
  - Toggle a `.active` class on the nav links container to show/hide it on mobile.
- **API Integration:**
  - Create an async function `fetchUsers()` that calls `https://randomuser.me/api/?results=8&nat=us`.
  - Handle loading states (show spinner before fetch, hide after).
  - Handle errors gracefully (show a user-friendly error message in the UI if the fetch fails).
- **DOM Rendering:**
  - Generate user cards dynamically using `document.createElement()` or template literals.
  - Include user picture, name, email, and location in the cards.

### 4. Documentation Standards
Every file must be meticulously documented:
- **HTML:** Use comments to separate major sections (`<!-- Navigation -->`, `<!-- Main Content -->`).
- **CSS:** Group related styles and add comments above them (e.g., `/* === Reset & Base Styles === */`, `/* === Dark Theme Variables === */`).
- **JS:** Use JSDoc format for all functions and add inline comments explaining the *why* and *how* of complex logic (especially the hash router and fetch logic).

## Output Constraints
- Provide 3 distinct files: `index.html`, `css/styles.css`, and `js/app.js`.
- Do not use any external CSS frameworks (like Bootstrap or Tailwind).
- Do not use any external JS libraries.
- Ensure the code is clean, DRY (Don't Repeat Yourself), and indented properly.