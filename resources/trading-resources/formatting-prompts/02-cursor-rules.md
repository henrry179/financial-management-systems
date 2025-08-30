# 双语格式化标准提示词 / Bilingual Formatting Standards Prompt

## 目的 / Purpose
本提示词用于将文档内容更新为统一的中英双语格式标准。  
This prompt is used to update document content to a unified Chinese-English bilingual format standard.

## 格式要求 / Format Requirements

### 1. 主标题格式 / Main Title Format
- 使用 `### 数字` 作为主标题  
  Use `### Number` as the main title
- 示例 / Example: `### 01`, `### 02`, `### 03`

### 2. 章节标题格式 / Section Title Format
- 使用 `**数字. 英文标题 / 中文标题**` 的粗体双语格式  
  Use bold bilingual format `**Number. English Title / Chinese Title**`
- 示例 / Example: `**1. Introduction / 介绍**`

### 3. 层级编号系统 / Hierarchical Numbering System
- 一级标题 / Level 1: `**1. Title / 标题**`
- 二级标题 / Level 2: `**1.1 Subtitle / 副标题**`
- 三级标题 / Level 3: `**1.1.1 Sub-subtitle / 子副标题**`
- 四级标题 / Level 4: `**1.1.1.1 Detail / 详细**`

### 4. 内容格式 / Content Format
- 每个条目包含：英文内容 / 中文翻译  
  Each entry contains: English content / Chinese translation
- 使用斜杠 `/` 分隔英文和中文内容  
  Use slash `/` to separate English and Chinese content
- 示例 / Example: 
  - `Full-time traders working at investment banks or hedge funds. / 在投资银行或对冲基金工作的全职交易者。`

### 5. 列表格式 / List Format
- 使用 `-` 符号创建无序列表  
  Use `-` symbol to create unordered lists
- 保持英文 / 中文的双语格式  
  Maintain English / Chinese bilingual format
- 适当缩进以显示层级关系  
  Proper indentation to show hierarchical relationships

## 转换示例 / Conversion Example

### 原始格式 / Original Format:
```markdown
### 01. Professional Traders VS Retail Traders 101
- **Introduction**
    - Objective: Provide a framework for retail traders
    - Challenges: Differences in lives and infrastructure
```

### 转换后格式 / Converted Format:
```markdown
### 01

**1. Introduction / 介绍**
- Objective: Provide a framework for retail traders to emulate consistently profitable professional traders. / 目标：为散户交易者提供一个框架，以模仿持续盈利的专业交易者。
- Challenges: Differences in lives and infrastructure between professional and retail traders. / 挑战：专业交易者和散户交易者在生活和基础设施方面的差异。
```

## 应用指南 / Application Guide

### 步骤 1：识别结构 / Step 1: Identify Structure
- 识别文档的主要章节和子章节  
  Identify main sections and subsections in the document
- 确定适当的层级编号  
  Determine appropriate hierarchical numbering

### 步骤 2：转换标题 / Step 2: Convert Titles
- 将所有标题转换为双语粗体格式  
  Convert all titles to bilingual bold format
- 添加层级编号  
  Add hierarchical numbers

### 步骤 3：翻译内容 / Step 3: Translate Content
- 为每个英文条目添加中文翻译  
  Add Chinese translation for each English entry
- 保持专业术语的准确性  
  Maintain accuracy of professional terminology

### 步骤 4：格式化列表 / Step 4: Format Lists
- 确保所有列表项使用 `-` 符号  
  Ensure all list items use `-` symbol
- 保持一致的缩进  
  Maintain consistent indentation

### 步骤 5：检查一致性 / Step 5: Check Consistency
- 检查所有编号是否连续  
  Check if all numbers are sequential
- 确保格式统一  
  Ensure uniform formatting

## 注意事项 / Notes

1. **保持原意 / Preserve Original Meaning**
   - 翻译时保持原文的准确含义  
     Maintain accurate meaning when translating
   - 专业术语使用行业标准翻译  
     Use industry-standard translations for professional terms

2. **格式一致性 / Format Consistency**
   - 所有同级标题使用相同的格式  
     Use same format for all titles at the same level
   - 标点符号保持一致  
     Keep punctuation consistent

3. **可读性 / Readability**
   - 适当使用空行分隔不同章节  
     Use blank lines appropriately to separate sections
   - 保持清晰的视觉层次  
     Maintain clear visual hierarchy

## 常用专业术语对照 / Common Professional Terms

| English | 中文 |
|---------|------|
| Professional Traders | 专业交易者 |
| Retail Traders | 散户交易者 |
| Portfolio Management | 投资组合管理 |
| Risk Management | 风险管理 |
| Volatility | 波动率 |
| Returns | 回报 |
| Distribution | 分布 |
| Correlation | 相关性 |
| Diversification | 多元化 |
| Leverage | 杠杆 |
| Options | 期权 |
| Hedge Fund | 对冲基金 |
| Investment Bank | 投资银行 |
| Market Making | 做市 |
| Proprietary Trading | 自营交易 |

## 使用方法 / How to Use

1. **准备工作 / Preparation**
   - 备份原始文件 / Backup original files
   - 确定需要转换的文件列表 / Identify files to be converted

2. **执行转换 / Execute Conversion**
   - 按照上述格式要求逐个转换文件 / Convert files one by one according to format requirements
   - 使用此提示词作为参考指南 / Use this prompt as reference guide

3. **质量检查 / Quality Check**
   - 检查格式一致性 / Check format consistency
   - 验证翻译准确性 / Verify translation accuracy
   - 确保层级结构正确 / Ensure hierarchical structure is correct

4. **文件合并 / File Merging**
   - 完成所有单个文件的双语格式化后，将它们合并成一个统一的文档。/ After completing the bilingual formatting for all individual files, merge them into a single, unified document.
   - 确保合并时文件按正确的顺序排列，以保持内容的逻辑连贯性。/ Ensure the files are merged in the correct order to maintain the logical flow of the content.

5. **经济数据指标汇总 / Economic Data Indicators Summary**
   - 在合并后的文件中，识别所有提及的经济数据指标。/ In the merged file, identify all mentioned economic data indicators.
   - 创建一个表格，将这些指标单独展示，以便查阅。/ Create a table to display these indicators separately for easy reference.

---

本提示词可用于任何需要中英双语格式化的文档。遵循这些标准可以确保文档具有专业、一致和易读的格式。

This prompt can be used for any document requiring Chinese-English bilingual formatting. Following these standards ensures documents have a professional, consistent, and readable format. 