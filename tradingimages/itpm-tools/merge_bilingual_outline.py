import glob
import os

# Locate all markdown files inside the detailed notes folder that follow the NN.md naming pattern (e.g., 01.md … 28.md)
md_files = sorted(glob.glob('tradingimages/pftm/pftm-details/[0-9][0-9].md'))

# Output combined file to the pftm root for easy access
OUTPUT_FILE = 'tradingimages/pftm/Professional_Forex_Trading_Masterclass_Combined_Bilingual.md'

def merge_markdown_files(files, output_path):
    """Merge individual bilingual markdown notes into a single, ordered outline."""
    with open(output_path, 'w', encoding='utf-8') as out:
        # Write document title
        out.write('# Professional Trading Masterclass – Complete Bilingual Course\n\n')
        out.write('（专业交易大师课 – 完整双语课程）\n\n')
        out.write('## Course Overview / 课程概述\n\n')
        out.write('This document contains the complete bilingual content of the Professional Trading Masterclass, combining all 28 chapters into a comprehensive guide.\n\n')
        out.write('本文档包含专业交易大师课的完整双语内容，将所有28章合并为一份综合指南。\n\n')
        
        # Process each file in numeric order
        for file_path in files:
            chapter_num = int(os.path.splitext(os.path.basename(file_path))[0])
            out.write(f'\n---\n\n')  # Horizontal rule to separate chapters
            out.write(f'## Chapter {chapter_num:02d} / 第 {chapter_num:02d} 章\n\n')
            with open(file_path, 'r', encoding='utf-8') as src:
                lines = src.readlines()
                # Skip the first line if it is a redundant heading like "### N"
                if lines and lines[0].strip().startswith('### '):
                    lines = lines[1:]
                out.writelines(lines)
    print(f"✅ Successfully merged {len(files)} bilingual chapters into {output_path}")
    print(f"📄 Total chapters: {len(files)}")
    print(f"📁 Output location: {os.path.abspath(output_path)}")


if __name__ == '__main__':
    if not md_files:
        print('❌ No markdown files following NN.md pattern found in the pftm directory.')
        print('📁 Please ensure the pftm folder contains files like 01.md, 02.md, etc.')
    else:
        print(f"📚 Found {len(md_files)} bilingual markdown files to merge:")
        for file in md_files:
            print(f"   - {file}")
        print()
        merge_markdown_files(md_files, OUTPUT_FILE) 