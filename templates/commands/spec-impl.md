# Start Implementation

Begin implementing approved tasks from the task list, using the orchestrator agent for autonomous execution.

## Usage

```
/kiro:spec-impl <feature-name>
```

## Instructions

1. **Read the task list** from `.kiro/specs/$FEATURE_NAME/tasks.md`. If it does not exist, instruct the user to run `/kiro:spec-tasks` first.

2. **Read the design document** from `.kiro/specs/$FEATURE_NAME/design.md` for implementation reference.

3. **Read steering documents** for implementation constraints:
   - `.ao/steering/tech.md` for coding standards and patterns
   - `.ao/steering/structure.md` for file placement conventions

4. **Check current progress**: Look for any existing implementation progress markers in the tasks file (checked boxes in acceptance criteria).

5. **Determine execution strategy**:
   - Identify the next batch of tasks ready for implementation (all dependencies satisfied)
   - Group parallelizable tasks (P) that can be executed simultaneously
   - Present the execution plan to the user for approval

6. **For each task, execute**:
   - Create or modify the specified files
   - Follow the design document's API contracts and data models exactly
   - Write tests as specified in the task's test requirements
   - Mark acceptance criteria as complete when satisfied

7. **After each task completes**:
   - Run relevant tests to verify the task
   - Update the task status in `tasks.md` (mark as complete)
   - Check if blocked tasks are now unblocked

8. **Handle failures**:
   - If a task cannot be completed as designed, document the blocker
   - Suggest design modifications if needed
   - Do not proceed with dependent tasks until blockers are resolved

9. **Report progress** after each batch:
   - Tasks completed in this batch
   - Tasks remaining
   - Any blockers or deviations from design
   - Next batch of tasks ready for execution

## Output

- Modified source files as specified in tasks
- Updated `.kiro/specs/<feature-name>/tasks.md` with completion status

## Notes

- Always follow the design document; do not improvise architectural decisions.
- If the design is ambiguous, ask the user rather than guessing.
- Run tests frequently to catch regressions early.
- Commit after each logical group of tasks if the user has a git workflow.
