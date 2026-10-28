---
name: subagent-models
description: Choose a model by work class before dispatching a subagent or planning delegated work. Use whenever selecting subagent models or deciding whether to escalate a delegated task. This is a routing policy, not a benchmark ranking or permission to delegate.
---

# Subagent Models

Choose the smallest capable work class to stretch usage without sacrificing judgment. Classify the task by its ambiguity and hardest required reasoning, not its length, output format, or perceived importance.

## Work Classes

| Class | Models | Typical work |
| --- | --- | --- |
| Mechanical / well-specified coding | Haiku / Luna | Clear edits, scaffolding, repetitive changes, straightforward tests, implementing a settled design |
| Bounded reasoning | Sonnet / Luna / Terra | Debugging within a known area, interpreting existing patterns, implementation with a few local tradeoffs |
| Thoughtful / ambiguous work | Opus / Sol | Architecture and ADRs, subtle bugs, authentication/security design, competing constraints without an obvious answer |
| Exceptional difficulty | Fable / Astra | Hard unresolved problems that the thoughtful class demonstrably struggles with; almost never the starting point |

These are task buckets, not claims that the listed models perform identically. Luna intentionally spans the first two classes. There is no required preference order among models within a class.

## Dispatch

1. Respect the user's requested model and the host's delegation/model-selection restrictions. This skill does not authorize spawning subagents or overriding those restrictions.
2. Identify the hardest judgment the delegated task actually requires. "Just code" means low ambiguity: a tiny concurrency fix may need thoughtful reasoning, while a large mechanical migration may not.
3. Select an available model from the smallest suitable class. Treat the names above as labels, not literal API IDs; resolve them using the host's model discovery tools. Never invent a provider, model ID, or variant. If the label is ambiguous, ask rather than guess.
4. Give the subagent a bounded objective, relevant context, constraints, and a checkable completion condition. Separate difficult design from mechanical execution when practical rather than assigning every step to the expensive model.
5. Check the result. Escalate when there is concrete evidence of a reasoning gap, unresolved ambiguity, or failed validation requiring deeper analysis. Missing context, unavailable tools, and transient errors are not by themselves reasons to upgrade the model.

Start in the class the task warrants; do not run an obviously unsuitable cheaper model first. Do not automatically move up a class for every retry, nor default to the orchestrator's own model.

If no listed model is available or the host cannot select a model per call, report the limitation and use only an allowed fallback; do not silently claim the preferred routing was applied. Before using Fable or Astra, give a brief concrete justification for why the thoughtful class is insufficient.
