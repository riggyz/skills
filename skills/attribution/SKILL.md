---
name: attribution
description: Attribution rules for issues, pull requests, work items, reviews, and comments created or edited by the agent in GitHub, Linear, Azure DevOps, or similar collaboration systems. Use when creating, commenting on, reviewing, or modifying external tracker content.
---

# Attribution Rules

Use the configured attribution identity from `references/attribution-config.md`.

If `references/attribution-config.md` is missing, stop before creating or editing external tracker content and ask the user to run:

```sh
npx tsx scripts/configure-attribution.ts --name "Your Agent Name" --emoji "symbol"
```

## Signoff Format

Always add one attribution line using bold + italic text followed by the configured emoji outside the formatting:

```markdown
***<Action> by <agent name>*** <emoji>
```

Use these actions:

- Creating a new issue, pull request, work item, task, bug, or sub-issue: `Created`
- Posting a comment or review: `Commented`
- Modifying an item not originally created by this agent: `Modified`

Do not add `Modified` attribution when editing an item this agent originally created. The existing `Created` attribution is sufficient.

## Platform Rules

### GitHub

- Applies to issues, pull requests, comments, and PR reviews.
- Place the attribution line at the end of the description/comment/review body, separated by a blank line.
- GitHub uses standard Markdown; use `***Created by <agent name>*** <emoji>` style formatting.

### Linear

- Applies to issues, sub-issues, and comments.
- Use standard Markdown formatting.
- Put the attribution at the end of the issue description or comment body when the field supports body text.

### Azure DevOps

- Applies to work items, tasks, bugs, user stories, and work item comments.
- For Markdown-capable comments, use standard Markdown formatting.
- For HTML work item descriptions, use equivalent HTML formatting: `<b><i>Created by <agent name></i></b> <emoji>`.

## Unknown Systems

For another system that needs attribution, apply the same rule:

- `Created` for new items.
- `Commented` for comments/reviews.
- `Modified` for edits to items not originally created by this agent.
- Use bold + italic text if the system supports rich text; otherwise use plain text: `<Action> by <agent name> <emoji>`.
