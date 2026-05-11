---
name: EduMatch
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-tablet: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system establishes a bridge between academic rigor and human connection. The brand personality is **authoritative yet accessible**, positioning itself as a premium service for serious learners and professional educators. 

The UI follows a **Modern Corporate** style with a focus on high-clarity information architecture. By utilizing a "Light-first" visual system, we prioritize readability and a sense of openness. To differentiate from cold fintech platforms, we infuse the interface with soft gradients and organic warmth through Amber accents. The aesthetic avoids "childish" illustrations, opting instead for crisp iconography and professional imagery that reinforces a high-value marketplace environment. Efficiency is the core driver: the design should feel like a high-performance tool that users can trust with their educational goals.

## Colors

The palette is anchored by **Navy (#0F172A)**, providing a foundation of stability and professional trust. **Teal (#0D9488)** acts as the functional driver for primary actions and success states, symbolizing growth and clarity. **Warm Amber (#F59E0B)** is used sparingly for high-attention accents, notifications, and "Pending" states to draw the eye without creating a sense of alarm.

The status tokens are mapped to specific lifecycle events of the marketplace. Each badge category uses a background alpha of 10-15% of the token color for its container, while the text uses the full-strength hex code to ensure WCAG AA compliance. Surfaces are predominantly White, using subtle Slate-toned neutrals for secondary text and borders to maintain a "warm" rather than "clinical" gray-scale.

## Typography

This design system utilizes **Lexend** for all headings. Its optimized character spacing and geometric clarity provide excellent readability, reinforcing the "Education" theme while remaining modern. **Source Sans 3** is the workhorse for body content, selected for its neutrality and performance in data-heavy views.

Hierarchical distinction is achieved through weight rather than just size. Display styles and Large Headlines use a Semi-Bold (600) weight to establish clear section starts. Labels and Badges use a Bold (600) weight with slight tracking (letter spacing) to ensure they remain legible even at small sizes within card components.

## Layout & Spacing

The layout follows a **12-column fixed grid** for desktop, maxing out at 1280px to prevent excessive line lengths on ultra-wide monitors. For mobile, a single-column fluid model is used with 16px side margins. 

The spacing rhythm is based on a **4px baseline grid**. Components like cards and input groups should use "stack" spacing (16px or 32px) to define relationships between content blocks. Margin and padding within cards should be generous (typically 24px) to avoid a cluttered "utility" feel, ensuring the "clear" and "operationally efficient" brand pillars are met.

## Elevation & Depth

Visual depth is achieved through **ambient, tinted shadows** rather than harsh outlines. Surfaces should appear as "floating" layers above a light-gray background (#F8FAFC).

- **Level 1 (Default Cards):** 0px 4px 20px rgba(15, 23, 42, 0.05). A very soft, low-contrast shadow that subtly lifts the card.
- **Level 2 (Hover/Active):** 0px 10px 25px rgba(15, 23, 42, 0.08). Used when a tutor card or request item is engaged.
- **Level 3 (Modals/Overlays):** 0px 20px 50px rgba(15, 23, 42, 0.12). Used for payment flows and scheduling confirmations.

Soft gradients should be applied to primary buttons and headers (e.g., a linear gradient from Navy to a slightly lighter Navy) to provide a premium, tactile feel without the flatness of a purely minimal system.

## Shapes

The design system employs a **Rounded (Level 2)** shape language. This 0.5rem (8px) base radius provides a friendly, approachable character that softens the professional Navy palette. 

- **Standard Buttons & Inputs:** 8px (0.5rem).
- **Cards & Large Containers:** 16px (1rem).
- **Badges & Tags:** Full Pill (999px) to distinguish status indicators from clickable buttons.

This consistent rounding ensures the UI feels cohesive and modern, avoiding the sharpness of enterprise tools while maintaining more structure than a "playful" consumer app.

## Components

### Buttons
- **Primary:** Navy-to-Teal soft gradient, white text.
- **Secondary:** White background, 1px Teal border, Teal text.
- **Actionable Icons:** Enclosed in a soft-gray circular background for touch-friendly interaction.

### Status Badges
Badges are critical for the marketplace flow. They should use `label-sm` typography.
- **TutorRequest:** Open (Blue), Expired (Slate), Assigned (Violet), Closed (Navy).
- **Application:** Pending (Amber), Confirmed (Teal), Approved (Emerald), Rejected (Red), Matched (Indigo).
- **Class:** Active (Teal), Completed (Navy), Cancelled (Slate).
- **Payment:** Success (Emerald), Failed (Red).

### Cards
Cards are the primary container for Tutor Profiles and Class Requests. They must feature a 1px border (#E2E8F0) and the Level 1 shadow. Header areas within cards should utilize a light Teal-tinted background (5% opacity) to separate metadata from the body content.

### Input Fields
Inputs use a 1px Slate-200 border. On focus, the border transitions to Teal with a 3px soft-glow (outer shadow) in Teal at 10% opacity. Labels are always positioned above the input field using `label-md`.

### Interactive Calendars
Given the marketplace nature, calendars should feature "High-Availability" indicators using Teal dots and "Booked" states using subtle Navy diagonal patterns, ensuring tutors can manage their schedule with zero friction.