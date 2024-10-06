from flask import Flask, request, jsonify, send_file, make_response
from werkzeug.utils import secure_filename
from functools import wraps
import os
from PIL import Image
from io import BytesIO
import base64
from lida import Manager, llm, TextGenerationConfig
import matplotlib
import pandas as pd
from dotenv import load_dotenv
from flask_cors import CORS
import traceback
import csv

# 加载 .env 文件
load_dotenv()

# 获取 API 密钥
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# 设置 OpenAI API 密钥
os.environ['OPENAI_API_KEY'] = openai_api_key


# CORS Setup
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:8080"}})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:8080')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


matplotlib.use('Agg')


app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

lida = Manager(text_gen=llm("openai"))



def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://127.0.0.1:8080'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

def cors_enabled(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.method == 'OPTIONS':
            resp = make_response()
            add_cors_headers(resp)
            return resp
        return add_cors_headers(f(*args, **kwargs))
    return wrapper

@app.route('/generate_summary', methods=['OPTIONS'])
def handle_options_request():
    response = app.make_default_options_response()
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response

@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        data = pd.read_csv(filepath)

        summary = lida.summarize(filepath)
        goals = lida.goals(summary, n=2)

        return jsonify({'summary': summary, 'goals': goals}), 200

    return jsonify({'error': 'Invalid file type, only CSV allowed'}), 400

@app.route('/generate_image', methods=['POST'])
def generate_image():
    instruction = request.form.get('instruction')
    user_query = request.form.get('user_query')
    # if not instruction or not user_query:
    #     return jsonify({'error': 'Instruction and user query are required'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # data = pd.read_csv(filepath)

        textgen_config = TextGenerationConfig(n=1, temperature=0.2, use_cache=True)
        summary = lida.summarize(filepath,textgen_config=textgen_config, summary_method="default")
        goals = lida.goals(summary, n=2, textgen_config=textgen_config)

        if user_query:
            charts = lida.visualize(summary=summary, goal=user_query)
        else:
            charts = lida.visualize(summary=summary, goal=goals[0])

        if instruction:
            charts = lida.edit(code=charts[0].code, summary=summary, instructions=instruction, textgen_config=textgen_config)

        raster_base64 = charts[0].raster
        raster_bytes = base64.b64decode(raster_base64)
        image = Image.open(BytesIO(raster_bytes))
        
        temp_image_path = os.path.join(app.config['UPLOAD_FOLDER'], "chart_image.png")
        image.save(temp_image_path)
        
        return send_file(temp_image_path, mimetype='image/png')

    return jsonify({'error': 'Invalid file type, only CSV files are allowed'}), 400


@app.route('/read_csv_header', methods=['POST'])
def read_csv_header():
    data = request.json
    file_path = data.get('file_path')
    
    if not file_path:
        return jsonify({'error': 'No file path provided'}), 400
    
    try:
        df = pd.read_csv(file_path, nrows=0)
        header = df.columns.tolist()
        return jsonify({'header': header})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/run_python_code', methods=['POST'])
def run_python_code():
    file_path = request.form.get('file')
    python_code = request.form.get('code')

    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': f'File not found: {file_path}'}), 400

    try:
        # Read file content
        data = pd.read_csv(file_path)

        # Get list of available columns
        available_columns = data.columns.tolist()

        # Attempt to auto-correct common issues
        python_code, warnings = auto_correct_code(python_code, available_columns)

        # Create a local namespace to store results
        local_namespace = {'pd': pd, 'data': data}

        # Execute the Python code
        exec(python_code, local_namespace)

        # Get the execution result (all variables defined in the code)
        result = {k: v for k, v in local_namespace.items() if k not in ['pd', 'data']}

        if not result:
            return jsonify({'error': 'No result returned from code execution'}), 500

        # Convert result to JSON-serializable format
        serializable_result = make_serializable(result)

        response = {
            'result': serializable_result,
            'warnings': warnings,
            'available_columns': available_columns
        }

        return jsonify(response), 200

    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Error while executing Python code: {str(e)}\n{error_traceback}")
        return jsonify({
            'error': str(e), 
            'traceback': error_traceback,
            'available_columns': available_columns
        }), 500
# def run_python_code():
    file_path = request.form.get('file')
    python_code = request.form.get('code')

    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': f'File not found: {file_path}'}), 400

    try:
        # Read file content
        data = pd.read_csv(file_path)

        # Get list of available columns
        available_columns = data.columns.tolist()

        # Attempt to auto-correct common issues
        python_code, warnings = auto_correct_code(python_code, available_columns)

        # Modify the Python code to ensure it returns a result
        modified_code = f"""
        def execute_code():
            {python_code}
            return locals()

        result = execute_code()
        """

        # Create a local namespace to store results
        local_namespace = {'pd': pd, 'data': data}

        # Execute the modified Python code
        exec(modified_code, local_namespace)

        # Get the execution result
        result = local_namespace.get('result', {})

        if not result:
            return jsonify({'error': 'No result returned from code execution'}), 500

        # Convert result to JSON-serializable format
        serializable_result = make_serializable(result)

        response = {
            'result': serializable_result,
            'warnings': warnings,
            'available_columns': available_columns
        }

        return jsonify(response), 200

    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Error while executing Python code: {str(e)}\n{error_traceback}")
        return jsonify({
            'error': str(e), 
            'traceback': error_traceback,
            'available_columns': available_columns
        }), 500

def make_serializable(obj):
    if isinstance(obj, (pd.DataFrame, pd.Series)):
        return obj.to_dict()
    elif isinstance(obj, (int, float, str, bool, type(None))):
        return obj
    elif isinstance(obj, (list, tuple)):
        return [make_serializable(item) for item in obj]
    elif isinstance(obj, dict):
        return {str(k): make_serializable(v) for k, v in obj.items()}
    else:
        return str(obj)


def auto_correct_code(code, available_columns):
    warnings = []
    new_code_lines = []

    for line in code.split('\n'):
        if "data['" in line:
            column = line.split("data['")[1].split("']")[0]
            if column not in available_columns:
                close_match = find_close_match(column, available_columns)
                if close_match:
                    line = line.replace(f"data['{column}']", f"data['{close_match}']")
                    warnings.append(f"Column '{column}' not found. Using '{close_match}' instead.")
                else:
                    warnings.append(f"Column '{column}' not found and no close match available. This may cause an error.")
        new_code_lines.append(line)

    return '\n'.join(new_code_lines), warnings

def find_close_match(column, available_columns):
    # This is a basic implementation. You might want to use more sophisticated methods like fuzzy matching.
    for available_column in available_columns:
        if column.lower() in available_column.lower() or available_column.lower() in column.lower():
            return available_column
    return None


@app.route('/')
def index():
    return '''
    <!doctype html>
    <title>Upload CSV and Provide Instructions</title>
    <h1>Upload a CSV file and choose an action</h1>
    <form method=post enctype=multipart/form-data action="/generate_image">
      <label for="instruction">Instruction (visualization style, e.g., change the color of the chart to red):</label><br>
      <input type="text" id="instruction" name="instruction" placeholder="Enter your instruction here"><br><br>
      
      <label for="user_query">User Query (visualization meaning, e.g., What is the average price of cars by type?):</label><br>
      <input type="text" id="user_query" name="user_query" placeholder="Enter your query here"><br><br>
      
      <input type=file name=file><br><br>
      <input type=submit value="Generate Image" formaction="/generate_image">
      <input type=submit value="Generate Summary" formaction="/generate_summary">
    </form>
    '''

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)