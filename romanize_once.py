#!/usr/bin/env python3
"""One-shot romanizer: reads JSON from stdin, writes JSON to stdout."""
import sys, json, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import romanize
    data = json.loads(sys.stdin.read())
    name = data.get('name', '')
    result = romanize.translate_name(name)
    print(json.dumps({'ok': True, 'result': result}))
except Exception as e:
    print(json.dumps({'ok': False, 'error': str(e)}))
