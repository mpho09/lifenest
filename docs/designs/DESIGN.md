---
name: LifeNest Mobile
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#42474c'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#73777d'
  outline-variant: '#c3c7cd'
  surface-tint: '#476176'
  primary: '#062437'
  on-primary: '#ffffff'
  primary-container: '#1f3a4d'
  on-primary-container: '#89a4ba'
  inverse-primary: '#aecae2'
  secondary: '#79591d'
  on-secondary: '#ffffff'
  secondary-container: '#fdd089'
  on-secondary-container: '#78581c'
  tertiary: '#18232c'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d3942'
  on-tertiary-container: '#96a2ad'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cae6fe'
  primary-fixed-dim: '#aecae2'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#2f4a5d'
  secondary-fixed: '#ffdeac'
  secondary-fixed-dim: '#ebc07a'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#5e4105'
  tertiary-fixed: '#d8e4f0'
  tertiary-fixed-dim: '#bcc8d3'
  on-tertiary-fixed: '#111d25'
  on-tertiary-fixed-variant: '#3c4852'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  display-sm:
    fontFamily: Lora
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-lg:
    fontFamily: Lora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Lora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Lora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.2px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.4px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a premium, reassuring, and secure digital sanctuary for sensitive personal affairs, legal documents, financial assets, and emergency contacts. It rejects sterile coldness and aggressive utilitarianism in favor of architectural quietude, tactile clarity, and institutional trust. 

The aesthetic synthesizes modern private wealth management and high-end editorial clarity:
- **Atmosphere:** Serene, grounded, private, and permanent.
- **Visual Cadence:** Crisp white content containers elevated slightly above a warm cream ground, defined by hairline structural rules and restrained warm metallic accents.
- **Target Audience:** Discerning individuals managing complex life affairs, family estates, legacy documents, and critical health directives who demand absolute privacy and effortless legibility under stress.
- **Emotional Response:** Certainty, protection, relief, and enduring calm.

## Colors

The palette establishes an authoritative, warm-hued baseline that communicates legacy, privacy, and permanence:

- **Primary Navy (`#1F3A4D`):** The institutional anchor. Used for critical interactive triggers, top-level headings, active navigation states, and key credential badges.
- **Muted Gold (`#B08A4A`):** The signature accent. Used sparingly for status badges, key highlights, secure vault indicators, subtle progress tracks, and secondary interactive emphasis.
- **Canvas Base (`#FAF8F4`):** A warm off-white surface that mitigates glare and lends an organic, archival feel to the interface canvas.
- **Card & Sheet Surfaces (`#FFFFFF`):** Pure white modules providing crisp separation against the canvas.
- **Structural Borders (`#E8E5DF`):** Hairline borders used to define modular containers and input perimeters without heavy visual friction.
- **Typography Tokens:**
  - Primary Text (`#1E2329`): Deep carbon for headers, labels, and primary data values.
  - Secondary Text (`#5A6670`): Calibrated slate for metadata, captions, and helper annotations.
- **System States:**
  - Success (`#2E7D32`): Verification, valid encryptions, completed estate items.
  - Warning (`#8A5A00`): Expiring documents, pending signatures, unassigned delegates.
  - Error (`#B3261E`): Validation failures, unencrypted warnings, revocations.

## Typography

The typographic hierarchy balances literary authority with functional precision:

- **Editorial Serifs (Lora Semibold):** Anchors display titles, section overviews, and vault milestone banners. The serifs communicate institutional stability and formal validation.
- **Instrumental Sans (Inter):** Handles all transactional components, dense tables, status alerts, form inputs, and sub-labels. Its high x-height and neutral geometry ensure legible, rapid scanning on compact mobile viewports.
- **Handling Constraints:**
  - Never apply `Lora` to buttons, micro-labels, or dynamic metadata values.
  - Numbers representing financial sums or credential dates should strictly use tabular numerals in `Inter` (`font-feature-settings: 'tnum'`).

## Layout & Spacing

Designed around the Android standard baseline of 360dp width and an 8dp atomic rhythm (with a 4dp micro-step):

- **Grid Architecture:** 4-column fluid mobile layout with a fixed outer screen margin of 16px (`1rem`) and standard column gutters of 16px (`1rem`).
- **Vertical Flow:**
  - Screen edge margins: Fixed `16px` left and right.
  - Top app bar spacing: Compact `12px` top/bottom paddings to reserve critical vertical space for encrypted records.
  - Bottom clearance: Persistent `56px` bottom navigation bar backed by safe-area inset margins (yielding an overall interactive footer zone of `72px-80px`).
- **Component Breathing Room:**
  - Form field spacing: `16px` vertical gaps between related inputs; `24px` separating distinct credential groups.
  - List entries: Minimum `56px` row height for high-confidence touch accuracy.

## Elevation & Depth

This system avoids aggressive multi-layer drop shadows. Elevation is communicated primarily through crisp tonal contrast and delicate, tinted ambient shadows:

- **Surface Level 0 (Base Canvas):** `#FAF8F4`. Completely flat.
- **Surface Level 1 (Modular Cards & Panels):** Pure `#FFFFFF` resting on `#FAF8F4`. Framed with a 1px solid border in `#E8E5DF` and a delicate warm ambient shadow: `box-shadow: 0 1px 3px rgba(31, 58, 77, 0.04), 0 4px 12px rgba(31, 58, 77, 0.02)`.
- **Surface Level 2 (Persistent Floating Navigation & App Bars):** Pure `#FFFFFF` surface with a subtle upward separation: `box-shadow: 0 -2px 10px rgba(31, 58, 77, 0.05)` and top border `1px solid #E8E5DF`.
- **Surface Level 3 (Modals, Action Drawers, Passcode Sheets):** `#FFFFFF` surface with `box-shadow: 0 12px 32px rgba(31, 58, 77, 0.12)`, anchored over a `#1E2329` scrim at 48% opacity.

## Shapes

Corner radii establish structural harmony with clear differentiation across element classes:

- **Cards & Enclosures:** Exactly `12px` (`0.75rem`). Soft enough to welcome interaction without sacrificing formal, document-like geometry.
- **Buttons & Action Controls:** Exactly `10px` (`0.625rem`). Balances touch target visual weight with modern Android ergonomic expectations.
- **Input Fields & Text Areas:** Exactly `8px` (`0.5rem`). Keeps forms structured and architecturally sound.
- **Badges & Trust Status Chips:** Fully pill-shaped (`9999px`) to immediately set status metadata apart from interactive inputs and cards.

## Components

### Buttons
- **Primary:** Background `#1F3A4D`, text `#FFFFFF`, radius `10px`, minimum height `48px`, horizontal padding `20px`. Font `label-lg` in `Inter`. Active/Pressed: background `#152734`.
- **Secondary / Vault Action:** Background `transparent`, border `1.5px solid #1F3A4D`, text `#1F3A4D`, radius `10px`, height `48px`.
- **Gold Accent (High-Value Intent):** Background `#B08A4A`, text `#FFFFFF`, radius `10px`, height `48px`. Used exclusively for critical handoffs, trusted contact activation, and vault finalization.
- **Text / Ghost:** Background `transparent`, text `#1F3A4D`, height `48px`, font `label-lg`.

### Text Inputs & Form Controls
- **Height & Radius:** Minimum `48px` height (recommend `52px`), radius `8px`.
- **Coloring:** Background `#FFFFFF`, border `1px solid #E8E5DF`, text `#1E2329`, placeholder `#5A6670`.
- **Focus State:** Border `1.5px solid #1F3A4D` with no outer glow.
- **Error State:** Border `1.5px solid #B3261E`, helper text `#B3261E` with leading alert icon.

### Cards & Document Containers
- **Visuals:** Background `#FFFFFF`, border `1px solid #E8E5DF`, radius `12px`, internal padding `16px`.
- **Document Row Variation:** Includes a left-aligned file-type container (e.g., `#FAF8F4` pill), primary title in `title-sm`, secondary metadata in `body-sm`, and right-aligned security indicator (e.g., muted gold lock glyph).

### Chips & Badges
- **Status Pills:** Fully rounded `9999px`, height `24px`, padding `0 10px`.
  - Encrypted / Verified: Background `#FAF8F4`, border `1px solid #B08A4A`, text `#8A5A00` or `#B08A4A`.
  - Standard Tag: Background `#FAF8F4`, border `1px solid #E8E5DF`, text `#5A6670`.

### Selection Controls (Checkboxes & Radios)
- **Checkbox:** `20px x 20px`, `4px` radius. Inactive: border `1.5px solid #5A6670`. Active: background `#1F3A4D` with `#FFFFFF` checkmark.
- **Radio:** `20px x 20px`, circle. Active: outer ring `#1F3A4D`, inner core `#1F3A4D` (`10px`).

### Lists & Key-Value Directories
- **Rows:** Minimum height `56px`, horizontal padding `16px`. Separated by `#E8E5DF` hairline dividers with `16px` leading inset.
- **Interaction:** Ripple color `rgba(31, 58, 77, 0.08)`.

### Persistent Bottom Navigation
- **Structure:** 5 destinations: Home, Documents, Assets, People, More. Height `56px` + Android system gesture bar inset.
- **Background:** `#FFFFFF` with a top hairline border `#E8E5DF`.
- **Inactive Destination:** Text and icon `#5A6670` (`label-md`).
- **Active Destination:** Icon and text `#1F3A4D` with an optional `4px x 4px` muted gold (`#B08A4A`) dot indicator directly below the label.

### Security / Encryption Banners
- **Vault Status Header:** Surface `#FAF8F4` bounded by `#E8E5DF`, adorned with a `#B08A4A` decorative keyline, carrying end-to-end encryption confirmation text in `label-md`.