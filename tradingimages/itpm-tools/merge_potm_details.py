#!/usr/bin/env python3
"""merge_potm_details.py

Utility script to merge the bilingual POTM detailed markdown files
into one combined document. Follows the same output style as
merge_bilingual_outline.py used for the PFTM course, but adapted to
handle the Principles of Trading Mastery (POTM) series.
"""

import glob
import os
import sys
from datetime import datetime

# Constants -------------------------------------------------------------------
DETAILS_DIR = 'tradingimages/potm/potm-details'
PATTERN = os.path.join(DETAILS_DIR, '[0-9][0-9].md')
OUTPUT_FILE = 'tradingimages/potm/Principles_of_Trading_Mastery_Combined_Bilingual.md'


# Helper ----------------------------------------------------------------------

def merge_markdown_files(files: list[str], output_path: str) -> None:
    """Merge every markdown file in *files* into *output_path* with chapter
    separators. The first line (### NN) is skipped to avoid redundant
    headings inside the combined document.
    """
    with open(output_path, 'w', encoding='utf-8') as out:
        # Write document header ------------------------------------------------
        out.write('# Principles of Trading Mastery – Complete Bilingual Course\n\n')
        out.write('（交易精通原则 – 完整双语课程）\n\n')
        out.write('> **Generated on:** {}\n\n'.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        out.write('This document merges all individual POTM chapters into one comprehensive bilingual guide.\n\n')
        out.write('本文档将所有 POTM 单独章节合并为一份综合的中英双语指南。\n')

        # Append each chapter ---------------------------------------------------
        for file_path in files:
            chapter_num = int(os.path.splitext(os.path.basename(file_path))[0])
            out.write('\n---\n\n')
            out.write(f'## Chapter {chapter_num:02d} / 第 {chapter_num:02d} 章\n\n')
            with open(file_path, 'r', encoding='utf-8') as src:
                lines = src.readlines()
                # Skip redundant leading heading like "### NN"
                if lines and lines[0].strip().startswith('### '):
                    lines = lines[1:]
                out.writelines(lines)

    print(f"✅ Successfully merged {len(files)} chapters into {output_path}")
    print(f"📄 Total chapters: {len(files)}")
    print(f"📁 Output location: {os.path.abspath(output_path)}")


# Main ------------------------------------------------------------------------

def main() -> None:
    md_files = sorted(glob.glob(PATTERN))

    if not md_files:
        print('❌ No markdown files matching pattern in', DETAILS_DIR)
        sys.exit(1)

    print(f"📚 Found {len(md_files)} bilingual markdown files to merge:")
    for file in md_files:
        print(f"   - {file}")
    print()

    # Ensure output directory exists
    out_dir = os.path.dirname(OUTPUT_FILE)
    os.makedirs(out_dir, exist_ok=True)

    merge_markdown_files(md_files, OUTPUT_FILE)


if __name__ == '__main__':
    main() 