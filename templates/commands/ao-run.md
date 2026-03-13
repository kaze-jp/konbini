# AO Autonomous Execution

Launch the AO orchestrator for autonomous feature implementation. Reads approved tasks and executes them through the full implementation loop.

## Usage

```
/kiro:ao-run <feature-name>
```

## Instructions

1. **Validate prerequisites**: Verify all required spec documents exist:
   - `.kiro/specs/$FEATURE_NAME/requirements.md` (required)
   - `.kiro/specs/$FEATURE_NAME/design.md` (required)
   - `.kiro/specs/$FEATURE_NAME/tasks.md` (required)

   If any are missing, report which documents are absent and which commands to run.

2. **Read the task list** from `.kiro/specs/$FEATURE_NAME/tasks.md` and parse:
   - All task definitions with their dependencies
   - Parallel execution groups
   - File conflict matrix
   - Current completion status (resume support)

3. **Read steering documents** for implementation constraints:
   - `.ao/steering/tech.md`
   - `.ao/steering/structure.md`
   - Any custom steering documents in `.ao/steering/`

4. **Build execution plan**:
   - Identify all tasks with satisfied dependencies (ready to execute)
   - Group parallelizable tasks (P) into execution batches
   - Order batches by dependency chain
   - Skip already-completed tasks (for resume scenarios)

5. **Present the execution plan** to the user:
   ```
   Execution Plan for: <feature-name>

   Batch 1 (parallel): T-001, T-002, T-003
   Batch 2 (sequential): T-004 (depends on T-001)
   Batch 3 (parallel): T-005, T-006
   ...

   Total: X tasks, Y batches
   Estimated: Z tasks already complete
   ```

6. **Request user approval** before beginning execution.

7. **Execute each batch**:
   - For each task in the batch:
     - Read the design document for the relevant component
     - Implement the changes as specified
     - Write tests as required by the task
     - Verify acceptance criteria
   - After each task, update `tasks.md` with completion status
   - After each batch, run tests to catch regressions
   - Report batch completion and any issues

8. **Handle failures during execution**:
   - If a task fails, mark it as blocked with the reason
   - Skip dependent tasks and move to the next independent batch
   - Report all failures at the end of the current batch
   - Ask the user whether to continue, retry, or abort

9. **Final report** after all batches complete:
   ```
   AO Execution Complete: <feature-name>

   Tasks completed: X / Y
   Tasks failed: Z
   Tests passing: A / B

   Remaining work: [list of incomplete tasks]
   ```

10. **Suggest next steps**: Run `/kiro:validate-impl` for full validation.

## Output

- Implemented source files as specified in tasks
- Updated `.kiro/specs/<feature-name>/tasks.md` with completion status
- Test files as specified in tasks

## Notes

- The orchestrator respects the file conflict matrix; it will never execute conflicting tasks in parallel.
- If the user interrupts execution, progress is preserved in `tasks.md` and can be resumed.
- Large features benefit from autonomous execution; small features may be faster with `/kiro:spec-impl`.
- The orchestrator does not push to git; the user controls their own commit workflow.
