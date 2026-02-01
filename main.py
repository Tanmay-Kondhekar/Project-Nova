from joern_analyzer import analyze_code_with_joern


if __name__ == "__main__":
    # Generate CPG once, reuse multiple times
    result = analyze_code_with_joern(
        "auto-cpufreq/",
        output_dir="persistent_cpg",
        keep_workspace=True
    )

    cpg_path = result.cpg_bin_path