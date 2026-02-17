# Visual Flow Diagram

## What Happens When User Submits GitHub URL

```
┌─────────────────────────────────────────────────────────────┐
│  User enters: https://github.com/username/repo              │
│  Clicks: "Run Preprocessing"                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │   handlePreprocess() executes     │
        └───────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │  TWO THINGS   │
                    │  HAPPEN NOW   │
                    └───────────────┘
                            ↓
            ┌───────────────────────────────┐
            │                               │
            ↓                               ↓
┌─────────────────────┐         ┌─────────────────────┐
│   AWS BACKGROUND    │         │   LOCAL FOREGROUND  │
│   (StatusBox)       │         │   (Main UI)         │
└─────────────────────┘         └─────────────────────┘
            │                               │
            ↓                               ↓
   fetch('/submit-aws-job')        fetch('/preprocess')
   .then(...) // non-blocking      await response
            │                               │
            ↓                               ↓
   Store job_id                    Clone GitHub repo
   Show StatusBox                  (git clone --depth 1)
   Start polling                            │
            │                               ↓
            │                      Run preprocessor.analyze()
            ↓                      Run ast_analyzer.analyze()
   Poll every 5 seconds            Run CFG generation
   (doesn't block UI)                       │
            │                               ↓
            ↓                      Update main UI tabs
   AWS Status: PROCESSING          Show results immediately
            │                               │
            ↓                               ↓
   (User continues working)        User sees:
   (Can refresh page)              - Overview tab
   (Box persists)                  - Code Analysis tab
            │                      - Semantic Graph tab
            ↓                      - CFG tab
   AWS Status: COMPLETED                    │
            │                               ↓
            ↓                       Local results ready!
   Fetch AWS results               (Main UI populated)
   Extract 2 txt files                      │
            │                               │
            ↓                               │
   StatusBox shows                          │
   "Click to view results"                  │
            │                               │
            ↓                               │
   User clicks StatusBox header             │
            │                               │
            ↓                               │
   Box expands                              │
   Shows both txt files                     │
            │                               │
            ↓                               │
    AWS results visible!                    │
            │                               │
            └───────────────┬───────────────┘
                            ↓
                ┌─────────────────────┐
                │  BOTH COMPLETE!     │
                │  User has:          │
                │  - Local results    │
                │  - AWS results      │
                └─────────────────────┘
```

## Timeline Example

```
T+0s:   User clicks "Run Preprocessing"
T+0s:   StatusBox appears "Job Submitted" (AWS)
T+0s:   Main UI shows loading spinner (Local)
T+5s:   StatusBox updates "Processing..." (AWS)
T+30s:  Main UI shows results!  (Local done)
        └─ All tabs available
        └─ Can browse results
T+35s:  StatusBox updates "Processing..." (AWS still going)
T+2m:   StatusBox shows "Completed"  (AWS done)
        └─ Click to expand
        └─ View 2 txt files

Result: User has BOTH results, processed independently!
```

## Key Points

1. **Non-Blocking:** AWS submission doesn't wait for response
2. **Parallel:** Both processes run at same time
3. **Independent:** AWS and Local don't affect each other
4. **Dual Results:** User gets best of both worlds
5. **Persistent:** StatusBox survives refresh
6. **Backward Compatible:** .zip files work exactly as before