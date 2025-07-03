import markdown
import os
from graphviz import Digraph
from bs4 import BeautifulSoup
import textwrap # 用于文本自动换行
import sys # 用于获取当前系统信息，以便推荐字体

class MarkdownMindMapConverter:
    """
    一个将 Markdown 文件转换为思维导图（PNG, JPG, PDF）的工具。
    支持增强的 Markdown 解析、多种布局、多主题以及高级渲染样式。
    """
    def __init__(self, output_dir="mindmap_output", default_font=None):
        """
        初始化转换器。
        :param output_dir: 输出文件存放的目录。
        :param default_font: 指定用于思维导图的字体。
                             如果为 None，将尝试根据操作系统推荐字体。
                             Windows: 'Microsoft YaHei' 或 'SimHei'
                             macOS: 'PingFang SC'
                             Linux: 'Source Han Sans SC' 或 'DejaVu Sans'
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        self.default_font = self._get_default_font(default_font)

        # 定义多个主题，每个主题包含节点、边和图的默认属性
        # 这些样式可以根据层级进行定制
        self.themes = {
            "default": {
                "node_styles": {
                    0: {'shape': 'doubleoctagon', 'style': 'filled', 'fillcolor': '#FFDDC1', 'fontcolor': '#333333', 'fontsize': '20'}, # 中心主题
                    1: {'shape': 'box', 'style': 'rounded,filled', 'fillcolor': '#DDEEFF', 'fontcolor': '#333333', 'fontsize': '16'}, # 一级分支
                    2: {'shape': 'ellipse', 'style': 'filled', 'fillcolor': '#EEFFDD', 'fontcolor': '#333333', 'fontsize': '14'}, # 二级分支
                    3: {'shape': 'oval', 'style': 'filled', 'fillcolor': '#FFFDD0', 'fontcolor': '#333333', 'fontsize': '12'}, # 三级分支
                    'default': {'shape': 'plaintext', 'fontcolor': '#555555', 'fontsize': '10'} # 更深层级或普通文本
                },
                "edge_styles": {
                    1: {'color': '#336699', 'penwidth': '2.0'}, # 一级连接
                    2: {'color': '#66AA33', 'penwidth': '1.5'}, # 二级连接
                    'default': {'color': '#AAAAAA', 'penwidth': '1.0', 'style': 'dashed'} # 默认连接
                },
                "graph_attrs": {
                    'rankdir': 'TB', # 默认方向：Top-Bottom
                    'splines': 'curved', # 连接线为曲线
                    'nodesep': '0.8', # 节点间距
                    'ranksep': '0.7', # 层级间距
                    'overlap': 'false', # 避免节点重叠
                    'pad': '1.0', # 图形填充区域
                    'bgcolor': '#FFFFFF', # 背景色
                }
            },
            "radial_bright": { # 放射状亮色主题
                 "node_styles": {
                    0: {'shape': 'circle', 'style': 'filled', 'fillcolor': '#FFEDED', 'fontcolor': '#FF0000', 'fontsize': '24'},
                    1: {'shape': 'box', 'style': 'filled', 'fillcolor': '#E0FFFF', 'fontcolor': '#008B8B', 'fontsize': '18'},
                    'default': {'shape': 'box', 'fontcolor': '#555555', 'fontsize': '12'}
                 },
                 "edge_styles": {
                    'default': {'color': '#FF6347', 'penwidth': '1.5', 'style': 'solid'}
                 },
                 "graph_attrs": {
                    'rankdir': 'TB', # 'twopi' 或 'circo' 布局时，此属性影响较小或被忽略
                    'splines': 'spline', # 强调曲线连接
                    'bgcolor': '#F8F8F8',
                 }
            },
            # 您可以在这里添加更多主题，例如 "dark_mode", "minimalist" 等
        }
        
        # 将当前的样式指向一个主题，初始为 'default'
        self.current_node_styles = self.themes["default"]["node_styles"]
        self.current_edge_styles = self.themes["default"]["edge_styles"]
        self.current_graph_attrs = self.themes["default"]["graph_attrs"]

    def _get_default_font(self, user_font):
        """
        根据操作系统推荐或使用用户指定的字体，确保中文显示。
        """
        if user_font:
            return user_font

        system = sys.platform
        if system.startswith('win'):
            # Windows 系统推荐字体
            return 'Microsoft YaHei' # 微软雅黑
        elif system.startswith('darwin'):
            # macOS 系统推荐字体
            return 'PingFang SC' # 苹方-简
        elif system.startswith('linux'):
            # Linux 系统推荐字体
            return 'Source Han Sans SC' # 思源黑体
        return 'Arial' # 默认英文或通用字体

    def set_theme(self, theme_name):
        """
        设置当前使用的思维导图主题。
        :param theme_name: 主题的名称（例如 'default', 'radial_bright'）。
        """
        if theme_name in self.themes:
            self.current_node_styles = self.themes[theme_name]["node_styles"]
            self.current_edge_styles = self.themes[theme_name]["edge_styles"]
            self.current_graph_attrs = self.themes[theme_name]["graph_attrs"]
            print(f"应用主题: '{theme_name}'")
        else:
            print(f"警告: 未找到主题 '{theme_name}'。将使用 'default' 主题。")
            self.set_theme("default") # 回退到默认

    def _format_node_text(self, text, max_width=30):
        """
        对节点文本进行自动换行，并尝试将 Markdown 粗体/斜体转换为 Graphviz HTML-like 标签。
        :param text: 原始文本。
        :param max_width: 自动换行的最大宽度。
        :return: 格式化后的文本，可能包含 <BR/> 和 HTML-like 标签。
        """
        # 简单的 Markdown 富文本到 Graphviz HTML-like 转换
        # Graphviz 的 HTML-like 标签解析器要求整个标签是 XML 格式，用 < > 包裹
        # 例如：<b>粗体</b>, <i>斜体</i>
        
        # 替换 **粗体** 为 <b>粗体</b>
        # 使用正则表达式避免误替换
        import re
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        # 替换 *斜体* 为 <i>斜体</i> (注意避免与 ** 冲突)
        text = re.sub(r'\*(?!\*)(.*?)(?<!\*)\*', r'<i>\1</i>', text)

        # 自动换行
        # 使用 <BR/> 而不是 \n 进行换行，因为 Graphviz HTML-like 标签中识别 <BR/>
        wrapped_lines = textwrap.wrap(text, width=max_width)
        return "<BR/>".join(wrapped_lines)

    def _parse_markdown_to_structured_nodes(self, md_content):
        """
        利用 python-markdown 将 Markdown 解析为 HTML，然后使用 BeautifulSoup
        更精确地提取层级结构（标题和列表项）。
        支持识别代码块和链接。
        """
        # 使用 markdown 库将 Markdown 转换为 HTML，并启用更多扩展
        # 'extra': 支持表格、脚注、删除线等
        # 'fenced_code': 支持围栏代码块
        # 'admonition': 支持提示块 (Note, Warning 等)
        html = markdown.markdown(md_content, extensions=['extra', 'fenced_code', 'admonition'])
        soup = BeautifulSoup(html, 'html.parser')

        nodes_data = []
        node_id_counter = 0
        
        # 维护一个层级堆栈，用于确定父节点
        # 堆栈存储 (HTML 标签名, 节点 ID, 层级, 节点类型)
        level_stack = [] 

        def get_current_parent_info(current_level):
            """
            根据当前层级获取合适的父节点ID及其层级。
            弹出比当前层级高或同级的节点，确保父子关系正确。
            """
            while level_stack and level_stack[-1][2] >= current_level:
                level_stack.pop() 
            if level_stack:
                return level_stack[-1][1], level_stack[-1][2] # 返回父节点ID和父层级
            return None, -1 # 没有父节点

        # 遍历 HTML 标签
        for element in soup.children:
            node_id = f"node_{node_id_counter}"
            node_text = element.get_text().strip() # 原始文本
            parent_id = None
            current_level = -1 # 初始化层级

            if element.name and element.name.startswith('h'): # 标题 H1, H2, H3...
                current_level = int(element.name[1]) - 1 # H1 -> 0, H2 -> 1, ...
                parent_id, _ = get_current_parent_info(current_level)
                
                nodes_data.append({
                    'id': node_id,
                    'text': self._format_node_text(node_text, max_width=50 if current_level == 0 else 30), # 主标题可以更宽
                    'parent_id': parent_id,
                    'level': current_level,
                    'type': 'heading'
                })
                # 将当前标题推入堆栈
                level_stack.append((element.name, node_id, current_level, 'heading'))
                node_id_counter += 1

            elif element.name in ['ul', 'ol']: # 无序列表或有序列表
                # 列表的层级基于其父元素（通常是另一个列表或标题）
                list_parent_id, list_parent_level = get_current_parent_info(current_level)
                
                # 遍历所有直接子列表项
                for li in element.find_all('li', recursive=False): 
                    li_node_id = f"node_{node_id_counter}"
                    li_text = li.get_text().strip()
                    # 列表项层级比其父容器（或者最近的标题/列表）高1
                    li_level = list_parent_level + 1 

                    # 重新计算列表项的父节点，确保是正确的层级
                    # 如果li本身包含子列表，复杂性增加，这里简化处理，让子列表项自己找父节点
                    li_parent_id_for_this_li, _ = get_current_parent_info(li_level)

                    nodes_data.append({
                        'id': li_node_id,
                        'text': self._format_node_text(li_text, max_width=40),
                        'parent_id': li_parent_id_for_this_li,
                        'level': li_level,
                        'type': 'list_item'
                    })
                    # 将当前列表项推入堆栈
                    level_stack.append(('li', li_node_id, li_level, 'list_item'))
                    node_id_counter += 1
                    
                    # 递归处理嵌套的 ul/ol （这部分由后续的元素遍历自动处理，因为它们会再次作为 element 出现）

                # 列表处理完毕后，将所有处理过的 li 和 ul/ol 从堆栈中移除
                # 这是关键，避免下一个顶层元素错误地成为当前列表的子元素
                while level_stack and (level_stack[-1][0] == 'li' or level_stack[-1][0] == 'ul' or level_stack[-1][0] == 'ol'):
                    level_stack.pop()

            elif element.name == 'p': # 段落
                # 将段落作为前一个同级或父级节点的子节点
                if nodes_data:
                    # 获取最近的父节点信息
                    last_node_parent_id, last_node_parent_level = get_current_parent_info(nodes_data[-1]['level'] + 1)
                    p_level = last_node_parent_level + 1 # 段落通常是下一层级
                    p_parent_id = last_node_parent_id # 它的父节点是上一级结构化元素

                    # 如果没有结构化父节点，尝试将其作为第一个H1的子节点
                    if not p_parent_id and nodes_data and nodes_data[0]['level'] == 0:
                        p_parent_id = nodes_data[0]['id']
                        p_level = 1 # 成为H1的直接子节点
                    
                    nodes_data.append({
                        'id': node_id,
                        'text': self._format_node_text(node_text, max_width=50),
                        'parent_id': p_parent_id,
                        'level': p_level,
                        'type': 'paragraph'
                    })
                    node_id_counter += 1
                
            elif element.name == 'pre' and element.code: # 代码块
                if nodes_data:
                    last_node_parent_id, last_node_parent_level = get_current_parent_info(nodes_data[-1]['level'] + 1)
                    code_level = last_node_parent_level + 1
                    code_parent_id = last_node_parent_id
                    
                    nodes_data.append({
                        'id': node_id,
                        'text': "代码:\\n" + element.code.get_text().strip(), # \\n 在Graphviz中是换行
                        'parent_id': code_parent_id,
                        'level': code_level,
                        'type': 'code_block',
                        'attrs': {'shape': 'box', 'style': 'filled', 'fillcolor': '#EEEEEE', 'fontname': 'Consolas', 'fontsize': '9', 'align': 'left'}
                    })
                    node_id_counter += 1

            elif element.name == 'a' and node_text: # 链接
                 if nodes_data:
                    last_node_parent_id, last_node_parent_level = get_current_parent_info(nodes_data[-1]['level'] + 1)
                    link_level = last_node_parent_level + 1
                    link_parent_id = last_node_parent_id
                    
                    link_url = element['href']
                    nodes_data.append({
                        'id': node_id,
                        'text': self._format_node_text(f"链接: {node_text}"), # 格式化链接文本
                        'parent_id': link_parent_id,
                        'level': link_level,
                        'type': 'link',
                        'attrs': {'shape': 'note', 'color': 'blue', 'fontcolor': 'blue', 'fontsize': '10', 'URL': link_url} # 添加URL属性
                    })
                    node_id_counter += 1
            # 更多类型可以根据需要添加 (table, blockquote, img etc.)
            
            # 如果当前处理的元素没有被明确地推入level_stack，需要确保堆栈的准确性
            # 这里主要依赖标题和列表来构建层级，其他元素会自动找到最近的父级
        return nodes_data

    def convert(self, md_filepath, output_format='png', layout_engine='dot', theme='default'):
        """
        将 Markdown 文件转换为思维导图，并保存为指定格式。
        :param md_filepath: 输入的 Markdown 文件路径。
        :param output_format: 输出文件格式 ('png', 'jpg', 'pdf')。
        :param layout_engine: Graphviz 布局引擎 ('dot', 'neato', 'fdp', 'sfdp', 'circo', 'twopi')。
        :param theme: 思维导图主题 ('default', 'radial_bright' 等)。
        """
        self.set_theme(theme) # 应用选择的主题

        if output_format not in ['png', 'jpg', 'pdf']:
            raise ValueError("不支持的输出格式。请选择 'png', 'jpg' 或 'pdf'。")
        if layout_engine not in ['dot', 'neato', 'fdp', 'sfdp', 'circo', 'twopi']:
            raise ValueError(f"不支持的布局引擎: '{layout_engine}'。请从 'dot', 'neato', 'fdp', 'sfdp', 'circo', 'twopi' 中选择。")

        with open(md_filepath, 'r', encoding='utf-8') as f:
            md_content = f.read()

        nodes_data = self._parse_markdown_to_structured_nodes(md_content)

        # 应用主题的 graph_attrs，并允许 layout_engine 覆盖
        current_graph_attrs = self.current_graph_attrs.copy()
        current_graph_attrs['engine'] = layout_engine # 强制设置引擎
        current_graph_attrs['fontname'] = self.default_font # 确保全局字体

        # 针对径向布局做特定调整
        if layout_engine in ['twopi', 'circo']:
            # 这些引擎通常不遵循 rankdir，并且 overlap 设置为 false 是推荐的
            current_graph_attrs['rankdir'] = 'LR' # 径向布局通常是左右展开
            current_graph_attrs['overlap'] = 'false' # 避免节点重叠
            current_graph_attrs['splines'] = 'spline' # 曲线更明显
            current_graph_attrs['concentrate'] = 'true' # 集中化，可能有助于中心主题
            # current_graph_attrs['ratio'] = 'auto' # 自动调整图的宽高比

        dot = Digraph(
            comment=os.path.basename(md_filepath),
            graph_attr=current_graph_attrs,
            node_attr={'fontname': self.default_font, 'labeljust': 'l', 'labelloc': 't'}, # 节点文本左对齐，标签顶部
            edge_attr={'fontname': self.default_font} # 边文本字体
        )

        # 添加节点
        for node in nodes_data:
            node_id = node['id']
            # Graphviz 节点标签如果包含 HTML-like 语法，必须用 <...> 包裹
            # 这里我们已经确保 _format_node_text 返回的文本是纯文本或包含 <BR/>
            # 如果要支持 <b><i> 等，需要确保文本是有效的 XML 片段，并用 <...> 包裹整个字符串。
            node_label = f"<{node['text']}>" # 将标签包裹在 <> 中，允许 Graphviz 解析 HTML-like 语法
            node_level = node['level']
            
            node_style_attrs = self.current_node_styles.get(node_level, self.current_node_styles['default']).copy()
            
            # 特定类型的节点样式覆盖或额外属性
            if 'attrs' in node: 
                node_style_attrs.update(node['attrs'])
            
            dot.node(node_id, node_label, **node_style_attrs)

        # 添加边
        for node in nodes_data:
            if node['parent_id']:
                parent_id = node['parent_id']
                child_id = node['id']
                
                edge_style_attrs = self.current_edge_styles.get(node['level'], self.current_edge_styles['default']).copy()
                
                # 如果节点数据中包含 'edge_label'，可以添加到边上
                # edge_label_text = node.get('edge_label', '')
                # dot.edge(parent_id, child_id, label=edge_label_text, **edge_style_attrs)
                dot.edge(parent_id, child_id, **edge_style_attrs)

        # 构建输出文件路径
        base_name = os.path.splitext(os.path.basename(md_filepath))[0]
        output_filepath = os.path.join(self.output_dir, f"{base_name}.{output_format}")

        print(f"正在生成思维导图: '{md_filepath}' (布局: '{layout_engine}', 主题: '{theme}')...")
        try:
            dot.render(output_filepath, view=False, format=output_format)
            print(f"思维导图已保存到: {output_filepath}")
        except Exception as e:
            print(f"渲染思维导图时出错: {e}")
            print("请确保 Graphviz 软件已正确安装，并且其 'dot' 可执行文件已添加到系统的 PATH 环境变量中。")
            print("如果您使用的是 Windows，请在安装时勾选 'Add Graphviz to the system PATH for all users'。")
            print("对于 macOS/Linux，通常通过包管理器安装会自动设置 PATH。")


# --- 使用示例 ---
def batch_convert_pftm_files():
    """
    批量转换 pftm 文件夹中的所有 markdown 文件为思维导图
    """
    import glob
    
    # 初始化转换器，字体将根据操作系统自动推荐
    # 如果您发现中文显示有问题，可以手动指定字体，例如：
    # converter = MarkdownMindMapConverter(default_font="SimHei") # Windows
    # converter = MarkdownMindMapConverter(default_font="PingFang SC") # macOS
    converter = MarkdownMindMapConverter(output_dir="pftm_mindmap_output")
    
    # 获取 pftm 文件夹中的所有 markdown 文件
    pftm_dir = "../pftm"  # 相对于当前脚本位置的 pftm 文件夹
    md_files = glob.glob(os.path.join(pftm_dir, "*.md"))
    
    if not md_files:
        print(f"在 {pftm_dir} 文件夹中未找到 markdown 文件")
        return
    
    print(f"找到 {len(md_files)} 个 markdown 文件，开始转换...")
    
    # 定义不同的输出格式和主题
    formats = ['png']  # 可以改为 ['png', 'pdf'] 来生成多种格式
    themes = ['default', 'radial_bright']
    layouts = ['dot', 'neato']  # 可以尝试不同的布局引擎
    
    success_count = 0
    total_conversions = len(md_files) * len(formats) * len(themes) * len(layouts)
    
    for md_file in sorted(md_files):
        filename = os.path.basename(md_file)
        print(f"\n处理文件: {filename}")
        
        for format_type in formats:
            for theme in themes:
                for layout in layouts:
                    try:
                        print(f"  - 生成 {format_type.upper()} (主题: {theme}, 布局: {layout})")
                        converter.convert(
                            md_filepath=md_file,
                            output_format=format_type,
                            layout_engine=layout,
                            theme=theme
                        )
                        success_count += 1
                    except Exception as e:
                        print(f"  转换失败: {e}")
    
    print(f"\n转换完成! 成功: {success_count}/{total_conversions}")
    print(f"输出文件保存在: {converter.output_dir}")

if __name__ == "__main__":
    batch_convert_pftm_files()