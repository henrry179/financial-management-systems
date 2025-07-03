#!/usr/bin/env python3
"""
Generate PROJECT_STRUCTURE.md documenting the file tree structure of the repository.
Excludes common unwanted directories to keep output concise.
"""
import os
from pathlib import Path
from datetime import datetime

EXCLUDE_DIRS = {'.git', 'venv', 'node_modules', '__pycache__', '.cursor', 'logs'}

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOC_PATH = PROJECT_ROOT / 'docs' / 'PROJECT_STRUCTURE.md'

MAX_DEPTH = 2  # levels to display

def should_exclude(path: Path) -> bool:
    # Exclude directories in EXCLUDE_DIRS at any depth
    parts = set(path.parts)
    return bool(parts & EXCLUDE_DIRS)

def build_tree(current: Path, prefix: str = '', depth: int = 0):
    if depth > MAX_DEPTH:
        return []
    lines = []
    entries = sorted([p for p in current.iterdir() if not should_exclude(p)], key=lambda p: (p.is_file(), p.name.lower()))
    total = len(entries)
    for idx, entry in enumerate(entries):
        connector = '└── ' if idx == total - 1 else '├── '
        line = f"{prefix}{connector}{entry.name}{'/' if entry.is_dir() else ''}"
        lines.append(line)
        if entry.is_dir():
            extension = '    ' if idx == total - 1 else '│   '
            lines.extend(build_tree(entry, prefix + extension, depth + 1))
    return lines

def generate_structure():
    tree_lines = build_tree(PROJECT_ROOT)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    header = [
        '# 📁 项目文件结构',
        '',
        f'*最后生成时间*: {now}',
        '',
        '代码仓库目录层级 (深度 ≤ 2)',
        '```',
    ]
    footer = ['```', '', '---', '', '*本文件由 scripts/generate_project_structure.py 自动生成*']
    DOC_PATH.parent.mkdir(exist_ok=True)
    DOC_PATH.write_text('\n'.join(header + tree_lines + footer), encoding='utf-8')
    print(f"✅ PROJECT_STRUCTURE.md generated at {DOC_PATH}")

if __name__ == '__main__':
    generate_structure() 