# Design System Specification: Financial Intelligence Identity

## 1. Overview & Creative North Star

### The Creative North Star: "The Neon Ledger"
This design system is built on the philosophy of **Kinetic Precision**. In a financial context, data shouldn't feel static or buried in a spreadsheet; it should feel alive, high-velocity, and authoritative. We move beyond the "SaaS template" by utilizing a deep, obsidian-like tonal foundation juxtaposed against ultra-vibrant, hyper-functional accents.

The system rejects the "flatness" of modern web design. Instead, it embraces a high-end editorial feel where typography is scaled aggressively and structural boundaries are defined by light and depth rather than rigid strokes. It is professional enough for a boardroom but sleek enough for a high-performance trading desk.

---

## 2. Colors

### Tonal Foundation
The palette is rooted in absolute depth. We use `#0e0e0e` as our "True North" for backgrounds, providing a high-contrast stage for the vibrant neon greens.

- **Primary (`#3fff8b`):** The "Action" catalyst. Used for high-priority CTAs and critical financial status indicators.
- **Surface Tiers:** 
    - `surface`: `#0e0e0e` (The base canvas)
    - `surface_container_low`: `#131313` (Sectional backgrounds)
    - `surface_container`: `#1a1a1a` (Standard cards/containers)
    - `surface_container_highest`: `#262626` (Hover states and active input fields)

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define section containers. Separation of concerns must be achieved through:
1. **Background Shifts:** Placing a `surface_container` card on a `surface` background.
2. **Negative Space:** Using the spacing scale to create mental boundaries.
3. **Subtle Glows:** Using a primary-tinted ambient shadow to define an active area.

### Glass & Gradient Implementation
To achieve a "bespoke" feel, use **Glassmorphism** for floating overlays (e.g., Modals, Tooltips). 
- **Recipe:** `surface_container` at 70% opacity + 12px backdrop-blur.
- **Signature Texture:** Use a subtle linear gradient from `primary` (#3fff8b) to `primary_container` (#13ea79) at a 135° angle for primary buttons to give them a "machined" metallic glow.

---

## 3. Typography

The system utilizes a dual-font strategy to balance editorial authority with technical readability.

### Display & Headlines (Plus Jakarta Sans)
We use **Plus Jakarta Sans** for large data points and page titles. Its wider stance and modern apertures feel "Financial-Tech."
- `display-lg` (3.5rem): Used for primary account balances.
- `headline-md` (1.75rem): Used for section headers like "Contas a pagar."

### Body & Labels (Inter)
**Inter** is our workhorse. Its high x-height ensures that dense data tables remain legible at small sizes.
- `body-md` (0.875rem): Standard table cell content.
- `label-sm` (0.6875rem): Table headers and metadata. Always use Uppercase with 0.05em letter spacing for an architectural feel.

---

## 4. Elevation & Depth

### The Layering Principle
Hierarchy is achieved by "stacking" surface tokens. 
- **Level 0:** `surface` (The dashboard background).
- **Level 1:** `surface_container_low` (Sidebar and main content area).
- **Level 2:** `surface_container` (Information cards and data tables).

### Ambient Shadows & Ghost Borders
- **Shadows:** For high-priority floating elements, use a shadow with `blur: 40px` and `opacity: 8%`. The color must be sampled from the `on_surface` (white) to create a "bloom" effect rather than a dirty grey shadow.
- **Ghost Borders:** If containment is visually necessary for accessibility, use the `outline_variant` (#484847) at **15% opacity**. This creates a "suggestion" of a line that disappears into the background, maintaining a sleek aesthetic.

---

## 5. Components

### High-Contrast Data Tables
- **Header:** No background color. Use `label-sm` in `on_surface_variant` (#adaaaa).
- **Rows:** Forbid dividers. Use a subtle `surface_container_highest` background on hover.
- **Cells:** High-contrast `on_surface` for text. Financial values should use `primary` if positive or `error` (#ff716c) if negative.

### Buttons & Chips
- **Primary Button:** Rounded-xl (0.75rem). Solid `primary` background with `on_primary` text. No border.
- **Filter Chips:** Use `surface_container_highest`. When active, the border becomes `primary` and the text glows slightly using a 2px text-shadow.
- **Action Icons:** Encapsulate in a `full` (circular) container with a backdrop-blur.

### Input Fields
- **State:** Default state uses `surface_container`. 
- **Active State:** The field background shifts to `surface_container_high` with a 1px "Ghost Border" of `primary` at 40% opacity. Forbid the use of standard blue focus rings.

---

## 6. Do’s and Don’ts

### Do
- **Do** use `primary_fixed` (#3fff8b) sparingly as a "laser" to draw the eye to the most important action on the screen.
- **Do** maximize white space between table rows (minimum 16px vertical padding) to allow the "No-Line" rule to work effectively.
- **Do** use `plusJakartaSans` for any large numerical data to emphasize the "Financial Control" aspect.

### Don't
- **Don't** use pure `#000000` for cards; it kills the ability to create depth. Always use the `surface_container` hierarchy.
- **Don't** use standard 1px grey dividers between list items. Use a 12px gap of `surface` color instead.
- **Don't** use highly saturated greens for background washes. Keep the vibrancy reserved for text and small action elements to prevent "visual fatigue" in a dark environment.