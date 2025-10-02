# Task: Consolidate My Files explorer

## Background
The current My Files modal renders two separate lists: individual uploads and managed galleries. Folders are fetched via `/api/galleries` and displayed alongside ownership metadata, while file tiles are sourced from `/api/files` and power selection. Because each list is modeled differently, the UI keeps them isolated.

## Objective
Refactor the My Files experience into a unified explorer where folders and files appear within the same grid/structure. This should allow users to browse and interact with all media assets seamlessly, regardless of whether they are standalone uploads or organized within galleries.

## Requirements
- Harmonize the data layer so the modal consumes a single collection that can represent both files and folders.
- Update API contracts as needed to expose the combined structure (consider augmenting `/api/files` or creating a consolidated endpoint).
- Revise selection and navigation logic to support items that may represent a folder or a file.
- Preserve and clearly indicate ownership/permissions information for galleries within the mixed list.
- Ensure existing bulk actions and upload workflows continue to function after the refactor.

## Implementation Notes
- Audit the `FileManager` component for assumptions that items are always file IDs; introduce type guards or a discriminated union to differentiate item types.
- Evaluate whether gallery metadata needs to be expanded (e.g., thumbnail, item counts) to support display within the shared explorer.
- Plan for incremental loading or pagination to avoid performance regressions when merging datasets.

## Open Questions
- How should navigation into a folder behave inside the modal (drill-down vs. inline grouping)?
- What visual affordances differentiate folders from files in the unified grid?
- Are there permission scenarios where certain galleries should remain hidden even if the user can manage them indirectly?

## Definition of Done
- A prototype modal displays files and galleries together with clear affordances.
- Core user flows (selecting uploads, targeting folders, managing permissions) are regression tested.
- Documentation is updated to describe the new API/data contracts.
