import requests
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ID = "3faa2c4d-0501-4803-b3f9-7b64e63183b3" # Gen Ui

DOC_IDS = {
    "architecture": "0e029c7b-46ee-45b0-8cdf-9941f9a8a406",
    "registry": "45d3543e-dfa4-4df8-8c3c-62d051f8f8ee",
    "key_vault": "1d50b7b8-ccfd-49e8-87f3-1946399a46e8",
    "db_schema": "6285dc6e-d775-407a-8874-a11b81bf2da8",
    "decisions": "d5e04b65-bdbf-49f9-981c-16dbc25ee536",
    "deployment": "20396658-8792-4172-a085-5ff02c978b18"
}

def get_auth_header():
    config_path = os.path.expanduser(r"~\.gemini\config\mcp_config.json")
    with open(config_path, "r") as f:
        config = json.load(f)
    return config["mcpServers"]["mnema"]["headers"]["Authorization"]

tasks_data = [
    # --- COMPLETED TASKS (done) ---
    {
        "title": "[Core Engine] Vercel AI SDK Integration & Tool Calling Engine",
        "description": "Integrated Vercel AI SDK (`ai` v4.3.15) into Next.js 15 App Router (`/api/chat/route.ts`). Defined structured Zod tool schemas (`search_apis`, `get_api_details`, `try_api`, `show_keys`, `fetch_data`, `list_categories`, `explain`) for interactive Generative UI tool invocation.",
        "priority": "critical",
        "sprint": "Sprint 1 - Core AI Engine & Registry",
        "doc_id": DOC_IDS["architecture"],
        "is_done": True,
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/1",
        "summary": "Completed Vercel AI SDK integration with structured tool calling and streaming handlers."
    },
    {
        "title": "[Component Registry] Deterministic Generative UI Renderer & Widget Suite",
        "description": "Implemented `COMPONENT_REGISTRY` (`src/components/registry/index.ts`) mapping AI tool names directly to stateful React widgets (`ApiCard`, `SetupGuideCard`, `ApiTryItPanel`, `KeyVaultCard`, `FetchDataRenderer`, `CategoryGrid`, `MarkdownPanel`, `DataTable`, `JsonViewer`, `ErrorCard`). Wrapped all tool component invocations with React Error Boundaries.",
        "priority": "critical",
        "sprint": "Sprint 1 - Core AI Engine & Registry",
        "doc_id": DOC_IDS["registry"],
        "is_done": True,
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/2",
        "summary": "Built component registry mapping tool executions directly to React UI widgets."
    },
    {
        "title": "[Security & Vault] Encrypted API Key Storage & AES-256-GCM Vault Subsystem",
        "description": "Built Drizzle ORM schema for PostgreSQL (`api_keys` table). Implemented AES-256-GCM symmetric encryption in `src/lib/crypto.ts` with IV and Auth Tag storage. Added `/api/keys` endpoint for key lifecycle management and connectivity testing.",
        "priority": "high",
        "sprint": "Sprint 2 - Key Vault & Security Proxy",
        "doc_id": DOC_IDS["key_vault"],
        "is_done": True,
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/3",
        "summary": "Implemented AES-256-GCM encrypted API key vault with Drizzle ORM PostgreSQL integration."
    },
    {
        "title": "[API Layer] Implement Secure Server-side CORS Proxy Handler (/api/proxy)",
        "description": "Built server-side HTTP proxy endpoint `/api/proxy` supporting GET, POST, PUT, DELETE operations. Auto-injects encrypted credentials server-side without exposing raw secret keys to client browser or front-end JS. Includes latency timing and CORS header stripping.",
        "priority": "high",
        "sprint": "Sprint 2 - Key Vault & Security Proxy",
        "doc_id": DOC_IDS["key_vault"],
        "is_done": True,
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/4",
        "summary": "Completed CORS-bypassing server proxy route with secret credential auto-injection."
    },
    {
        "title": "[Interactive Canvas] Pinned Dashboard Panels & Customizable Workspace",
        "description": "Implemented `pinned_panels` table schema and `/api/pinned` CRUD endpoints. Enabled users to pin interactive GenUI widgets directly to their customizable workspace dashboard canvas (`/dashboard`) with dynamic position (X/Y) and sizing metadata.",
        "priority": "medium",
        "sprint": "Sprint 3 - Workspace Dashboard & Canvas",
        "doc_id": DOC_IDS["db_schema"],
        "is_done": True,
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/5",
        "summary": "Implemented drag-and-drop pinned panel canvas dashboard with database persistence."
    },
    {
        "title": "[AI UX] Floating Chat Overlay, Hotkey Listener & Interactive Feedback System",
        "description": "Built `ChatOverlay.tsx` with floating toggle button and `Ctrl+Shift+Space` global hotkey listener (`GlobalKeyboardListener.tsx`). Integrated `FeedbackBar.tsx` for user thumbs up/down rating and instant self-correction prompt injection.",
        "priority": "high",
        "sprint": "Sprint 3 - Workspace Dashboard & Canvas",
        "doc_id": DOC_IDS["decisions"],
        "is_done": True,
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/6",
        "summary": "Completed floating chat overlay with global hotkeys and message feedback re-invocation."
    },
    {
        "title": "[DevOps & Deployment] Multi-stage Docker Containerization & Docker-Compose",
        "description": "Created production multi-stage `Dockerfile` and `docker-compose.yml` orchestrating PostgreSQL 16 container, Drizzle ORM migration scripts, and Next.js server container.",
        "priority": "medium",
        "sprint": "Sprint 4 - Infrastructure & Operations",
        "doc_id": DOC_IDS["deployment"],
        "is_done": True,
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/7",
        "summary": "Configured multi-stage Dockerfile and docker-compose deployment setup."
    },

    # --- BACKLOG TASKS (backlog) ---
    {
        "title": "[Backlog] Multi-Model Selector & Dynamic LLM Provider Switcher",
        "description": "Implement dynamic model picker in Chat Overlay header allowing users to switch seamlessly between Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, and Google Gemini 1.5 Pro.",
        "priority": "high",
        "sprint": "Sprint 5 - Advanced AI Features & Integrations",
        "doc_id": DOC_IDS["architecture"],
        "is_done": False
    },
    {
        "title": "[Backlog] OpenAPI / Swagger Spec Importer & Auto Component Generator",
        "description": "Build spec parser allowing users to import any OpenAPI/Swagger JSON or YAML file to auto-generate Zod tool definitions and interactive Generative UI widgets on the fly.",
        "priority": "high",
        "sprint": "Sprint 5 - Advanced AI Features & Integrations",
        "doc_id": DOC_IDS["registry"],
        "is_done": False
    },
    {
        "title": "[Backlog] Dynamic Charting & Data Visualization Component (Recharts)",
        "description": "Enhance `FetchDataRenderer` with automatic chart type detection (LineChart, BarChart, PieChart) using Recharts when API response data contains numerical time-series or categorical metrics.",
        "priority": "medium",
        "sprint": "Sprint 6 - Visualization & Analytics",
        "doc_id": DOC_IDS["registry"],
        "is_done": False
    },
    {
        "title": "[Backlog] Rate Limiting & Quota Management using Upstash Redis",
        "description": "Integrate `@upstash/ratelimit` middleware into `/api/chat` and `/api/proxy` to prevent API key abuse, set per-user hourly request quotas, and prevent service overload.",
        "priority": "high",
        "sprint": "Sprint 6 - Visualization & Analytics",
        "doc_id": DOC_IDS["key_vault"],
        "is_done": False
    },
    {
        "title": "[Backlog] Background Cron Health Checker for Stored API Keys",
        "description": "Build scheduled background cron job to periodically test all active keys in the Key Vault and notify users if any third-party API key has been revoked or expired.",
        "priority": "medium",
        "sprint": "Sprint 7 - Monitoring & Sharing",
        "doc_id": DOC_IDS["key_vault"],
        "is_done": False
    },
    {
        "title": "[Backlog] Export & Share Pinned Workspace Dashboards via Public URLs",
        "description": "Enable users to generate read-only public URL snapshots of their pinned dashboard widgets and API exploration panels for team collaboration.",
        "priority": "low",
        "sprint": "Sprint 7 - Monitoring & Sharing",
        "doc_id": DOC_IDS["db_schema"],
        "is_done": False
    }
]

def mcp_call(headers, method_name, args):
    url = "https://api.theboringpeople.in/mcp"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": method_name,
            "arguments": args
        }
    }
    res = requests.post(url, headers=headers, json=payload)
    try:
        return res.json()
    except Exception as e:
        print(f"Error parsing JSON: {e}, Response: {res.text}")
        return None

def extract_task_id(res):
    if not res or "result" not in res:
        return None
    content = res["result"].get("content", [])
    for c in content:
        text = c.get("text", "")
        if "Created task" in text:
            # Format: Created task "..." (id: UUID)
            if "id: " in text:
                return text.split("id: ")[1].split(")")[0].strip()
        # Alternatively structured content
        sc = res["result"].get("structuredContent")
        if sc and isinstance(sc, dict) and "id" in sc:
            return sc["id"]
        if sc and isinstance(sc, dict) and "task" in sc and "id" in sc["task"]:
            return sc["task"]["id"]
    return None

def main():
    auth_header = get_auth_header()
    headers = {
        "Authorization": auth_header,
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json"
    }

    print("Starting task creation for Gen UI project...")

    for task in tasks_data:
        print(f"\n--- Creating Task: {task['title']} ---")
        create_args = {
            "project_id": PROJECT_ID,
            "title": task["title"],
            "description": task["description"],
            "priority": task["priority"],
            "sprint": task["sprint"],
            "doc_id": task["doc_id"]
        }

        res = mcp_call(headers, "create_task", create_args)
        print("Create response:", res)

        task_id = extract_task_id(res)

        if task_id and task["is_done"]:
            print(f"Claiming task {task_id}...")
            claim_res = mcp_call(headers, "claim_task", {"taskId": task_id, "developerId": "Jason Jospeh D'Silva"})
            print("Claim response:", claim_res)

            print(f"Completing task {task_id}...")
            comp_args = {
                "taskId": task_id,
                "summary": task["summary"],
                "githubPrUrl": task["github_pr"],
                "model": "gemini-3.6-flash",
                "inputTokens": 500,
                "outputTokens": 200
            }
            comp_res = mcp_call(headers, "complete_task", comp_args)
            print("Complete response:", comp_res)

if __name__ == "__main__":
    main()
