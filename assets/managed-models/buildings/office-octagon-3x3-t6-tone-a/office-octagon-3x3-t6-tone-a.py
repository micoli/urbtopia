import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("builder", os.path.join(HERE, "..", "office-octagon-builder.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

if __name__ == "__main__":
    print(builder.build_office(size=3, floors=5, model_id="office-octagon-3x3-t6-tone-a", out_dir=HERE))
