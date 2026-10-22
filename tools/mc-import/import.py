"""MC -> SH blueprint import. Reads a Minecraft world/region via Amulet-Core,
maps blocks through mc_to_sh.json, emits SH blueprint JSON (never writes the live DB).

Usage: python import.py <world_dir> --out blueprint.json
Requires: amulet-core (pip install amulet-core)
"""
import json
import sys
from pathlib import Path

def main() -> None:
    world_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    args = sys.argv[2:]
    out_path = Path('blueprint.json')
    if '--out' in args:
        out_path = Path(args[args.index('--out') + 1])
    mapping = json.loads(Path(__file__).with_name('mc_to_sh.json').read_text())
    stats = {'mapped': {}, 'unknown': {}}
    cells = {}
    if world_dir:
        try:
            from amulet import load_level  # Amulet-Core world API
            level = load_level(str(world_dir))
            # Sample the overworld surface into the 20x20 SH grid.
            for gx in range(20):
                for gz in range(20):
                    try:
                        block = level.get_version_block(0, 0, gx, 64, gz, 'minecraft:overworld')[0]
                        name = getattr(getattr(block, 'base_name', ''), '__str__', lambda: str(block))()
                    except Exception:
                        name = 'unknown'
                    mapped = mapping.get(name, mapping.get('__default__', 'sh:ignore'))
                    stats['mapped' if mapped != 'sh:ignore' else 'unknown'][name] = \
                        stats['mapped' if mapped != 'sh:ignore' else 'unknown'].get(name, 0) + 1
                    if mapped != 'sh:ignore':
                        cells[f'{gx},{gz}'] = mapped
            level.close()
        except ImportError:
            print('amulet-core not installed; emitting empty blueprint template.', file=sys.stderr)
    blueprint = {'version': 1, 'mapping_version': mapping.get('__version__', '0.1.0'), 'cells': cells}
    out_path.write_text(json.dumps({'blueprint': blueprint, 'report': stats}, indent=2))
    print(f'wrote {out_path}: {sum(stats["mapped"].values())} mapped, {sum(stats["unknown"].values())} unknown')

if __name__ == '__main__':
    main()
