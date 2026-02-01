"""
Example Usage Scripts for Joern Static Analysis

This file demonstrates various ways to use the analyze_code_with_joern function.
"""

from pathlib import Path
from joern_analyzer import analyze_code_with_joern
import json


def example_1_simple_file_analysis():
    """
    Example 1: Analyze a single source file
    
    This is the simplest use case - analyze one file and examine the results.
    """
    print("\n" + "="*70)
    print("EXAMPLE 1: Simple File Analysis")
    print("="*70)
    
    # Create a sample Java file
    sample_code = """
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int multiply(int x, int y) {
        int result = 0;
        for (int i = 0; i < y; i++) {
            result = add(result, x);
        }
        return result;
    }
    
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        int sum = calc.add(5, 3);
        int product = calc.multiply(4, 6);
        System.out.println("Sum: " + sum);
        System.out.println("Product: " + product);
    }
}
"""
    
    # Write sample code to file
    Path("Calculator.java").write_text(sample_code)
    
    # Analyze the file
    result = analyze_code_with_joern("Calculator.java", keep_workspace=True)
    
    # Display results
    print(f"\n✓ Analysis complete!")
    print(f"  CPG Binary: {result.cpg_bin_path}")
    print(f"  Workspace: {result.workspace_path}")
    print(f"\n  Available Graphs:")
    for graph_name in result.graphs.keys():
        print(f"    - {graph_name}")
    
    # Show snippet of AST DOT graph
    if 'ast_dot' in result.graphs:
        ast_snippet = result.graphs['ast_dot'][:500]
        print(f"\n  AST DOT Graph (first 500 chars):")
        print(f"  {ast_snippet}...")
    
    return result


def example_2_repository_analysis():
    """
    Example 2: Analyze an entire repository
    
    Demonstrates analyzing multiple files in a directory structure.
    """
    print("\n" + "="*70)
    print("EXAMPLE 2: Repository Analysis")
    print("="*70)
    
    # Create a sample repository structure
    repo_dir = Path("sample_repo")
    repo_dir.mkdir(exist_ok=True)
    
    (repo_dir / "src").mkdir(exist_ok=True)
    (repo_dir / "utils").mkdir(exist_ok=True)
    
    # Main application file
    (repo_dir / "src" / "App.java").write_text("""
public class App {
    public static void main(String[] args) {
        UserManager manager = new UserManager();
        manager.addUser("Alice");
        manager.addUser("Bob");
        manager.listUsers();
    }
}
""")
    
    # User management utility
    (repo_dir / "src" / "UserManager.java").write_text("""
import java.util.ArrayList;
import java.util.List;

public class UserManager {
    private List<String> users = new ArrayList<>();
    
    public void addUser(String name) {
        users.add(name);
        System.out.println("Added user: " + name);
    }
    
    public void listUsers() {
        System.out.println("Users:");
        for (String user : users) {
            System.out.println("  - " + user);
        }
    }
}
""")
    
    # Analyze the entire repository
    result = analyze_code_with_joern(
        repo_dir,
        output_dir="analysis_results",
        keep_workspace=True
    )
    
    print(f"\n✓ Repository analysis complete!")
    print(f"  Source: {result.source_info['path']}")
    print(f"  Type: {result.source_info['type']}")
    print(f"  Output Directory: analysis_results/")
    print(f"  Workspace: {result.workspace_path}")
    
    return result


def example_3_graph_extraction():
    """
    Example 3: Extract and process graph data
    
    Demonstrates accessing different graph representations programmatically.
    """
    print("\n" + "="*70)
    print("EXAMPLE 3: Graph Data Extraction")
    print("="*70)
    
    # Create a sample C++ file with control flow
    cpp_code = """
#include <iostream>

int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    for (int i = 0; i < 10; i++) {
        std::cout << fibonacci(i) << std::endl;
    }
    return 0;
}
"""
    
    Path("fibonacci.cpp").write_text(cpp_code)
    
    # Analyze
    result = analyze_code_with_joern("fibonacci.cpp", keep_workspace=True)
    
    # Extract AST DOT graph
    if 'ast_dot' in result.graphs:
        ast_dot = result.graphs['ast_dot']
        
        # Save to file for external visualization
        with open("ast_graph.dot", "w") as f:
            f.write(ast_dot)
        
        print(f"\n✓ AST DOT graph saved to: ast_graph.dot")
        print(f"  Size: {len(ast_dot)} characters")
        print(f"  Can be visualized with: dot -Tsvg ast_graph.dot -o ast.svg")
    
    # Extract CFG DOT graph
    if 'cfg_dot' in result.graphs:
        cfg_dot = result.graphs['cfg_dot']
        
        with open("cfg_graph.dot", "w") as f:
            f.write(cfg_dot)
        
        print(f"\n✓ CFG DOT graph saved to: cfg_graph.dot")
        print(f"  Size: {len(cfg_dot)} characters")
    
    # Access JSON data (if available)
    if 'nodes_json_path' in result.graphs:
        nodes_path = result.graphs['nodes_json_path']
        print(f"\n✓ Nodes JSON available at: {nodes_path}")
        print(f"  You can process this with Python's json module or jq")
    
    return result


def example_4_visualization():
    """
    Example 4: Generate visualizations
    
    Demonstrates how to work with generated SVG visualizations.
    """
    print("\n" + "="*70)
    print("EXAMPLE 4: Graph Visualization")
    print("="*70)
    
    # Create a simple Python file
    py_code = """
def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)

def main():
    for i in range(1, 6):
        result = factorial(i)
        print(f"{i}! = {result}")

if __name__ == "__main__":
    main()
"""
    
    Path("factorial.py").write_text(py_code)
    
    # Analyze
    result = analyze_code_with_joern(
        "factorial.py",
        output_dir="visualization_output",
        keep_workspace=True
    )
    
    print(f"\n✓ Analysis complete!")
    
    # Check for SVG visualizations
    if 'ast_svg_path' in result.graphs:
        svg_path = result.graphs['ast_svg_path']
        print(f"\n✓ AST SVG visualization generated!")
        print(f"  Path: {svg_path}")
        print(f"  Open in browser to view")
    else:
        print(f"\n⚠ SVG not generated (Graphviz may not be installed)")
        print(f"  Install with: sudo apt-get install graphviz")
    
    if 'cfg_svg_path' in result.graphs:
        svg_path = result.graphs['cfg_svg_path']
        print(f"\n✓ CFG SVG visualization generated!")
        print(f"  Path: {svg_path}")
    
    # DOT graphs are always available
    print(f"\n✓ DOT graphs available for custom visualization:")
    print(f"  - ast.dot (Abstract Syntax Tree)")
    print(f"  - cfg.dot (Control Flow Graph)")
    
    return result


def example_5_cpg_reuse():
    """
    Example 5: Reusing CPG for multiple analyses
    
    Demonstrates how to generate CPG once and use it multiple times.
    """
    print("\n" + "="*70)
    print("EXAMPLE 5: CPG Reuse Pattern")
    print("="*70)
    
    # Create a sample file
    code = """
public class DataProcessor {
    private String[] data;
    
    public DataProcessor(String[] input) {
        this.data = input;
    }
    
    public void process() {
        for (int i = 0; i < data.length; i++) {
            String item = data[i];
            if (item != null) {
                System.out.println("Processing: " + item);
            }
        }
    }
}
"""
    
    Path("DataProcessor.java").write_text(code)
    
    # Generate CPG once
    result = analyze_code_with_joern(
        "DataProcessor.java",
        output_dir="cpg_storage",
        keep_workspace=True
    )
    
    cpg_path = result.cpg_bin_path
    
    print(f"\n✓ CPG generated and saved!")
    print(f"  Location: {cpg_path}")
    print(f"  Size: {cpg_path.stat().st_size} bytes")
    
    print(f"\n✓ This CPG can now be loaded multiple times without re-parsing:")
    print(f"  - Run security analysis")
    print(f"  - Calculate complexity metrics")
    print(f"  - Extract call graphs")
    print(f"  - Identify code patterns")
    print(f"  - All without regenerating the CPG!")
    
    return result


def example_6_error_handling():
    """
    Example 6: Error handling and edge cases
    
    Demonstrates proper error handling patterns.
    """
    print("\n" + "="*70)
    print("EXAMPLE 6: Error Handling")
    print("="*70)
    
    # Test invalid path
    print("\n1. Testing invalid path handling...")
    try:
        result = analyze_code_with_joern("nonexistent_file.java")
    except ValueError as e:
        print(f"   ✓ Caught expected error: {e}")
    
    # Test with valid file
    print("\n2. Testing valid analysis...")
    simple_code = """
public class Simple {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
"""
    Path("Simple.java").write_text(simple_code)
    
    try:
        result = analyze_code_with_joern("Simple.java", keep_workspace=True)
        print(f"   ✓ Analysis successful!")
        print(f"   ✓ CPG generated: {result.cpg_bin_path.exists()}")
    except Exception as e:
        print(f"   ✗ Unexpected error: {e}")
    
    return result


def run_all_examples():
    """Run all examples sequentially."""
    print("\n" + "="*70)
    print("JOERN STATIC ANALYSIS - COMPREHENSIVE EXAMPLES")
    print("="*70)
    
    examples = [
        example_1_simple_file_analysis,
        example_2_repository_analysis,
        example_3_graph_extraction,
        example_4_visualization,
        example_5_cpg_reuse,
        example_6_error_handling
    ]
    
    results = []
    for example_func in examples:
        try:
            result = example_func()
            results.append(result)
        except Exception as e:
            print(f"\n✗ Example failed: {e}")
    
    print("\n" + "="*70)
    print("ALL EXAMPLES COMPLETE")
    print("="*70)
    print(f"\nGenerated {len(results)} analysis results")
    print("\nYou can now:")
    print("  - Examine the workspace directories")
    print("  - View generated DOT/SVG files")
    print("  - Process JSON data programmatically")
    print("  - Reuse CPG binaries for further analysis")
    
    return results


if __name__ == "__main__":
    # Run all examples
    results = run_all_examples()
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    for i, result in enumerate(results, 1):
        print(f"\nExample {i}:")
        print(f"  Workspace: {result.workspace_path}")
        print(f"  CPG: {result.cpg_bin_path}")
        print(f"  Graphs: {', '.join(result.graphs.keys())}")
