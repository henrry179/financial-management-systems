import argparse
import os
import re
from graphviz import Digraph

def parse_markdown(file_path):
    """
    Parses a markdown file to extract a tree of headings.
    Recognizes headings like #, ##, ### etc.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    root = {'level': 0, 'title': 'Mind Map', 'children': []}
    # parent_stack keeps track of the parent for the current level
    parent_stack = [root]

    for line in lines:
        line = line.strip()
        heading_match = re.match(r'^(#+)\s+(.*)', line)
        if heading_match:
            level = len(heading_match.group(1))
            title = heading_match.group(2).strip()

            node = {'level': level, 'title': title, 'children': []}

            # Go up the stack to find the correct parent for this node
            while parent_stack[-1]['level'] >= level:
                parent_stack.pop()
            
            parent_stack[-1]['children'].append(node)
            parent_stack.append(node)
            
    return root

def add_nodes_edges(graph, node, parent_id=None):
    """
    Recursively adds nodes and edges to the graph from the parsed tree.
    """
    node_id = str(hash(node['title'])) # Unique ID for the node
    graph.node(node_id, node['title'])

    if parent_id:
        graph.edge(parent_id, node_id)

    for child in node['children']:
        add_nodes_edges(graph, child, parent_id=node_id)


def create_mindmap(md_tree, output_file):
    """
    Creates a mind map from the markdown tree and saves it to a file.
    """
    # Determine the output format from the file extension
    output_dir = os.path.dirname(output_file)
    file_name = os.path.basename(output_file)
    file_base, file_ext = os.path.splitext(file_name)
    output_format = file_ext[1:] if file_ext else 'png'

    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Initialize the graph
    dot = Digraph('MindMap', comment='Markdown Mind Map')
    dot.attr('graph', rankdir='LR', splines='ortho')
    dot.attr('node', shape='box', style='rounded', fontname='SimHei')
    dot.attr('edge', arrowhead='none')

    # Start building the graph from the root's children
    for child in md_tree['children']:
        add_nodes_edges(dot, child, parent_id=str(hash(md_tree['title'])))
    
    # Render and save the mind map
    # The 'cleanup=True' option removes the intermediate DOT source file
    try:
        dot.render(os.path.join(output_dir, file_base), format=output_format, cleanup=True, view=False)
        print(f"Mind map successfully generated: {output_file}")
    except Exception as e:
        print(f"Error generating mind map: {e}")
        print("Please ensure Graphviz is installed and in your system's PATH.")


def main():
    parser = argparse.ArgumentParser(description="Convert a Markdown file to a mind map image (PNG, JPG, PDF).")
    parser.add_argument("input_file", help="Path to the input Markdown file.")
    parser.add_argument("output_file", help="Path to the output image/PDF file. The extension determines the format (e.g., mindmap.png, mindmap.pdf).")
    args = parser.parse_args()

    if not os.path.exists(args.input_file):
        print(f"Error: Input file not found at {args.input_file}")
        return
        
    md_tree = parse_markdown(args.input_file)
    create_mindmap(md_tree, args.output_file)


if __name__ == '__main__':
    main() 