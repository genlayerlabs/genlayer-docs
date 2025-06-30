### Generate Commit Message

Generate a commit message based on the staged changes or amend an existing commit message.

Follow these rules:

**CRITICAL: NEVER ADD ANY AI/CLAUDE REFERENCES OR ATTRIBUTION**
**STRICT COMPLIANCE REQUIRED: DO NOT ADD 🤖 Generated with [Claude Code] OR Co-Authored-By: Claude LINES**
**VIOLATION CHECK: Before executing git commit, verify the message contains NO AI attribution**

1. Run `git diff --cached` to get the staged changes.
1a. If no staged changes found, run `git status` to check for unstaged changes.
1b. If unstaged changes exist, inform the user and suggest:
   - List the modified files
   - Ask if they want to stage all changes (`git add -A`) or specific files
   - If they decline, exit gracefully
1c. After staging (if user agrees), re-run `git diff --cached` to get the changes.
2. If $ARGUMENTS (a commit hash) is provided, understand the commit message and changes of that commit and treat it as related context.
3. If the staged changes are empty but $ARGUMENTS (a commit hash) is provided, assume the intention is to change the commit message of that existing commit (e.g., for a commit amend).
4. Think hard and analyze the changes or the existing commit to understand what was done.
5. Generate a commit message with a clear title and a body.
6. Follow the Conventional Commits specification: https://www.conventionalcommits.org/en/v1.0.0/#specification.
7. Keep the tone informal, like a human developer writing to their team.
8. Do not include any instructions, metadata, or explanations outside the commit message.
9. Do not run commands that can write, such as `git commit` or `git push`.
10. **ABSOLUTELY NO REFERENCES TO AI, CLAUDE, ASSISTANTS, OR ANY AUTOMATED TOOLS**
11. Use chore(*)/feat(*) as the type of the commit.
12. Start the title with the type followed by a colon and a space and then a concise summary of the changes.
13. The title should be 50 characters or less.
14. The title should be capitalized.
15. If `git diff` shows additional unstaged changes beyond what's staged, mention this to the user after generating the commit message.
16. Do not add any additional context or explanations outside the commit message.
17. Do not add messages like "Part of NOD-XXX" or similar ticket references at the end of the commit message body.
18. Before committing, run `task common:precommit` to ensure the code is ready for commit.

## Notes

- When running `task common:precommit` is probably that all the files are staged but remember only to include in the commit what is requested by the user.


Output only the commit message: title followed by a body with one empty line between them.

After generating the commit message, ask the user:
"Would you like to commit with this message? (yes/no)"

If the user responds with "yes", "y", or similar affirmative:
- **MANDATORY VERIFICATION**: Ensure the commit message contains NO AI attribution lines
- Run `git commit -m` with the proposed message (WITHOUT any 🤖 or Co-Authored-By: Claude lines)
- Show the commit result

If the user responds with "no", "n", or similar negative:
- Acknowledge and let them know they can commit manually or provide a different message
