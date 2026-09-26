# Smart Resort 360 Design Audit

## Current State

- **Colors:** The intended ivory, forest, sage, and brass tokens already exist in `frontend/src/index.css` and `frontend/tailwind.config.js`, but most rendered pages still use the default Tailwind slate, sky, indigo, emerald, purple, and orange utilities. The result is a dark, high-contrast AI/SaaS theme rather than a calm hospitality product.
- **Spacing:** Shared utility classes define reasonable spacing, but pages use ad hoc `p-*`, `gap-*`, and `mb-*` values directly. Header, KPI, and table sections therefore do not share a dependable rhythm.
- **Cards and surfaces:** Nearly every major section is a dark rounded card with a shadow. Nested dark panels and translucent backgrounds reduce hierarchy and make operational data feel decorative instead of scannable.
- **Typography:** Inter is serviceable, but headings and KPI values are often oversized and labels frequently use monospace. This creates a technical dashboard tone and weakens the distinction between decision-critical values and supporting metadata.
- **Component patterns:** Navigation, buttons, badges, forms, and tables have centralized class names, but the page components mostly bypass them with raw legacy utilities. Recommendation cards also use glowing gradients, saturated status colors, and a closed-loop AI treatment that is visually louder than the decision itself.

## Design-System Direction

Keep the existing routes, content, API interactions, and role-specific layouts. Reconcile the visual layer around warm ivory backgrounds, white surfaces, forest navigation and actions, sage secondary accents, brass for premium emphasis, restrained semantic statuses, 10-14px corners, thin borders, and light shadows. Use the shared shell and utility tokens as the source of truth so every role dashboard remains related without becoming identical.