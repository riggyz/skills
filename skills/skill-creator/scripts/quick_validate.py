#!/usr/bin/env python3
"""
Quick validation script for skills - minimal version
"""

import sys
import os
import re
import yaml
import argparse
import json
import math
from pathlib import Path

DESCRIPTION_CHAR_LIMIT = 1024
RECOMMENDED_SKILL_LINES = 500
RECOMMENDED_SKILL_TOKENS = 5000

def estimate_tokens(text):
    """Estimate token count without requiring a model-specific tokenizer.

    This intentionally reports an estimate: exact counts vary by model and
    tokenizer. The chars/4 heuristic is a common conservative approximation for
    English-heavy prompt text and is good enough for budget warnings.
    """
    return math.ceil(len(text) / 4)

def budget_report(skill_md, content, frontmatter, body):
    """Return static size metrics for the skill."""
    description = str(frontmatter.get('description', '')).strip()
    body_lines = body.count('\n') + (1 if body else 0)
    skill_lines = content.count('\n') + 1
    body_tokens = estimate_tokens(body)
    total_tokens = estimate_tokens(content)

    warnings = []
    if len(description) > DESCRIPTION_CHAR_LIMIT:
        warnings.append(
            f"description is {len(description)} chars; limit is {DESCRIPTION_CHAR_LIMIT}"
        )
    if body_lines > RECOMMENDED_SKILL_LINES:
        warnings.append(
            f"SKILL.md body is {body_lines} lines; recommended maximum is {RECOMMENDED_SKILL_LINES}"
        )
    if body_tokens > RECOMMENDED_SKILL_TOKENS:
        warnings.append(
            f"SKILL.md body is ~{body_tokens} tokens; recommended maximum is ~{RECOMMENDED_SKILL_TOKENS}"
        )

    return {
        'path': str(skill_md),
        'description_chars': len(description),
        'description_estimated_tokens': estimate_tokens(description),
        'skill_lines': skill_lines,
        'body_lines': body_lines,
        'skill_estimated_tokens': total_tokens,
        'body_estimated_tokens': body_tokens,
        'warnings': warnings,
    }

def validate_skill(skill_path):
    """Basic validation of a skill"""
    skill_path = Path(skill_path).resolve()

    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"

    # Read and validate frontmatter
    content = skill_md.read_text()
    if not content.startswith('---'):
        return False, "No YAML frontmatter found"

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---\n?', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    frontmatter_text = match.group(1)
    body = content[match.end():]

    # Parse YAML frontmatter
    try:
        frontmatter = yaml.safe_load(frontmatter_text)
        if not isinstance(frontmatter, dict):
            return False, "Frontmatter must be a YAML dictionary"
    except yaml.YAMLError as e:
        return False, f"Invalid YAML in frontmatter: {e}"

    # Define allowed properties
    ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}

    # Check for unexpected properties (excluding nested keys under metadata)
    unexpected_keys = set(frontmatter.keys()) - ALLOWED_PROPERTIES
    if unexpected_keys:
        return False, (
            f"Unexpected key(s) in SKILL.md frontmatter: {', '.join(sorted(unexpected_keys))}. "
            f"Allowed properties are: {', '.join(sorted(ALLOWED_PROPERTIES))}"
        )

    # Check required fields
    if 'name' not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if 'description' not in frontmatter:
        return False, "Missing 'description' in frontmatter"

    # Extract name for validation
    name = frontmatter.get('name', '')
    if not isinstance(name, str):
        return False, f"Name must be a string, got {type(name).__name__}"
    name = name.strip()
    if not name:
        return False, "Name must not be empty"
    # Check naming convention (kebab-case: lowercase with hyphens)
    if not re.match(r'^[a-z0-9-]+$', name):
        return False, f"Name '{name}' should be kebab-case (lowercase letters, digits, and hyphens only)"
    if name.startswith('-') or name.endswith('-') or '--' in name:
        return False, f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens"
    # Check name length (max 64 characters per spec)
    if len(name) > 64:
        return False, f"Name is too long ({len(name)} characters). Maximum is 64 characters."
    if name != skill_path.name:
        return False, f"Name '{name}' must match parent directory '{skill_path.name}'"

    # Extract and validate description
    description = frontmatter.get('description', '')
    if not isinstance(description, str):
        return False, f"Description must be a string, got {type(description).__name__}"
    description = description.strip()
    if not description:
        return False, "Description must not be empty"
    # Check for angle brackets
    if '<' in description or '>' in description:
        return False, "Description cannot contain angle brackets (< or >)"
    # Check description length (max 1024 characters per spec)
    if len(description) > DESCRIPTION_CHAR_LIMIT:
        return False, f"Description is too long ({len(description)} characters). Maximum is {DESCRIPTION_CHAR_LIMIT} characters."

    # Validate compatibility field if present (optional)
    compatibility = frontmatter.get('compatibility', '')
    if compatibility:
        if not isinstance(compatibility, str):
            return False, f"Compatibility must be a string, got {type(compatibility).__name__}"
        if len(compatibility) > 500:
            return False, f"Compatibility is too long ({len(compatibility)} characters). Maximum is 500 characters."

    return True, "Skill is valid!", budget_report(skill_md, content, frontmatter, body)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate an Agent Skill and report static size budgets.")
    parser.add_argument("skill_directory", help="Path to the skill directory")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args()

    result = validate_skill(args.skill_directory)
    valid = result[0]
    message = result[1]

    if args.json:
        payload = {'valid': valid, 'message': message}
        if valid and len(result) > 2:
            payload['budget'] = result[2]
        print(json.dumps(payload, indent=2))
        sys.exit(0 if valid else 1)

    print(message)
    if valid and len(result) > 2:
        report = result[2]
        print("\nSize budget:")
        print(f"  Description: {report['description_chars']} chars, ~{report['description_estimated_tokens']} tokens")
        print(f"  SKILL.md: {report['skill_lines']} lines, ~{report['skill_estimated_tokens']} tokens")
        print(f"  Body: {report['body_lines']} lines, ~{report['body_estimated_tokens']} tokens")
        if report['warnings']:
            print("\nWarnings:")
            for warning in report['warnings']:
                print(f"  - {warning}")
    sys.exit(0 if valid else 1)
