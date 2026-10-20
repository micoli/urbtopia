import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("builder", os.path.join(HERE, "..", "office-octagon-builder.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

if __name__ == "__main__":
    print(builder.build_office(size=2, floors=4, model_id="office-octagon-2x2-t3-tone-a", out_dir=HERE))
