# Documentation Management Rules

## Documentation Structure

All project documentation follows a strict hierarchy. Always check and update relevant docs when making changes.

### Primary Documentation Files

1. **README.md** (root)
   - Project overview and quick commands
   - Links to all other documentation
   - Update when: Adding major features or changing project description

2. **DOCS_INDEX.md** (root)
   - Master index of all documentation
   - Reading paths for different use cases
   - Update when: Adding/removing/moving any documentation file

3. **QUICK_START.md** (root)
   - 5-minute developer guide
   - Common tasks and troubleshooting
   - Update when: Changing dev workflow or adding common tasks

4. **ARCHITECTURE.md** (root)
   - Complete project architecture (in Russian)
   - Component structure and data flow
   - Update when: Adding/removing components or changing patterns

5. **ARCHITECTURE_DIAGRAM.md** (root)
   - Visual diagrams of architecture
   - Data flow diagrams
   - Update when: Data flow or component hierarchy changes

### Infrastructure Documentation

1. **docs/SUPABASE.md**
   - Complete Supabase setup guide
   - Database access methods
   - Troubleshooting
   - Update when: Changing database setup or adding infrastructure

### Component-Specific Documentation

1. **public/fonts/README.md**
   - Custom fonts setup guide
   - Expected file formats
   - Update when: Changing font loading mechanism

### AI Agent Rules

1. **.cursor/rules/project-architecture.md**
   - Quick reference for AI agents
   - Critical patterns and anti-patterns
   - Update when: Adding critical rules or patterns

2. **.cursor/rules/documentation.md** (this file)
   - Documentation management rules
   - Update when: Changing documentation structure

3. **\_bmad-output/project-context.md**
   - Detailed implementation rules
   - Tech stack specifics
   - Update when: Changing tech stack or adding critical rules

## Documentation Principles

### 1. Single Source of Truth

- Each piece of information should exist in exactly ONE place
- Other documents should LINK to it, not duplicate it
- If you find duplicate content, consolidate it

### 2. Clear Hierarchy

- README.md → Quick overview + links
- DOCS_INDEX.md → Navigation hub
- Specific docs → Detailed information

### 3. Consistent Locations

- **Root level**: Main docs (README, QUICK_START, ARCHITECTURE)
- **docs/**: Infrastructure and setup guides
- **.cursor/rules/**: AI agent rules
- **\_bmad-output/**: BMad-generated context
- **Component folders**: Component-specific READMEs

### 4. No Orphaned Files

- Every documentation file must be referenced in DOCS_INDEX.md
- If removing a doc, remove all references to it

## When Making Changes

### Before Adding New Documentation

1. Check if information already exists elsewhere
2. If yes, update existing doc instead of creating new one
3. If no, choose appropriate location based on hierarchy above

### After Adding/Modifying Documentation

1. Update DOCS_INDEX.md with new file or changed content
2. Update README.md if it's a major addition
3. Update relevant .cursor/rules/ if it affects AI agents
4. Check for broken links

### Before Removing Documentation

1. Search for all references to the file
2. Update or remove all references
3. Consider if content should be moved elsewhere instead of deleted

## Common Mistakes to Avoid

- ❌ Creating README-{TOPIC}.md files in root (use docs/ folder instead)
- ❌ Duplicating content across multiple files
- ❌ Creating documentation without updating DOCS_INDEX.md
- ❌ Mixing languages in same document (keep Russian or English consistent)
- ❌ Creating orphaned documentation files
- ❌ Forgetting to update .cursor/rules/ when adding critical patterns

## Documentation Checklist

When you create or modify documentation:

- [ ] Is this the right location for this content?
- [ ] Does this information already exist elsewhere?
- [ ] Have I updated DOCS_INDEX.md?
- [ ] Have I updated README.md if needed?
- [ ] Have I updated .cursor/rules/ if it affects AI agents?
- [ ] Are all links working?
- [ ] Is the language consistent?
- [ ] Is this referenced from other relevant docs?

## Quick Reference: Where to Put What

| Content Type         | Location                         | Example              |
| -------------------- | -------------------------------- | -------------------- |
| Project overview     | README.md                        | What is this project |
| Quick start guide    | QUICK_START.md                   | How to get started   |
| Architecture details | ARCHITECTURE.md                  | Component structure  |
| Visual diagrams      | ARCHITECTURE_DIAGRAM.md          | Data flow diagrams   |
| Infrastructure setup | docs/{TOPIC}.md                  | Supabase setup       |
| Component-specific   | {component}/README.md            | Font files guide     |
| AI agent rules       | .cursor/rules/{topic}.md         | Critical patterns    |
| Implementation rules | \_bmad-output/project-context.md | Tech stack rules     |
| Documentation index  | DOCS_INDEX.md                    | Navigation hub       |
