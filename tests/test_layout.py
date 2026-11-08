"""Portfolio standard checks: required files exist, the README abstract is in place, no public grade.

The repo is not pre-registered (PROPOSAL.md says why), so there is no lock to pin here.
When a confirmatory proposal is locked and tagged, add a SHA-256 pin of it to this file.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_EXT = (".md", ".jsx", ".js", ".mjs", ".html", ".cff")
# A public grade looks like "8,400 of 10,000", "Grade A-", "Grades on record", or a rubric score column.
GRADE = re.compile(r"of 10,000|10,000 scale|\bGrades?\b|/10000|Total /1000|[Rr]ubric (grade|score)")


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


def public_files():
    for top, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules", "dist", "__pycache__")]
        for name in files:
            if name.endswith(PUBLIC_EXT):
                yield os.path.relpath(os.path.join(top, name), ROOT)


def test_required_files_exist():
    need = ["README.md", "PROPOSAL.md", "REPORT.md", "CHANGELOG.md", "CITATION.cff", "SECURITY.md", "LICENSE",
            "docs/decisions/0001-teaching-analogue-scope.md", "level-1-learn/results_learn.json",
            "level-2-build/results_build.json", "level-3-deep/results_deep.json", "level-3-deep/results_seeds.json"]
    missing = [p for p in need if not os.path.exists(os.path.join(ROOT, p))]
    assert not missing, "missing: " + ", ".join(missing)


def test_readme_opens_with_the_abstract():
    text = read("README.md")
    for label in ("**Question.**", "**Headline.**", "**Field.**", "**Job family.**", "**Verdict.**", "## Lifecycle"):
        assert label in text, "README.md lacks " + label
    assert "not pre-registered" in text.split("**Verdict.**")[1].split("\n\n")[0], "verdict must say not pre-registered"
    stages = re.findall(r"^- (\w+): (DONE|OPEN)", text, re.M)
    assert [s for s, _ in stages] == ["Question", "Proposal", "Baseline", "Build", "Evaluate", "Report", "Review",
                                      "Release"], stages


def test_no_public_grade():
    hits = []
    for path in public_files():
        for n, line in enumerate(read(path).splitlines(), 1):
            if GRADE.search(line) and path != os.path.join("tests", "test_layout.py"):
                hits.append("%s:%d: %s" % (path, n, line.strip()[:80]))
    assert not hits, "grades are internal only:\n" + "\n".join(hits)


def test_the_grade_check_catches_a_grade():
    assert GRADE.search("Full table and grade (8,400 of 10,000)")
    assert GRADE.search("Grade B+.")
    assert not GRADE.search("16 of 16 grader scenarios graded as expected")


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    for name, fn in tests:
        fn()
        print(name, "PASS")
    print(len(tests), "layout tests passed")
