# RNS AGM Voting App

An AGM (Annual General Meeting) shareholder voting portal for "RNS". Shareholders log in, view voting topics, cast votes weighted by their share count, and can assign a proxy to vote on their behalf. Admins manage shareholders, voting topics, and proxies, and export CSV results.

This is the developer's first app — favor clear, well-explained changes over terse ones, and call out tradeoffs when they come up.

## Demo differences (this repo is the public demo, not the live site)

This repo (`CptDarkstar/agm-demo`, Firebase project `voting-app-demo-45801`) started as a copy of the live RNS AGM app (`RNS-AGM-1`, project `rns-agm-vote`) and is now maintained **separately**: never add live as a git remote or merge from it, so none of live's history ends up in the demo. When live changes, redo those changes here by hand. Everything below describes the live app as of the October 2026 redesign, except for these demo-only changes:

1. **Admin mode toggle**: `AppHeader.svelte` has a glass "Admin mode (Demo)" switch next to Menu, backed by the `isAdmin` writable in `src/store/store.js` (saved in `sessionStorage`, reset on log out). It replaces the admin custom claim everywhere: the Menu, `AdminVotingTopic.svelte`'s admin view, the `{#if $isAdmin}` gates on `/admin` and `/shareholders`, and `+layout.svelte`'s redirect away from those pages (a reactive check, so switching it off while on one of them also redirects). `AppHeader` has no `isAdmin` prop here. The old `Header.svelte` is gone.
2. **Login hint box** in `Authenticate.svelte`: shows the shared test account (test@test.com / 123456) with a pulsing glass border.
3. **Demo backend** `https://agm-demo-node.onrender.com` instead of `agm-node-cptdarkstar.onrender.com` (`NODE_API` in `src/lib/proxies.js`, plus the hardcoded URL in `Register.svelte`).
4. **SSR guards**: `src/lib/firebase/firebase.js` only initializes Firebase when `browser` is true (so `db`/`auth`/`storage` are `undefined` during SSR), and `store.js` wraps its `onAuthStateChanged` in `if (browser)`. Live doesn't have this. Never use Firebase at a component's top level or in a `$:` statement; do it in `onMount` or an event handler.
5. **Placeholder documents**: `static/agm-docs/` holds 8 generated one-page "Sample ..." PDFs instead of the real RNS AGM documents, and `/download`'s `fileList` lists those. If a sync brings back live's PDFs, delete them again and keep the demo `fileList`.
6. **`.env`** holds the demo Firebase config (`VITE_*` keys for `voting-app-demo-45801`). It's untracked; keep it out of git.

⚠️ **Deploying**: `.firebaserc` defaults to `voting-app-demo-45801`, but deploy with `firebase deploy --project voting-app-demo-45801` anyway. Copying files over from live can bring back `rns-agm-vote` as the default, and deploying from here to that project would overwrite the live site. The Stack and External backend sections below give the live values.

## Stack

- SvelteKit 2 + Svelte 4, Vite 5
- UI: custom dark-teal "glass" markup/CSS on every page. SMUI is now only used for the login and forgot-password forms (`@smui/textfield`, `@smui/button`); the admin dialogs use plain `<input>`/`<select>` styled by `src/lib/styles/glass-dialog.css`
- Firebase client SDK: Auth, Firestore, Storage (`src/lib/firebase/firebase.js`, config from `VITE_*` env vars in `.env`)
- Deployed to Firebase Hosting with a Cloud Functions SSR backend (`firebase.json` → `frameworksBackend`, region `us-east1`). Firebase project id: `rns-agm-vote` (`.firebaserc`).
- Dev: `npm run dev` (Vite). Build: `npm run build`.

## Routes (`src/routes`)

- `/` — login (`src/components/Authenticate.svelte`); redirects to `/dashboard` if already signed in
- `/dashboard` — shows "Hi {displayName}" + share count and renders `AdminVotingTopic.svelte` (a custom glass-card list, no SMUI Accordion). Admins see every topic as an expandable row with a live on/off toggle (each topic independent), Yes/No/Abstain bars with share totals, Export results, and Clear votes (behind a confirmation dialog). Non-admins see only enabled topics with For/Against/Abstain buttons, replaced by percentage results once they've voted (directly or via proxy)
- `/admin` — admin-only "Resolutions" page, glass redesign. `EditTopic.svelte` is the topics card: expandable rows with inline edit (type, title, description), "{n} voted" from `Votes/{id}`, Add topic and Delete topic dialogs, and Export all (CSV). `AdminDropdown.svelte` is the Admins side panel, which can only *grant* admin (see External backend)
- `/shareholders` — admin-only, glass redesign. `EditUser.svelte` is the whole page body: stats (holders, total shares, proxies given), search + "Has proxy" filter + sort, a split list/detail view, and glass Edit/Delete dialogs. `Register.svelte` is the "Add shareholder" dialog; `AddProxy.svelte` is the giver-first proxy editor (pick the holder, set Free/Yes/No/Abstain per resolution). Proxy read/write helpers live in `src/lib/proxies.js`, shared dialog CSS in `src/lib/styles/glass-dialog.css`, topic sorting in `src/lib/topics.js`
- `/download` — public document pack download (glass redesign): zips the 8 PDFs hardcoded in the page's `fileList` and served from `static/agm-docs/` (file names on disk must match the list exactly — a stray double space caused a 404 once, and adding/renaming PDFs without updating `fileList` left the live page showing the old list). The page does not read the folder, so any change in `static/agm-docs/` needs a matching `fileList` edit, requires name + surname, logs the requester's name to Firestore `downloaded`
- `/forgot_password` — Firebase password reset email, glass redesign that mirrors login. Unknown emails get the same "Check your inbox" screen (`auth/user-not-found` is treated as success) so the page never reveals who's registered. Footer has RNS's help line (011 894 6920, `tel:+27118946920`)

Login and forgot-password share `src/components/AuthShell.svelte` (background, logo badge, frosted card with a `<slot />`) and `src/lib/styles/glass-field.css` (the restyled SMUI `.glassField` text field, including the autofill floating-label fix). The white submit-button styles stay in each page's own `<style>`: SMUI's `.mdc-button--raised:not(:disabled)` background rule is specific enough that only the Svelte-scoped `form :global(.mdc-button)` reliably beats it.

`src/components/AppHeader.svelte` is the shared header (frosted logo badge, admin-only "Menu" dropdown with Dashboard → `/dashboard`, Shareholders → `/shareholders` and Resolutions → `/admin`, with the current page highlighted via `$page.url.pathname`, white Log out button) used by `/dashboard`, `/admin`, `/shareholders`. The dropdown is a plain Svelte `menuOpen` boolean (closes on outside click / Escape via `<svelte:window>`) — it no longer uses `MDCMenu`/`document.querySelector`, so there's no SSR guard needed. The Menu button is teal-tinted glass (not the design's white glass); it was chosen while `/admin` and `/shareholders` still had light backgrounds and works on both. Props: `isAdmin` (gates the Menu — reactive on dashboard since the claim resolves after mount, hardcoded `true` on admin/shareholders since those routes are already admin-gated) and `logoLink` (whether the logo links to `/dashboard` — false only on dashboard itself).

## Auth model

Firebase Auth. Admin vs. shareholder is a **custom claim** (`idTokenResult.claims.admin`) checked ad hoc in each component's `onMount`/`onAuthStateChanged` — there is no central route guard. `src/routes/+layout.svelte` is the only place with routing logic: it bounces signed-out users to `/` (except `/` and `/download`) and redirects non-admins away from `/admin` and `/shareholders`.

## External backend (not in this repo)

Privileged operations the client SDK shouldn't do directly go through a separate Node service at `https://agm-node-cptdarkstar.onrender.com`:
- `POST /setCustomClaims/:uid` — grant admin. There's no endpoint to list admins or remove the claim, and the browser can't read other users' claims, so the app can only grant admin. The new admin gets access the next time they sign in (when their login token refreshes).
- `POST /createUser`, `PUT /updateUser/:id`, `DELETE /deleteUser/:id`
- `POST /enableUser/:id`, `POST /disableUser/:id` — used when a shareholder is proxied out, so they can't also vote directly

This is presumably where `firebase-admin` runs — it was removed from this repo's `package.json` (2026-09-08 cleanup) since nothing here imports it; there's no server-side code in this repo for it to run in.

## Firestore shape (inferred from code — not documented elsewhere)

- `users/{uid}`: `email`, `displayName`, `agency`, `shares`, `votes[]` (`{topicId, vote, shares, ...}`), `proxies[]` (`{proxyID, principalId, principalName, proxyUserId, proxyUserName, proxyUserShares, topicId, voteInstruction}`), `proxyTo`

**Proxy model** (what `castVote` reads; documented in `src/lib/proxies.js`): entries live on the **holder** (the person who votes). `proxyUserId` is the **giver**. `topicId: "None"` + `voteInstruction: "None"` = free vote on every topic; `topicId: "<topic>"` + `yes`/`no`/`abstain` = forced vote on that topic (lowercase). `proxyUserShares` is a *copy* of the giver's shares, and that copy is what's counted. The giver is disabled via `/disableUser` and gets `proxyTo` = holder's **name** (display only). The proxy editor always writes the None/None base entry plus one entry per instructed topic.
- `Topics/{"Topic N"}`: `title`, `description`, `enabled`, `type` (`"Ordinary"` | `"Special"`, optional — missing means Ordinary). New IDs come from `nextTopicId()` in `src/lib/topics.js` (highest number + 1)
- `Votes/{topicId}`: cached aggregate results (percentages/shares), written client-side whenever the shared `users` listener in `AdminVotingTopic.svelte` fires
- `downloaded/{auto}`: `name`, `timestamp` from the `/download` page

## Cleanup pass (2026-09-08)

Removed: `src/store/user.js`, `src/App.svelte`, `src/theme/test.js` (all dead/unused), the dead trailing block in `src/store/store.js`, the dead `register()` function in `Register.svelte`, and a pile of unused imports/vars across `EditUser.svelte`, `AddProxy.svelte`, `Authenticate.svelte`, `AdminVotingTopic.svelte`, `admin/+page.svelte` (found while touching these files for the header extraction below — verified each via grep before removing, not just from the original review). Dropped `firebase-admin` and `jspdf` from `package.json` (neither was imported anywhere; `npm install` afterward removed 117 now-unreachable transitive packages). Untracked `.env` and `.firebase/` from git (`git rm --cached`), added `.firebase/` to `.gitignore`. Standardized all Firebase imports to the `$lib/firebase/firebase` alias.

Extracted the header duplicated across `dashboard`/`admin`/`shareholders` into `src/components/AppHeader.svelte` (see Routes above) — along with it, dropped `handleShareHoldersAction`/`handleVotingAction`, which were genuinely dead: attached via `on:SMUI:action` to plain `<li>` elements that never dispatch that event, so navigation always happened purely through the wrapping `<a href>`.

**Fixed a real listener-leak bug** in `AdminVotingTopic.svelte`: previously, every Topics-collection change opened a *new* realtime listener on the entire `users` collection *per topic* (via the old `countVotesPercentage`), and none were ever unsubscribed — a `let unsubscribe = onDestroy` at module scope was shadowed by a local `const unsubscribe` inside `onMount`, so the cleanup function was calling Svelte's `onDestroy` itself instead of any real unsubscribe handle. Listeners piled up without bound. Now there's exactly one `users`-collection listener (`setupUsersListener`), shared across all topics, that recomputes every topic's totals in one pass (`recomputeAllVotePercentages` → `computeAndSaveVotePercentage`) whenever it fires; `unsubAuth`/`unsubTopics`/`unsubUsers` are tracked explicitly and all unsubscribed on component cleanup. The `votePercentages` store shape and `Votes/{topicId}` doc shape are unchanged, so CSV export (here and in `admin/+page.svelte`) didn't need changes.

One regression caught during verification: the first version of `AppHeader.svelte` wired up the MDC menu via a `$: if (isAdmin) { ... }` reactive statement calling `document.querySelector` — unlike the original inline `on:action={fn()}` template expression (which Svelte's SSR compiler skips evaluating), a `$:` reactive statement runs during SSR too, so this crashed the dev server with `document is not defined`. Fixed by guarding with SvelteKit's `browser` import from `$app/environment`. (Superseded 2026-10-01: the MDC menu was replaced with a plain Svelte dropdown, see below.) General lesson still applies: never touch `document`/`window` in a `$:` statement or at component top level.

## Dashboard redesign (2026-10-01)

Login, `/download`, `/dashboard`, and (since the redesigns below) `/shareholders` and `/admin` share a dark-teal "glass" look (from the "Login page styling" Claude Design project): `src/public/background.png` under a teal gradient, frosted cards, Roboto (the design's Geist font isn't loaded). `/forgot_password` followed last, so every page is now redesigned.

Behavior fixes made while rewriting `AdminVotingTopic.svelte` (Firestore logic — listeners, tallying, `castVote` proxy rules, CSV — otherwise unchanged):
- **Toggle/index mismatch**: the old `topicStates[i]` array was filled by the number in the doc ID (`"Topic 3"` → 2) but read by list position `i`. Firestore orders IDs as strings (`Topic 1, Topic 10, Topic 2…`), so with 10+ topics a switch could show or flip the wrong topic. Now reads `accordionItems[topicId].enabled` and lists topics via a numerically sorted `sortedTopicIds`.
- **Clear votes** now needs confirmation, and `clearVotesForTopic` awaits its writes (`Promise.all`) and skips users with nothing to remove.
- **Double-vote guard**: `castingTopicId` disables a topic's buttons while `castVote` runs.
- `hasVoted` no longer throws for a user doc without a `votes` field.
- The local `votePercentages` store now also holds `yesShares`/`noShares`/`abstainShares`/`totalSharesVoted` (admins see share totals; shareholders still only see percentages).

## Shareholders redesign (2026-10-01)

`/shareholders` moved to the glass look and a giver-first proxy flow. Firestore format and Node backend calls are unchanged. Fixes made along the way:
- **Delete cleanup**: deleting a holder now re-enables their givers and clears `proxyTo` (before, givers stayed disabled forever, pointing at a deleted user); deleting a giver removes their entries from the holder.
- **Remove proxy** removes *all* of a giver's entries before re-enabling them. The old per-entry delete re-enabled the giver even when other entries remained.
- **Share copies stay in step**: editing a giver's shares/name also updates `proxyUserShares`/`proxyUserName` on the holder's entries, so votes don't count a stale share number.
- **Listener leaks**: the `users` listener is now unsubscribed, and the per-click proxy listener is gone (proxy data is derived from the users snapshot).
- **Add shareholder** shows an inline error when `/createUser` fails (was console-only).
- Removed `src/store/editUserStore.js` (only `EditUser.svelte` used it, and its state was never read).

## Resolutions redesign (2026-10-01)

`/admin` moved to the glass look (topics card + Admins side panel). Fixes made along the way:
- **New topics could overwrite existing ones**: the next ID came from `orderBy("__name__", "desc")`, which sorts as text, so with 10+ topics it picked an ID that already existed (e.g. "Topic 10" again) and `setDoc` replaced it. Now `nextTopicId()` uses the highest *number*.
- **Edits could blank or mix up topics**: every panel shared one empty title/description pair, so Save wrote whatever was in them to the topic. Now each topic has its own draft filled with its current text, and Save only works when something changed and the title isn't empty. Saving never touches `enabled`.
- **Delete topic does a full cleanup**: it removes the topic's votes from every user and its per-topic proxy entries (the None/None free-vote entries stay), then deletes `Topics/{id}`, then `Votes/{id}`. Topic first, because an open dashboard re-saves `Votes/{id}` for every topic it knows about.
- **Export all** now joins Topics + Votes in topic order with quoted fields (`agm-topics-results.csv`: Topic ID, #, Type, Title, Description, share counts, percentages). This is a different layout from the old `all_votes.csv`.
- `EditTopic.svelte`'s listener leak is fixed (Topics and Votes listeners are both unsubscribed).

## Known follow-ups (not fixed in this pass)

- When a holder's name is edited, their givers' `proxyTo` string keeps the old name. Cosmetic only (the UI works out holder names from the entries), but worth syncing if `proxyTo` is ever shown elsewhere.
- Unused packages: only `@smui/textfield`, `@smui/button` and `smui-theme` are still imported. `@material/menu`, `@smui-extra/accordion`, `@smui/data-table`, `@smui/dialog`, `@smui/form-field`, `@smui/linear-progress`, `@smui/menu`, `@smui/menu-surface`, `@smui/select` and `@smui/switch` are candidates for removal. Rebuild `static/smui.css` (`npm run smui-theme`) and recheck login/forgot-password afterwards, since the theme compile may include styles from installed SMUI packages.
- Vote aggregation is still computed client-side (whichever browser has `AdminVotingTopic.svelte` open does the tallying and writes `Votes/{topicId}`), rather than via a server-side/Cloud Function aggregation. The leak is fixed, but a client still needs to be connected for `Votes/{topicId}` to update. This also means the "{n} voted" counts on `/admin` can lag until someone has the dashboard open.
- `AdminVotingTopic.svelte`'s `fetchProxies()` queries a `Proxies` collection into a `proxies` variable that nothing reads (proxy voting actually uses `users/{uid}.proxies[]` inside `castVote`) — likely dead.
