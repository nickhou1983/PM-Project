#!/usr/bin/env python3
"""飞书远程 MCP 调用脚本（Python 版）

相比 Shell 版本，Python 版在处理含特殊字符的 Markdown 内容时更可靠，
使用 json.dumps() 确保 JSON 转义正确，避免 shell 转义导致的请求失败。

用法:
  feishu-mcp.py <method> [tool_name] [arguments_json]
  feishu-mcp.py tools/call <tool_name> --content-file <file> [extra_args_json]
  feishu-mcp.py tools/call create-doc --batch-file <file> --title <title> [--chunk-size 4000]

方法:
  initialize         初始化 MCP 连接
  tools/list         列出可用工具
  tools/call         调用指定工具

示例:
  feishu-mcp.py initialize
  feishu-mcp.py tools/list
  feishu-mcp.py tools/call search-doc '{"query": "编码规范"}'
  feishu-mcp.py tools/call fetch-doc '{"doc_id": "https://xxx.feishu.cn/docx/xxx"}'
  feishu-mcp.py tools/call create-doc '{"title": "PRD", "markdown": "# 内容"}'
  feishu-mcp.py tools/call create-doc --content-file docs/prd.md '{"title": "PRD文档"}'
  feishu-mcp.py tools/call create-doc --batch-file docs/long-doc.md --title "长文档" --chunk-size 4000

环境变量:
  FEISHU_MCP_UAT   User Access Token（用户身份，推荐）
  FEISHU_MCP_TAT   Tenant Access Token（应用身份）
  FEISHU_MCP_TOOLS 允许的工具列表，逗号分隔（可选）
  FEISHU_MCP_DEBUG 设为 1 启用调试输出（可选）
"""

import argparse
import json
import os
import random
import re
import subprocess
import sys
from pathlib import Path

MCP_ENDPOINT = "https://mcp.feishu.cn/mcp"
DEFAULT_TOOLS = "search-doc,fetch-doc,create-doc,update-doc,list-docs,get-comments,add-comments,search-user,get-user,fetch-file"
TOKEN_FILE = Path.home() / ".feishu_mcp_token"


def get_token():
    """获取认证 token，优先级：环境变量 > token 文件"""
    token = os.environ.get("FEISHU_MCP_UAT") or os.environ.get("FEISHU_MCP_TAT")
    if token:
        return token, "UAT" if os.environ.get("FEISHU_MCP_UAT") else "TAT"

    if TOKEN_FILE.exists():
        token = TOKEN_FILE.read_text().strip()
        if token:
            return token, "UAT"

    print("错误: 请设置认证凭证", file=sys.stderr)
    print("  export FEISHU_MCP_UAT='u-xxxxxxxx'  # 用户身份", file=sys.stderr)
    print("  export FEISHU_MCP_TAT='t-xxxxxxxx'  # 应用身份", file=sys.stderr)
    print(f"  或将 token 写入 {TOKEN_FILE}", file=sys.stderr)
    sys.exit(1)


def get_auth_header(token, token_type):
    """构建认证 header"""
    if token_type == "UAT":
        return f"X-Lark-MCP-UAT: {token}"
    return f"X-Lark-MCP-TAT: {token}"


def debug_print(*args, **kwargs):
    """调试输出（仅在 FEISHU_MCP_DEBUG=1 时打印）"""
    if os.environ.get("FEISHU_MCP_DEBUG") == "1":
        print("[DEBUG]", *args, file=sys.stderr, **kwargs)


def call_mcp(method, tool_name=None, arguments=None):
    """调用飞书 MCP API

    Args:
        method: JSON-RPC 方法（initialize, tools/list, tools/call）
        tool_name: 工具名称（仅 tools/call 需要）
        arguments: 工具参数字典（仅 tools/call 需要）

    Returns:
        解析后的 JSON 响应字典
    """
    token, token_type = get_token()
    allowed_tools = os.environ.get("FEISHU_MCP_TOOLS", DEFAULT_TOOLS)
    request_id = random.randint(1, 10000)

    body = {"jsonrpc": "2.0", "id": request_id, "method": method}

    if method == "tools/call":
        if not tool_name:
            print("错误: tools/call 需要指定工具名称", file=sys.stderr)
            sys.exit(1)
        body["params"] = {"name": tool_name, "arguments": arguments or {}}

    body_json = json.dumps(body, ensure_ascii=False)

    debug_print(f"Token type: {token_type}, length: {len(token)}")
    debug_print(f"Body length: {len(body_json)}")
    debug_print(f"Endpoint: {MCP_ENDPOINT}")
    debug_print(f"Tool: {tool_name}, Arguments keys: {list((arguments or {}).keys())}")

    result = subprocess.run(
        [
            "curl", "-sS", "-w", "\n%{http_code}",
            "-X", "POST", MCP_ENDPOINT,
            "-H", "Content-Type: application/json",
            "-H", get_auth_header(token, token_type),
            "-H", f"X-Lark-MCP-Allowed-Tools: {allowed_tools}",
            "-d", body_json,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"curl 执行失败 (exit {result.returncode})", file=sys.stderr)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        sys.exit(1)

    lines = result.stdout.strip().rsplit("\n", 1)
    if len(lines) == 2:
        response_body, http_code = lines
    else:
        response_body = lines[0]
        http_code = "000"

    debug_print(f"HTTP status: {http_code}")

    if http_code.isdigit() and int(http_code) >= 400:
        print(f"HTTP 错误 {http_code}:", file=sys.stderr)
        try:
            print(json.dumps(json.loads(response_body), indent=2, ensure_ascii=False), file=sys.stderr)
        except json.JSONDecodeError:
            print(response_body, file=sys.stderr)
        sys.exit(1)

    try:
        return json.loads(response_body)
    except json.JSONDecodeError:
        print("警告: 响应非 JSON 格式", file=sys.stderr)
        print(response_body)
        sys.exit(1)


def split_by_sections(content, max_chars=4000):
    """按 Markdown 章节拆分内容，每块不超过 max_chars 字符

    优先在 ## 标题处分割，若单个章节超长则在段落处二次分割。
    """
    sections = re.split(r"(?=^## )", content, flags=re.MULTILINE)
    chunks = []
    current = ""

    for section in sections:
        if not section.strip():
            continue
        if len(current) + len(section) <= max_chars:
            current += section
        else:
            if current.strip():
                chunks.append(current)
            if len(section) <= max_chars:
                current = section
            else:
                # 单个章节超长，按段落分割
                paragraphs = section.split("\n\n")
                current = ""
                for para in paragraphs:
                    if len(current) + len(para) + 2 <= max_chars:
                        current += para + "\n\n"
                    else:
                        if current.strip():
                            chunks.append(current)
                        current = para + "\n\n"

    if current.strip():
        chunks.append(current)

    return chunks


def batch_upload(file_path, title, chunk_size=4000, wiki_node=None, folder_token=None):
    """分批上传长文档

    流程：create-doc 创建空文档 → update-doc overwrite 第一批 → append 后续批次

    Args:
        file_path: Markdown 文件路径
        title: 文档标题
        chunk_size: 每批最大字符数
        wiki_node: 知识库节点 token（可选）
        folder_token: 文件夹 token（可选）
    """
    content = Path(file_path).read_text(encoding="utf-8")
    chunks = split_by_sections(content, max_chars=chunk_size)

    print(f"文档总长度: {len(content)} 字符，拆分为 {len(chunks)} 批", file=sys.stderr)

    # 1. 创建空文档
    create_args = {"title": title, "markdown": f"# {title}\n\n（文档上传中...）"}
    if wiki_node:
        create_args["wiki_node"] = wiki_node
    if folder_token:
        create_args["folder_token"] = folder_token

    resp = call_mcp("tools/call", "create-doc", create_args)
    doc_id = extract_doc_id(resp)

    if not doc_id:
        print("错误: 创建文档失败，无法提取 doc_id", file=sys.stderr)
        print(json.dumps(resp, indent=2, ensure_ascii=False))
        sys.exit(1)

    print(f"文档已创建: {doc_id}", file=sys.stderr)

    # 2. 分批写入
    for i, chunk in enumerate(chunks):
        mode = "overwrite" if i == 0 else "append"
        print(f"  写入第 {i + 1}/{len(chunks)} 批 ({len(chunk)} 字符, mode={mode})...", file=sys.stderr)
        resp = call_mcp("tools/call", "update-doc", {
            "doc_id": doc_id,
            "markdown": chunk,
            "mode": mode,
        })
        # 检查是否有错误
        if "error" in resp:
            print(f"  警告: 第 {i + 1} 批写入出错: {resp['error']}", file=sys.stderr)

    print(f"上传完成! doc_id: {doc_id}", file=sys.stderr)
    return resp


def extract_doc_id(response):
    """从 MCP 响应中提取 doc_id"""
    try:
        result = response.get("result", {})
        # tools/call 响应格式: result.content[0].text (JSON string)
        content = result.get("content", [])
        if content:
            text = content[0].get("text", "")
            try:
                data = json.loads(text)
                return data.get("doc_id") or data.get("document", {}).get("document_id")
            except json.JSONDecodeError:
                pass
        # 直接字段
        return result.get("doc_id")
    except (KeyError, IndexError, TypeError):
        return None


def main():
    parser = argparse.ArgumentParser(
        description="飞书远程 MCP 调用工具（Python 版）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("method", choices=["initialize", "tools/list", "tools/call"],
                        help="JSON-RPC 方法")
    parser.add_argument("tool_name", nargs="?", help="工具名称（tools/call 时必填）")
    parser.add_argument("arguments", nargs="?", default="{}",
                        help="工具参数 JSON 字符串")
    parser.add_argument("--content-file", dest="content_file",
                        help="从文件读取内容注入 markdown 字段")
    parser.add_argument("--batch-file", dest="batch_file",
                        help="长文档分批上传模式：指定 Markdown 文件路径")
    parser.add_argument("--title", help="文档标题（--batch-file 模式必填）")
    parser.add_argument("--chunk-size", type=int, default=4000,
                        help="分批上传时每批最大字符数（默认 4000）")
    parser.add_argument("--wiki-node", dest="wiki_node",
                        help="知识库节点 token")
    parser.add_argument("--folder-token", dest="folder_token",
                        help="文件夹 token")

    args = parser.parse_args()

    # 分批上传模式
    if args.batch_file:
        if not args.title:
            print("错误: --batch-file 模式需要 --title 参数", file=sys.stderr)
            sys.exit(1)
        resp = batch_upload(args.batch_file, args.title, args.chunk_size,
                            args.wiki_node, args.folder_token)
        print(json.dumps(resp, indent=2, ensure_ascii=False))
        return

    # 普通调用模式
    arguments = None
    if args.method == "tools/call":
        # 解析参数
        try:
            arguments = json.loads(args.arguments)
        except json.JSONDecodeError as e:
            print(f"错误: 参数 JSON 解析失败: {e}", file=sys.stderr)
            sys.exit(1)

        # --content-file 模式：读取文件内容注入 markdown 字段
        if args.content_file:
            file_path = Path(args.content_file)
            if not file_path.exists():
                print(f"错误: 文件不存在: {args.content_file}", file=sys.stderr)
                sys.exit(1)
            content = file_path.read_text(encoding="utf-8")
            arguments["markdown"] = content
            debug_print(f"从文件读取内容: {len(content)} 字符")

    resp = call_mcp(args.method, args.tool_name, arguments)
    print(json.dumps(resp, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
