import glob
import os

# Locate all markdown files in potm/potm-details folder that follow the NN.md naming pattern
md_files = sorted(glob.glob('potm/potm-details/[0-9][0-9].md'))

OUTPUT_FILE = 'pftm/Portfolio_Management_Thematic_Masterclass_Combined_Bilingual.md'

def merge_markdown_files(files, output_path):
    """Merge individual bilingual markdown notes into a single, ordered outline."""
    with open(output_path, 'w', encoding='utf-8') as out:
        # Write document title
        out.write('# Portfolio Management Thematic Masterclass – Complete Bilingual Course\n\n')
        out.write('（投资组合管理主题大师课 – 完整双语课程）\n\n')
        out.write('## Course Overview / 课程概述\n\n')
        out.write('This document contains the complete bilingual content of the Portfolio Management Thematic Masterclass, combining all chapters into a comprehensive guide.\n\n')
        out.write('本文档包含投资组合管理主题大师课的完整双语内容，将所有章节合并为一份综合指南。\n\n')
        
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
        print('❌ No markdown files following NN.md pattern found in the potm/potm-details directory.')
        print('📁 Please ensure the potm/potm-details folder contains files like 01.md, 02.md, etc.')
    else:
        print(f"📚 Found {len(md_files)} bilingual markdown files to merge:")
        for file in md_files:
            print(f"   - {file}")
        print()
        merge_markdown_files(md_files, OUTPUT_FILE) 