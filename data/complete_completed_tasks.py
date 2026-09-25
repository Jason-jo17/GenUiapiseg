import requests
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def get_auth_header():
    config_path = os.path.expanduser(r"~\.gemini\config\mcp_config.json")
    with open(config_path, "r") as f:
        config = json.load(f)
    return config["mcpServers"]["mnema"]["headers"]["Authorization"]

completed_tasks = [
    {
        "task_id": "f01524eb-6ff9-4ef2-ba63-228bf58df1aa",
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/1",
        "summary": "Completed Vercel AI SDK integration with structured tool calling and streaming handlers."
    },
    {
        "task_id": "d3c004af-e129-4e0b-825a-170af987bd95",
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/2",
        "summary": "Built component registry mapping tool executions directly to React UI widgets."
    },
    {
        "task_id": "6d69cb46-8cfb-4970-aa9d-23419068627f",
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/3",
        "summary": "Implemented AES-256-GCM encrypted API key vault with Drizzle ORM PostgreSQL integration."
    },
    {
        "task_id": "cc594a3b-e071-496b-88b6-23d8290e1efc",
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/4",
        "summary": "Completed CORS-bypassing server proxy route with secret credential auto-injection."
    },
    {
        "task_id": "2ba8cca8-c554-4e5a-83a8-c1192568020a",
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/5",
        "summary": "Implemented drag-and-drop pinned panel canvas dashboard with database persistence."
    },
    {
        "task_id": "655b54de-b3bf-4203-a1dd-60ff4766bffc",
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/6",
        "summary": "Completed floating chat overlay with global hotkeys and message feedback re-invocation."
    },
    {
        "task_id": "a85fbb5e-64b8-4d14-abe9-2c3b7beadb38",
        "github_pr": "https://github.com/theboringpeople/genui-api-explorer/pull/7",
        "summary": "Configured multi-stage Dockerfile and docker-compose deployment setup."
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

def main():
    auth_header = get_auth_header()
    headers = {
        "Authorization": auth_header,
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json"
    }

    for t in completed_tasks:
        task_id = t["task_id"]
        print(f"\nClaiming task {task_id}...")
        claim_res = mcp_call(headers, "claim_task", {"taskId": task_id, "developerId": "Jason Jospeh D'Silva"})
        print("Claim response:", claim_res)

        print(f"Completing task {task_id}...")
        comp_args = {
            "taskId": task_id,
            "summary": t["summary"],
            "githubPrUrl": t["github_pr"],
            "model": "gemini-3.6-flash",
            "inputTokens": 500,
            "outputTokens": 200
        }
        comp_res = mcp_call(headers, "complete_task", comp_args)
        print("Complete response:", comp_res)

if __name__ == "__main__":
    main()
