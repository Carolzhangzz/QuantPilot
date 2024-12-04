from flask import Flask, request, jsonify, send_file, make_response
from werkzeug.utils import secure_filename
import matplotlib.pyplot as plt
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
import json
import numpy as np

# 加载 .env 文件
load_dotenv()

# 获取 API 密钥
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# 设置 OpenAI API 密钥
os.environ['OPENAI_API_KEY'] = openai_api_key

app = Flask(__name__)

# 简化的CORS配置
CORS(app, 
    origins="http://127.0.0.1:8080",
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Accept"])

# Configure matplotlib
matplotlib.use('Agg')

# Configure upload folder
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize LIDA
lida = Manager(text_gen=llm("openai"))

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

        try:
            data = pd.read_csv(filepath)
            summary = lida.summarize(filepath)
            goals = lida.goals(summary, n=4)
            return jsonify({'summary': summary, 'goals': goals}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Invalid file type, only CSV allowed'}), 400

@app.route('/generate_image', methods=['POST'])
def generate_image():
    instruction = request.form.get('instruction')
    user_query = request.form.get('user_query')

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        textgen_config = TextGenerationConfig(n=1, temperature=0.2, use_cache=True)
        summary = lida.summarize(filepath, textgen_config=textgen_config, summary_method="default")
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
        data = pd.read_csv(file_path)
        available_columns = data.columns.tolist()

        # 修改输入的代码，确保结果存储在 result_ 变量中
        if "=" not in python_code:
            # 如果代码中没有赋值操作，将整个表达式赋值给 result_output
            modified_code = f"result_output = {python_code}"
        else:
            modified_code = python_code.replace("plt.savefig", "result_output = plt.savefig")

        # 添加必要的导入
        local_namespace = {
            'pd': pd,
            'data': data,
            'plt': plt,
            'np': np
        }

        print(f"Executing code: {modified_code}")  # 调试输出
        
        exec(modified_code, local_namespace)

        cleaned_results = {}
        
        for var_name, var_value in local_namespace.items():
            if var_name.startswith('result_'):
                if isinstance(var_value, dict):
                    cleaned_results[var_name] = var_value
                elif isinstance(var_value, (pd.Series, pd.DataFrame)):
                    cleaned_results[var_name] = var_value.to_dict()
                elif isinstance(var_value, (int, float, str, bool)):
                    cleaned_results[var_name] = var_value
                elif hasattr(var_value, 'savefig'):  # 处理 matplotlib 图形
                    buf = BytesIO()
                    var_value.savefig(buf, format='png')
                    buf.seek(0)
                    cleaned_results[var_name] = base64.b64encode(buf.getvalue()).decode('utf-8')
                else:
                    cleaned_results[var_name] = str(var_value)

        if not cleaned_results:
            return jsonify({'error': 'No results found. Make sure to assign results to variables starting with "result_"'}), 400

        return jsonify({
            'result': cleaned_results,
            'available_columns': available_columns
        }), 200

    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Error executing code: {str(e)}")  # 调试输出
        print(f"Traceback: {error_traceback}")    # 调试输出
        return jsonify({
            'error': str(e),
            'traceback': error_traceback,
            'available_columns': available_columns
        }), 500

def find_close_match(column, available_columns):
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