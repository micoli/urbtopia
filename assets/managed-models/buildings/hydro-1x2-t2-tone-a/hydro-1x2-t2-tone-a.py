import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("builder", os.path.join(HERE, "..", "hydro-1x2-builder.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

if __name__ == "__main__":
    print(builder.build_plant(out_dir=HERE, tier=2, model_id="hydro-1x2-t2-tone-a", tones={'a': {'vtone1': 'coral'}, 'b': {'vtone1': 'sky'}, 'c': {'vtone1': 'uroof'}, 'd': {'vtone1': 'tangerine'}}))
