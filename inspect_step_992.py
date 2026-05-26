import json
import os

log_file = r"C:\Users\vitho\.gemini\antigravity\brain\f3e3cf49-89a6-4262-9bea-eab16c1857f7\.system_generated\logs\transcript.jsonl"

with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
    for idx, line in enumerate(f):
        if idx == 992:
            step = json.loads(line)
            print("Step 992 structure keys:", step.keys())
            if "tool_calls" in step:
                for tc in step["tool_calls"]:
                    print("  Tool call name:", tc.get("name"))
                    args = tc.get("args") or {}
                    for k, v in args.items():
                        print(f"    Arg: {k}, type={type(v)}, len={len(str(v))}")
                        if k == "CodeContent":
                            print("      First 200 chars:", str(v)[:200])
                            print("      Last 200 chars:", str(v)[-200:])
                            # Write it directly to see if it contains truncated markers
                            with open("step_992_code.java", "w", encoding="utf-8") as out:
                                out.write(v)
                            print("      Saved to step_992_code.java")
            break
