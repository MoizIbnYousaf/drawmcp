# Excalidraw keyboard integration audit

Audited against the pinned `vendor/excalidraw` submodule at
`e1bb9ff8f8931e783c11d104abb8967ac6605c9a` and the installed
`@excalidraw/excalidraw` package at `0.18.1`.

## Finding

DrawMCP did not override or intercept keyboard events, but the embed relied on
two upstream defaults: `autoFocus = false` and
`handleKeyboardGlobally = false`. A newly opened `/canvas` therefore left
focus on `document.body`. Letter and numeric tool shortcuts started working
only after the user clicked inside the editor.

The integration now enables both official props. The editor receives focus on
mount, and its own document-level handler stays authoritative after the user
interacts with DrawMCP’s header or status chrome.

## Upstream surfaces

- `packages/excalidraw/index.tsx` owns the `autoFocus` and
  `handleKeyboardGlobally` defaults and passes them into the editor.
- `packages/excalidraw/components/App.tsx` gives the editor container
  `tabIndex=0`, focuses it on mount when requested, and selects container- or
  document-level keydown handling from `handleKeyboardGlobally`.
- `packages/excalidraw/actions/shortcuts.ts` is the canonical map for editing,
  file, zoom, view, grouping, history-adjacent, and command shortcuts.
- `packages/excalidraw/components/HelpDialog.tsx` renders the complete native
  shortcut reference opened with `?`.
- Upstream tests in `packages/excalidraw/tests/tool.test.tsx`,
  `shortcuts.test.tsx`, `history.test.tsx`, and `interactivity.test.tsx` cover
  tool switching, editing actions, Undo/Redo, zoom, and interaction guards.

## Why DrawMCP does not copy the shortcuts

A second keydown handler would drift from Excalidraw, double-fire commands, and
bypass its writable-element, dialog, platform, and interaction-mode guards.
DrawMCP only opts into the native global surface. The installed editor remains
the single owner of shortcut behavior and its `?` dialog remains the versioned
reference.

## Integration verification matrix

| Surface | Representative keys | Expected result |
| --- | --- | --- |
| Tool palette | `H`, `V/1`, `R/2`, `D/3`, `O/4`, `A/5`, `L/6`, `P/7`, `T/8`, `E/0` | Matching native toolbar input becomes checked |
| Shortcut reference | `?` | Native Help dialog opens |
| History | `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z` | Native Undo and Redo execute |
| Zoom | `Cmd/Ctrl++`, `Cmd/Ctrl+-`, `Cmd/Ctrl+0`, `Shift+1/2/3` | Canvas viewport changes through Excalidraw |
| Editing | copy, paste, duplicate, group, ungroup, ordering, flip, lock | Excalidraw action manager owns the command |
| Guardrails | active text input, WYSIWYG editor, modal, non-interactive mode | Upstream handler suppresses or scopes the shortcut |

The DrawMCP component test locks the two embed props. Browser QA exercises the
real editor without clicking the canvas first, which specifically catches the
regression that motivated this change.
