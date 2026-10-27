# Multi_Tools --- Product Requirements Document (PRD)

**Document status:** MVP specification\
**Product name:** Multi_Tools\
**Product type:** Responsive, browser-first multi-utility platform\
**Primary principle:** Local-first processing, transparent network
behavior, no unnecessary backend\
**Routes:** `/normalUser` and `/developers`\
**Default route:** `/` redirects to `/normalUser`\
**Out of scope for this PRD:** Advertising and monetization

------------------------------------------------------------------------

## 1. Product vision

Multi_Tools brings everyday utilities and developer utilities into one
fast, searchable website. Most tools should process input directly in
the visitor's browser. Users should not need an account to use core
tools, and the interface must clearly label tools that need an external
network request.

The product has two intentional experiences:

1.  **Normal User:** everyday calculations, files, images, QR codes,
    passwords, text, time and network checks.
2.  **Developers:** data formatting, encoding, debugging, regex, hashes,
    JWT inspection, UUIDs, Markdown, and web/SEO utilities.

There is no separate `/home` page. The default `/` route redirects to
`/normalUser`.

## 2. Goals

-   Combine the capabilities visible in the supplied UtilityToolbox,
    DevSafe Tools and SEO-tool screenshots.
-   Provide useful, working tools rather than non-functional placeholder
    cards.
-   Process files and text locally whenever technically possible.
-   Keep results in browser `localStorage` with a maximum cache age of
    24 hours, subject to the security exceptions in Section 8.
-   Make tool discovery easy with search, categories, related tools and
    stable URLs.
-   Support desktop, tablet and mobile layouts.
-   Explain limitations and network use honestly.

## 3. Non-goals for MVP

-   No account system, cloud sync or user profile.
-   No admin dashboard.
-   No `/home` route.
-   No ad placement or advertising implementation in this PRD.
-   No claim that a decoded JWT is valid unless its signature has
    actually been verified with the correct key and algorithm.
-   No claim that a local SEO preview is the exact snippet Google will
    display.
-   No backend crawler or proxy unless a future feature explicitly
    requires it and the privacy implications are documented.

## 4. Information architecture and routing

  -----------------------------------------------------------------------------------
  Route                               Purpose                 Requirements
  ----------------------------------- ----------------------- -----------------------
  `/`                                 Entry route             Immediately redirect to
                                                              `/normalUser`; do not
                                                              render a separate home
                                                              page

  `/normalUser`                      Everyday utility        Default user experience
                                      catalogue               

  `/normalUser/calculator`           Calculator modes        Stable deep link

  `/normalUser/image-tools`          Image utility workspace Stable deep link

  `/normalUser/pdf-tools`            PDF utility workspace   Stable deep link

  `/normalUser/qr-generator`         QR generator            Stable deep link

  `/normalUser/password-generator`   Password and passphrase Stable deep link
                                      generator               

  `/normalUser/word-counter`         Text statistics         Stable deep link

  `/normalUser/speed-test`           Network speed           Clearly disclose
                                      measurement             network use

  `/normalUser/ip-checker`           Public IP and optional  Clearly disclose
                                      IP lookup               external lookup

  `/normalUser/timezone`             World clocks and        Stable deep link
                                      meeting overlap         

  `/developers`                       Developer tools         Separate
                                      catalogue               visual/workflow
                                                              experience

  `/developers/json-formatter`        JSON formatter          Stable deep link

  `/developers/base64`                Base64 encoder/decoder  Stable deep link

  `/developers/url-encoder`           URL encoder/decoder     Stable deep link

  `/developers/regex-tester`          Regex tester            Stable deep link

  `/developers/hash-calculator`       Hash calculator         Stable deep link

  `/developers/jwt-decoder`           JWT payload decoder     Warn that decoding is
                                                              not signature
                                                              verification

  `/developers/uuid-generator`        UUID generator          Stable deep link

  `/developers/markdown-preview`      Markdown editor/preview Render safely; prevent
                                                              script injection

  `/developers/seo-tools`             SEO utilities           Explain local-preview
                                                              limitations

  `/developers/robots-sitemap`        robots.txt and sitemap  Basic local validation
                                      tools                   
  -----------------------------------------------------------------------------------

Unknown routes should show a useful 404 page with links to
`/normalUser` and `/developers`. Hosting must be configured for SPA
deep links so direct visits and refreshes work.

## 5. Shared application shell

Both experiences share a design system and core navigation, but each
should feel tailored to its audience.

### Shared features

-   Brand: **Multi_Tools**
-   Search tools by name, description or keyword.
-   Category chips and tool cards with name, short explanation and icon.
-   Dark theme by default; light theme toggle.
-   Responsive navigation and mobile menu.
-   Breadcrumbs and "Back to tools".
-   Copy, download/export, clear and reset actions where applicable.
-   Related tools links.
-   Clear loading, empty, success and error states.
-   About, Privacy and Contact pages.
-   Per-tool explanation: what it does, best use cases, limitations and
    whether data leaves the browser.
-   Accessible labels, keyboard navigation, visible focus states and
    sufficient contrast.

### normalUser visual direction

-   Approachable, simple, low-friction interface.
-   Categories: Math, Files, Images, Generate, Text, Network, Time and
    Security.
-   File workflows should emphasize drag-and-drop, previews, options and
    downloadable results.

### Developer visual direction

-   Dense but readable developer workspace.
-   Categories: Formatters, Encoders/Converters, Security, Generators,
    Web/SEO and Text.
-   Monospace editor areas, clear validation errors, copy buttons,
    format/minify controls and sample input.
-   Privacy indicator should say "Local" only when the tool truly
    performs processing locally.

## 6. normalUser feature requirements

### 6.1 Calculator

Modes: - Standard arithmetic with parentheses, decimals, percentages and
keyboard input. - Unit conversion. - Currency conversion/reference
rates, with timestamp and provider disclosure when live rates are
used. - Loan/EMI and basic finance calculations. - BMI calculator. -
Date difference and date calculator. - Calculation history with
clear-history action.

Acceptance criteria: - Invalid expressions show readable errors, not a
broken page. - Division by zero and non-finite results are handled. -
Currency results show when the rate was last updated and require network
access if rates are fetched live.

### 6.2 Image tools

Required capabilities: - Multi-file selection and drag-and-drop. - Image
preview, filename, dimensions and file size. - Compress with quality
control. - Resize by custom width/height and common presets. - Crop
using free crop and aspect ratios 1:1, 4:3, 3:4 and 16:9. - Convert
supported formats: JPEG, PNG and WebP; offer SVG/ICO only where safely
supported. - Batch processing and individual downloads. - Before/after
file size and dimensions. - Clear queue and reset controls.(Jpg , Png , Heic any format ) to Webp , Webp to any format of image 

Technical notes: - Use browser Canvas/ImageBitmap APIs where
supported. - SVG input must be handled defensively; do not inject
uploaded SVG markup into the DOM. - HEIC support depends on
browser/library capability and must not be promised without a working
decoder. - Files must not be uploaded to an application server for
normal local processing.

### 6.3 PDF tools

Modes: - Merge PDFs. - Split PDF by page range or one-page-per-file. -
Convert images to PDF. - Convert PDF pages to images where browser
libraries support it. - Organize/reorder and rotate pages. - Export the
resulting PDF. - Display file/page count, progress, and readable failure
messages. Image to PDF , PDF to image , Word to PDF , PDf to word , Image to Word , PDF to PPT , PPT to Pdf , These kind multiple tools 

Technical notes: - Process locally with a suitable PDF library and
PDF.js where needed. - Warn users that very large PDFs may consume
substantial memory. - Do not claim PDF-to-Word conversion unless
text/layout reconstruction has been implemented and tested. - Preserve
source files and never silently overwrite user files.

### 6.4 QR generator

Content modes: - URL/plain text. - Wi-Fi credentials. - Contact/vCard. -
Email. - SMS.

Options: - PNG and SVG export where supported. - Download size
presets. - Live preview, error correction settings if supported. - Copy
generated content and reset.

Acceptance criteria: - Preview updates when content/options change. -
Empty or invalid inputs are explained. - Wi-Fi passwords and contact
details remain in the browser.

### 6.5 Password and passphrase generator

-   Generate passwords with configurable length and character groups.
-   Generate passphrases with word count and separator options.
-   Batch generation.
-   Copy individual result and regenerate.
-   Use `crypto.getRandomValues`, not `Math.random`, for
    security-sensitive randomness.
-   Optional password exposure check must use a privacy-preserving
    method and explicitly disclose the external request before use.
-   Do not send full passwords to an external service.
-   Never cache generated passwords by default.

### 6.6 Word counter

-   Live word and character counts.
-   Character count with and without spaces.
-   Sentence and paragraph counts.
-   Approximate reading/speaking time.
-   Optional English readability metrics.
-   Copy and clear actions.

### 6.7 Speed test

-   Measure download and upload throughput where supported, plus
    latency.
-   Display test endpoint, approximate data consumed, timestamp and
    limitations speed test download and upload must load for 1 minutes then show the results user must see the how much mb conusmed (data must be strem type).
-   Re-test action.
-   Local history table, comparison and CSV export.
-   Clear history.
-   Do not run a test automatically without user action.
-   Clearly label this as a network test, not a purely local tool.

### 6.8 IP checker

-   Check the visitor's public IP.
-   Optional manual IP lookup for country, organization/ISP and service
    information if a supported external provider is used.
-   Results table and history.
-   Copy selected result, delete selected entries and clear history.
-   Explain that IP geolocation is approximate and not precise physical
    location.
-   Disclose external requests and provider limitations.

### 6.9 Time and timezone

-   Show current time for selected cities/time zones.
-   Add/remove cities.
-   Display UTC offsets and local date.
-   12-hour/24-hour display.
-   Meeting overlap finder based on configurable working hours.
-   12-hour/24-hour view.
-   Explain that daylight-saving changes are handled by the browser
    timezone database.

## 7. Developer feature requirements

### 7.1 JSON formatter

-   Format/beautify, minify and validate JSON.
-   Clear line/column or parser error when available.
-   Copy/download output.
-   Optional sort keys only if implemented as an explicit operation.
-   Invalid JSON must not destroy the input.

### 7.2 Base64 encoder/decoder

-   UTF-8 safe text encode and decode.
-   Handle malformed input with readable errors.
-   Distinguish text mode from file/binary mode if binary support is
    added.
-   Do not use deprecated or lossy Unicode conversion patterns.

### 7.3 URL encoder/decoder

-   Encode/decode URI components and full URLs with distinct actions.
-   Parse URL components: protocol, host, path, query and fragment.
-   Malformed percent encoding should show a useful error.

### 7.4 Regex tester

-   Pattern, flags and sample text inputs.
-   Highlight matches and list match indexes/captures where practical.
-   Handle invalid patterns safely.
-   Protect UI responsiveness from catastrophic regex patterns with
    input limits, timeouts via a worker where appropriate, and/or
    warnings. Do not claim a hard timeout if the implementation cannot
    enforce one.

### 7.5 Hash calculator

-   SHA-1, SHA-256, SHA-384 and SHA-512 using Web Crypto where
    available Base 64.
-   Text input initially; file hashing can be added with progress and
    chunk-aware implementation where supported.
-   Copy/download digest.
-   Explain that hashes are not encryption.
-   MD5 should only be added as a clearly labelled legacy checksum
    option if a vetted implementation is included.

### 7.6 JWT payload decoder

-   Split token segments and decode header and payload locally.
-   Show decoded JSON, timestamps/claims when present and parse errors.
-   Prominent notice: decoding does not validate signature, issuer,
    audience or expiry.
-   Do not transmit token to any API.
-   Do not cache token input or decoded claims by default.

### 7.7 UUID generator

-   Generate UUID v4 using a cryptographically secure browser API.
-   Generate in batches with configurable count and line-separated
    output.
-   Copy and download.
-   Avoid claiming UUIDs are guaranteed globally unique.

### 7.8 Markdown preview

-   Editor and preview.
-   Support headings, lists, emphasis, links, code and fenced code
    blocks.
-   Sanitize rendered output and block script/event-handler injection.
-   Export Markdown; HTML export only if safely sanitized.

### 7.9 SEO tools

-   Google search snippet preview with URL, site name, title and
    description.
-   Character counters (suggested guidance: title around 60 characters
    and description around 160, clearly labelled as guidance rather than
    hard Google limits).
-   Favicon checker where URL access is allowed.
-   Canonical tag and meta tag helpers.
-   robots.txt editor/basic validator.
-   XML sitemap structure validation.
-   On-page metadata analysis only when the page's HTML can be obtained.
    Browser CORS may prevent direct fetching; do not present a simulated
    preview as a live crawl.
-   Clearly distinguish "preview", "local validation" and "live website
    analysis".

## 8. LocalStorage cache and privacy requirements

### Required result cache

-   Cache tool results in browser `localStorage` with a maximum age of
    **24 hours**.
-   Every cache entry must contain a version, key/tool identifier,
    result data and `createdAt` timestamp.
-   On read, delete entries older than 24 hours.
-   Expired entries must never be returned to the UI.
-   Use namespaced keys such as
    `multi_tools:cache:v1:<tool-id>:<input-hash>`.
-   Avoid storing duplicate large outputs; set a documented size limit
    and fall back to session-only results if localStorage quota is
    exceeded.
-   Provide a "Clear cached results" control and clear relevant entries
    on user request.
-   Do not cache errors as successful results.
-   Cache only deterministic results where appropriate. For live network
    data, show the fetch timestamp and use a shorter freshness policy if
    needed; never represent stale network data as current.

### Security exceptions

The general 24-hour result cache must not store: - Raw passwords,
passphrases or password-manager secrets. - JWT input tokens or decoded
claims. - Wi-Fi passwords, private contact data or other
high-sensitivity inputs. - Uploaded file contents or large binary
blobs. - Authentication tokens, API keys or other credentials.

For those tools, keep data in memory only unless the user explicitly
chooses an informed "remember this result" action. Generated password
output is not persisted by default. This exception prevents a
convenience feature from turning browser storage into a secret dump.

### Privacy and local-first rules

-   Local tools must not upload user input or files.
-   No analytics or third-party scripts may read tool input, output,
    clipboard contents or file data.
-   Network tools must identify the external service, what data is sent
    and why.
-   External requests must be initiated only when needed and, where
    practical, after a user action.
-   Use HTTPS in production.
-   Never claim "100% local" for a tool that makes network requests.
-   Clear temporary object URLs and revoke them after downloads when
    appropriate.

## 9. Suggested technical architecture

-   **Frontend:** React + TypeScript + Vite.
-   **Routing:** React Router or an equivalent client-side router with
    explicit routes.
-   **Styling:** Tailwind CSS or a consistent CSS design system.
-   **Icons:** Lucide.
-   **Image processing:** Canvas API and ImageBitmap; vetted library for
    cropping/format support.
-   **PDF:** pdf-lib for creation/merge/manipulation and PDF.js for
    rendering where required.
-   **Hashing:** Web Crypto API.
-   **QR:** a maintained QR-code library.
-   **Persistence:** localStorage for small, expiring result caches and
    preferences; IndexedDB only for suitable non-sensitive larger local
    data.
-   **Deployment:** Cloudflare Pages or Vercel with SPA
    fallback/rewrites.
-   **Backend:** none for the local core. Introduce a narrowly scoped
    backend only for features that cannot work safely/reliably in a
    browser, with explicit privacy documentation.

Use a shared tool registry containing tool ID, title, category,
description, route, local/network classification, supported
inputs/outputs and cache policy. Use shared UI components, but keep tool
logic modular and independently testable.

## 10. UX and visual direction

-   Dark theme as default, with light theme toggle.
-   Purple/blue accent color, subtle borders and clear contrast.
-   Desktop developer workspace can use a sidebar; mobile uses a
    collapsible drawer.
-   Tool cards should show title, concise description, category and
    clear click affordance.
-   Individual tool pages should include:
    1.  Breadcrumb/back link.
    2.  Tool name and description.
    3.  "Before you use this tool" explanation.
    4.  Best-for and limitations notes.
    5.  Inputs/options.
    6.  Result preview and copy/download actions.
    7.  About, key features and related tools.
    8.  Local/network disclosure.
-   Avoid fake social share buttons, non-working links and decorative
    controls without behavior.

## 11. Acceptance criteria

The MVP is ready for release only when:

1.  `/` redirects to `/normalUser`; no separate `/home` page exists.
2.  `/normalUser` and `/developers` are distinct, working catalogues.
3.  Direct navigation and refresh work on every defined deep link.
4.  Search and category filters work across each catalogue.
5.  Each advertised tool has a tested, functional primary action.
6.  Every tool has loading, empty, invalid-input and success states as
    relevant.
7.  Result cache entries expire after 24 hours and expired results are
    never shown.
8.  Sensitive inputs and outputs listed in Section 8 are not persisted
    by default.
9.  Local tools can be used with the network disconnected after the
    application and required assets have loaded, subject to browser
    API/library constraints.
10. Network-dependent tools clearly identify their external request and
    failure modes.
11. No file/text/token is sent to the application server by local tool
    code.
12. The app works on current Chrome, Firefox, Edge and Safari where
    required APIs are supported.
13. Keyboard access, visible focus, labels and mobile layouts are
    tested.
14. No buttons, exports, categories, navigation links or "share"
    controls are inert.
15. Privacy claims match the actual production build and its third-party
    dependencies.

## 12. Test plan

-   Unit tests for calculators, encoders/decoders, JSON validation,
    date/time calculations and cache expiry.
-   File tests with small/large images, transparent PNGs, JPEG/WebP,
    malformed files and multi-PDF merge.
-   Security tests for SVG handling, Markdown/XSS payloads, regex
    performance, malformed JWTs and invalid URL/Base64 input.
-   Cache tests at just under, exactly at and just over 24 hours.
-   Privacy tests using browser DevTools/network inspection to verify
    that local inputs/files/tokens are not transmitted.
-   Responsive tests at phone, tablet and desktop widths.
-   Route tests for direct URL, refresh, unknown route and `/` redirect.
-   Network failure tests for IP, speed and live currency features.

## 13. Delivery phases

### Phase 1 --- Foundation

-   App shell, design system, routing, search, categories, theme toggle
    and cache manager.
-   Implement JSON, Base64, URL, word counter, UUID and standard
    calculator.

### Phase 2 --- File and generation tools

-   Image processing, QR generation, password/passphrase generator and
    PDF merge/split/organize.
-   Add progress, file validation and export flows.

### Phase 3 --- Developer and SEO tools

-   Regex tester, hashes, JWT decoder, Markdown preview, metadata
    preview and robots/sitemap validation.

### Phase 4 --- Network and time tools

-   Speed test, public IP lookup, timezone clocks and meeting-overlap
    finder.
-   Add provider disclosures, timestamped history and CSV export where
    specified.

### Phase 5 --- Hardening and release

-   Automated tests, privacy audit, accessibility pass, performance
    testing, mobile checks, route fallback and deployment.
-   Add About, Privacy and Contact pages.
-   Advertising is deliberately outside this PRD and should be
    considered only after the website itself is built and tested.

## 14. Reference review notes

The supplied screenshots were used to derive the interface and visible
feature scope: - UtilityToolbox: calculator modes (Standard, Unit,
Currency, Finance, BMI, Date), image tools, PDF modes (Merge, Split,
Convert, Organize), QR content types and exports, password/passphrase
batch controls, speed-test results/history, IP lookup/history, timezone
clocks and meeting overlap. - DevSafe Tools: JSON formatter, Markdown
preview, Base64, URL encoding, JWT payload decoder and UUID
generation. - SEO screenshot: Google search preview, title/meta length
counters, related tools, sitemap, favicon and canonical-tag checks.

A live page inspection of `https://utilitytoolbox.pages.dev/` also
describes calculator, PDF, image, word-counter, password-generator and
QR features. Exact implementation details not visible in the screenshots
or accessible page text are specified as product requirements, not
claims that the reference currently implements them.
