import requests
import json
import os
import sys
import base64

sys.stdout.reconfigure(encoding='utf-8')

def get_auth_header():
    config_path = os.path.expanduser(r"~\.gemini\config\mcp_config.json")
    with open(config_path, "r") as f:
        config = json.load(f)
    return config["mcpServers"]["mnema"]["headers"]["Authorization"]

DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mnema_docs")

docs_to_upload = [
    {
        "path": os.path.join(DOCS_DIR, "Gen_UI_System_Architecture_and_Overview.md"),
        "folder_id": "b025205e-7c9f-4806-a44f-7c507960d563",
        "filename": "Gen_UI_System_Architecture_and_Overview.docx"
    },
    {
        "path": os.path.join(DOCS_DIR, "Gen_UI_Generative_UI_Engine_and_Component_Registry.md"),
        "folder_id": "b025205e-7c9f-4806-a44f-7c507960d563",
        "filename": "Gen_UI_Generative_UI_Engine_and_Component_Registry.docx"
    },
    {
        "path": os.path.join(DOCS_DIR, "Gen_UI_API_Key_Vault_and_Proxy_Security.md"),
        "folder_id": "b025205e-7c9f-4806-a44f-7c507960d563",
        "filename": "Gen_UI_API_Key_Vault_and_Proxy_Security.docx"
    },
    {
        "path": os.path.join(DOCS_DIR, "Gen_UI_Database_Schema_and_Data_Models.md"),
        "folder_id": "b025205e-7c9f-4806-a44f-7c507960d563",
        "filename": "Gen_UI_Database_Schema_and_Data_Models.docx"
    },
    {
        "path": os.path.join(DOCS_DIR, "Gen_UI_Architectural_Decisions_Log.md"),
        "folder_id": "d78b1bdb-5d76-4a92-a753-6a7acf608c8d",
        "filename": "Gen_UI_Architectural_Decisions_Log.docx"
    },
    {
        "path": os.path.join(DOCS_DIR, "Gen_UI_Master_Build_Spec_and_Deployment.md"),
        "folder_id": "79db8f07-d035-4105-9310-64e22307fd20",
        "filename": "Gen_UI_Master_Build_Spec_and_Deployment.docx"
    }
]

def main():
    url = "https://api.theboringpeople.in/mcp"
    try:
        auth_header = get_auth_header()
    except Exception as e:
        print(f"Failed to read mcp_config.json: {e}")
        return

    headers = {
        "Authorization": auth_header,
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json"
    }

    for idx, item in enumerate(docs_to_upload):
        path = item["path"]
        folder_id = item["folder_id"]
        filename = item["filename"]

        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue

        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")

        payload = {
            "jsonrpc": "2.0",
            "id": idx + 1,
            "method": "tools/call",
            "params": {
                "name": "upload_doc_file",
                "arguments": {
                    "filename": filename,
                    "content_base64": b64,
                    "folder_id": folder_id
                }
            }
        }

        print(f"Uploading {filename} to folder {folder_id}...")
        r = requests.post(url, headers=headers, json=payload)
        print(f"Status: {r.status_code}")
        print(r.text)
        print("-" * 50)

if __name__ == "__main__":
    main()
