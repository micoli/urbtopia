import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("builder", os.path.join(HERE, "..", "watertower-1x1-builder.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

if __name__ == "__main__":
    print(builder.build_tower(out_dir=HERE, tier=3, model_id="watertower-1x1-t3-tone-a", tones={'a': {'vtone1': 'tangerine'}, 'b': {'vtone1': 'sky'}, 'c': {'vtone1': 'uroof'}, 'd': {'vtone1': 'brick'}}))
