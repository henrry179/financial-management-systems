import re
import os

def generate_mindmap(input_file, output_dir):
    """
    Parses a markdown file with a specific structure and generates a mind map
    in markdown format.
    """
    output_file_path = os.path.join(output_dir, 'pftm_mindmap.md')

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(input_file, 'r', encoding='utf-8') as f_in, \
         open(output_file_path, 'w', encoding='utf-8') as f_out:
        
        f_out.write("# PFTM Combined Mind Map\n\n")
        
        last_heading_level = 0
        
        for line in f_in:
            line = line.strip()
            if not line:
                continue

            # Level 1 from '###'
            if line.startswith('###'):
                level = 1
                content = line.replace('###', '').strip()
                last_heading_level = level
                f_out.write(f"- {content}\n")
                continue

            # Headings like **1. ...** or **1.1 ...**
            match = re.match(r'\*\*(.*?)\*\*', line)
            if match:
                inner_content = match.group(1).strip()
                content_match = re.match(r'([\d\.]+)\s+(.*)', inner_content)
                if content_match:
                    prefix = content_match.group(1).strip()
                    content = content_match.group(2).strip()
                    
                    level_prefix = prefix
                    if level_prefix.endswith('.'):
                        level_prefix = level_prefix[:-1]

                    level = level_prefix.count('.') + 2
                    last_heading_level = level
                    indent = '    ' * (level - 1)
                    f_out.write(f"{indent}- **{prefix} {content}**\n")
                    continue

            # List items
            if line.startswith('-'):
                content = line[1:].strip()
                indent = '    ' * last_heading_level
                f_out.write(f"{indent}- {content}\n")
                continue

def main():
    """
    Main function to run the script from command line.
    """
    # Using relative paths from the workspace root
    input_md_path = 'pftm/pftm_combined.md'
    output_dir_path = 'pftm_mindmap'
    
    # Get the directory of the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Construct absolute paths
    abs_input_path = os.path.join(script_dir, '..', input_md_path)
    abs_output_dir = os.path.join(script_dir, '..', output_dir_path)

    # Normalize paths to handle '..'
    abs_input_path = os.path.normpath(abs_input_path)
    abs_output_dir = os.path.normpath(abs_output_dir)
    
    generate_mindmap(abs_input_path, abs_output_dir)
    
    output_file_name = os.path.join(output_dir_path, 'pftm_mindmap.md')
    print(f"Mind map generated in {output_file_name}")

if __name__ == '__main__':
    main() 