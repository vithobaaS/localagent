import os
import re

scratch_dir = r"C:\Users\vitho\.gemini\antigravity\brain\f3e3cf49-89a6-4262-9bea-eab16c1857f7\scratch"
line_coverage = {}

for f in os.listdir(scratch_dir):
    if f.startswith("recovered_JavaFXApp_step_") and f.endswith(".txt"):
        fp = os.path.join(scratch_dir, f)
        with open(fp, "r", encoding="utf-8", errors="ignore") as file_obj:
            lines = file_obj.read().splitlines()
        
        # We need to find untruncated ranges. A line is valid if it starts with "<number>:" and doesn't contain truncation.
        # However, the truncation block itself is represented by a line containing "<truncated" or similar.
        in_truncation = False
        for line in lines:
            if "truncated" in line or "<truncated" in line:
                continue
            m = re.match(r"^\s*(\d+):\s*(.*)", line)
            if m:
                line_num = int(m.group(1))
                content = m.group(2)
                # Let's save this line
                if line_num not in line_coverage:
                    line_coverage[line_num] = []
                line_coverage[line_num].append((f, content))

print("Total unique lines covered:", len(line_coverage))
if line_coverage:
    min_line = min(line_coverage.keys())
    max_line = max(line_coverage.keys())
    print(f"Range: {min_line} to {max_line}")
    
    missing = []
    for l in range(min_line, max_line + 1):
        if l not in line_coverage:
            missing.append(l)
            
    print("Number of missing lines:", len(missing))
    if missing:
        # Group missing lines into ranges
        ranges = []
        start = missing[0]
        prev = missing[0]
        for m_line in missing[1:]:
            if m_line == prev + 1:
                prev = m_line
            else:
                ranges.append((start, prev))
                start = m_line
                prev = m_line
        ranges.append((start, prev))
        print("Missing line ranges:", ranges)
