#!/usr/bin/env python3
"""
飞书 MCP 编码规范同步脚本

通过飞书 MCP Server 读取飞书文档中的编码规范，
并更新本地 references/ 目录下的规范文件。

前置条件：
  - 已配置飞书 MCP Server（需要 Lark/Feishu Open API 凭证）
  - 在 .claude/settings.json 或 MCP 配置中注册了飞书 MCP

使用方法：
  由 Claude 在 Skill 触发时自动调用，或手动执行：
  python3 scripts/sync_from_feishu.py --doc-id <飞书文档ID> --output <输出文件路径>
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime


def get_skill_root() -> Path:
    """获取 skill 根目录"""
    return Path(__file__).parent.parent


def create_sync_config(doc_ids: dict[str, str], output_dir: Path) -> dict:
    """
    创建同步配置。

    参数:
        doc_ids: 飞书文档 ID 到本地文件名的映射
                 示例: {"doccnXXXXX": "general.md", "doccnYYYYY": "frontend.md"}
        output_dir: 输出目录路径

    返回:
        同步配置字典
    """
    return {
        "version": "1.0",
        "last_sync": None,
        "documents": [
            {
                "feishu_doc_id": doc_id,
                "local_file": str(output_dir / filename),
                "last_updated": None,
            }
            for doc_id, filename in doc_ids.items()
        ],
    }


def load_sync_state(config_path: Path) -> dict | None:
    """加载同步状态"""
    if config_path.exists():
        return json.loads(config_path.read_text(encoding="utf-8"))
    return None


def save_sync_state(config_path: Path, state: dict) -> None:
    """保存同步状态"""
    state["last_sync"] = datetime.now().isoformat()
    config_path.write_text(
        json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def sync_document_via_mcp(doc_id: str, output_path: Path) -> bool:
    """
    通过飞书 MCP 同步单个文档。

    此函数生成 MCP 调用指令供 Claude 执行。
    实际的 MCP 调用由 Claude 运行时完成。

    参数:
        doc_id: 飞书文档 ID
        output_path: 本地输出文件路径

    返回:
        是否生成了有效的同步指令
    """
    # 生成 MCP 调用指令（JSON 格式）
    mcp_instruction = {
        "action": "feishu_read_document",
        "params": {
            "document_id": doc_id,
            "format": "markdown",
        },
        "output": str(output_path),
    }

    print(f"📋 MCP 同步指令:")
    print(json.dumps(mcp_instruction, indent=2, ensure_ascii=False))
    print(f"   目标文件: {output_path}")
    return True


def generate_mcp_workflow(doc_ids: dict[str, str]) -> str:
    """
    生成供 Claude 执行的 MCP 工作流指令。

    当 Claude 运行此脚本时，输出的工作流描述可以指导
    Claude 使用飞书 MCP 工具完成实际的文档同步。
    """
    workflow = []
    workflow.append("=" * 60)
    workflow.append("飞书编码规范同步工作流")
    workflow.append("=" * 60)
    workflow.append("")

    for i, (doc_id, filename) in enumerate(doc_ids.items(), 1):
        workflow.append(f"步骤 {i}: 同步 {filename}")
        workflow.append(f"  1. 调用飞书 MCP 的 read_document 工具")
        workflow.append(f"     - document_id: {doc_id}")
        workflow.append(f"     - format: markdown")
        workflow.append(f"  2. 将返回的内容写入 references/{filename}")
        workflow.append(f"  3. 验证文件内容格式正确")
        workflow.append("")

    workflow.append("完成后更新 sync_state.json 中的时间戳。")
    return "\n".join(workflow)


def main():
    parser = argparse.ArgumentParser(
        description="通过飞书 MCP 同步编码规范文档"
    )
    parser.add_argument(
        "--doc-id",
        type=str,
        help="飞书文档 ID",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="输出文件路径（相对于 references/ 目录）",
    )
    parser.add_argument(
        "--config",
        type=str,
        help="同步配置文件路径（JSON，包含多个文档映射）",
    )
    parser.add_argument(
        "--init-config",
        action="store_true",
        help="生成示例同步配置文件",
    )

    args = parser.parse_args()
    skill_root = get_skill_root()
    references_dir = skill_root / "references"
    config_path = skill_root / "sync_state.json"

    if args.init_config:
        # 生成示例配置
        example_config = create_sync_config(
            {
                "REPLACE_WITH_DOC_ID_1": "general.md",
                "REPLACE_WITH_DOC_ID_2": "frontend.md",
                "REPLACE_WITH_DOC_ID_3": "backend.md",
            },
            references_dir,
        )
        config_path.write_text(
            json.dumps(example_config, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"✅ 示例配置已生成: {config_path}")
        print("   请编辑配置文件，填入实际的飞书文档 ID。")
        return

    if args.config:
        # 从配置文件批量同步
        config = json.loads(Path(args.config).read_text(encoding="utf-8"))
        doc_mapping = {
            doc["feishu_doc_id"]: Path(doc["local_file"]).name
            for doc in config["documents"]
        }
        print(generate_mcp_workflow(doc_mapping))

        for doc in config["documents"]:
            output_path = Path(doc["local_file"])
            sync_document_via_mcp(doc["feishu_doc_id"], output_path)

        save_sync_state(config_path, config)
        print(f"\n✅ 同步状态已更新: {config_path}")

    elif args.doc_id and args.output:
        # 单文档同步
        output_path = references_dir / args.output
        print(generate_mcp_workflow({args.doc_id: args.output}))
        sync_document_via_mcp(args.doc_id, output_path)

        # 更新状态
        state = load_sync_state(config_path) or create_sync_config({}, references_dir)
        state["documents"].append(
            {
                "feishu_doc_id": args.doc_id,
                "local_file": str(output_path),
                "last_updated": datetime.now().isoformat(),
            }
        )
        save_sync_state(config_path, state)
    else:
        parser.print_help()
        print("\n示例:")
        print("  # 初始化配置文件")
        print("  python3 scripts/sync_from_feishu.py --init-config")
        print("  # 同步单个文档")
        print(
            "  python3 scripts/sync_from_feishu.py --doc-id doccnXXX --output general.md"
        )
        print("  # 批量同步")
        print("  python3 scripts/sync_from_feishu.py --config sync_state.json")
        sys.exit(1)


if __name__ == "__main__":
    main()
