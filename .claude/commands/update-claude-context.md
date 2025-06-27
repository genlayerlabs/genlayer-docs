# Update Claude Context Command

This command analyzes implementation plans and updates CLAUDE.md with learnings and patterns from completed work.

## Usage
```
/update-claude-context [--force]
```

Options:
- `--force`: Re-analyze all plans, even those already tracked

## Purpose
- Extract patterns, conventions, and decisions from implementation plans
- Update CLAUDE.md with new guidelines discovered during implementation
- Ensure future sessions follow established patterns
- Document critical implementation details and gotchas
- Track analyzed plans to avoid redundant processing

## Instructions
1. Check `.claude/tracked-plans.json` for previously analyzed plans
   - Skip plans that have been analyzed (unless --force flag is used)
   - Track new analyses with timestamp and hash
2. Read untracked plan files in `.claude/plans/` directory
3. Focus on the "Implementation Status" section of completed plans
4. Extract:
   - New architectural patterns discovered
   - Code conventions actually used
   - Testing patterns that worked well
   - Common pitfalls and solutions
   - Dependency injection patterns
   - Interface design decisions
   - Package organization insights
5. Update relevant sections of CLAUDE.md:
   - Add new patterns under appropriate headings
   - Update existing patterns if improvements were found
   - Add new sections if needed for uncovered topics
   - Include concrete examples from actual implementations
6. Update `.claude/tracked-plans.json` with:
   - Plan filename
   - Analysis timestamp
   - File hash (to detect changes)
   - Summary of extracted patterns
7. Ensure updates are:
   - Specific and actionable
   - Include file paths and code examples
   - Explain the "why" not just the "what"
   - Compatible with existing guidelines

## Example Updates to Add
- How sync state is tracked (e.g., using threads.ValueR)
- Health check modularization patterns
- Avoiding circular dependencies with interfaces
- Test organization and naming conventions
- Mock generation and usage patterns
- Error handling conventions
- Context usage patterns
- Logging key-value patterns

## Important Notes
- Only update based on COMPLETED implementations
- Preserve existing content unless it conflicts
- Add examples from actual code, not theoretical
- Keep updates concise and practical
- Group related updates under existing sections when possible

## Tracking Behavior
The command maintains a tracking file at `.claude/tracked-plans.json` to avoid re-analyzing plans:
- Each analyzed plan is recorded with timestamp and content hash
- If a plan has already been analyzed, it will be skipped
- Use `--force` flag to re-analyze all plans regardless of tracking
- If a plan file changes (hash differs), it will be re-analyzed automatically
- Tracking data includes a summary of patterns extracted for reference
