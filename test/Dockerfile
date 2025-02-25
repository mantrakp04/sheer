FROM i386/debian:buster-slim

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PATH="/root/.local/bin:$PATH"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    libzmq3-dev \
    pkg-config \
    python3 \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python3 -m pip install --no-cache-dir --upgrade pip

# Install core Jupyter components
RUN python3 -m pip install --no-cache-dir \
    jupyter \
    jupyterlab \
    notebook \
    voila

# Install data science libraries
RUN python3 -m pip install --no-cache-dir \
    numpy \
    pandas \
    matplotlib \
    scipy \
    scikit-learn \
    seaborn \
    statsmodels

# Install file processing libraries
RUN python3 -m pip install --no-cache-dir \
    openpyxl \
    xlrd \
    xlwt \
    pyarrow \
    fastparquet \
    python-docx \
    pdfminer.six \
    beautifulsoup4 \
    lxml \
    pillow

# Install WASM-friendly packages
RUN python3 -m pip install --no-cache-dir \
    pyodide-pack

# Set up workspace directory
WORKDIR /workspace
RUN mkdir -p /workspace/data

# Configure Jupyter
RUN mkdir -p /root/.jupyter && \
    echo "c.NotebookApp.ip = '0.0.0.0'" >> /root/.jupyter/jupyter_notebook_config.py && \
    echo "c.NotebookApp.port = 8888" >> /root/.jupyter/jupyter_notebook_config.py && \
    echo "c.NotebookApp.open_browser = False" >> /root/.jupyter/jupyter_notebook_config.py && \
    echo "c.NotebookApp.allow_root = True" >> /root/.jupyter/jupyter_notebook_config.py && \
    echo "c.NotebookApp.token = ''" >> /root/.jupyter/jupyter_notebook_config.py && \
    echo "c.NotebookApp.password = ''" >> /root/.jupyter/jupyter_notebook_config.py

# Entry point script for WASM compatibility
COPY <<EOT /workspace/prepare_for_wasm.py
import os
import sys
import json
import subprocess

def collect_dependencies():
    """Collect all Python dependencies for WASM conversion"""
    result = subprocess.run(
        [sys.executable, "-m", "pip", "freeze"],
        capture_output=True,
        text=True
    )
    return result.stdout.strip().split('\n')

def create_manifest():
    """Create a manifest file for WASM conversion"""
    deps = collect_dependencies()
    manifest = {
        "name": "jupyter-datascience-wasm",
        "version": "1.0.0",
        "description": "Jupyter notebook with data science libraries for WASM",
        "dependencies": deps,
        "main": "server.py",
        "files": [
            "server.py",
            "/root/.jupyter/jupyter_notebook_config.py"
        ]
    }
    
    with open("/workspace/wasm_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    
    print("Created WASM manifest file at /workspace/wasm_manifest.json")

if __name__ == "__main__":
    create_manifest()
    print("Prepared environment for WASM conversion")
EOT

# Create a simple server script for the WASM environment
COPY <<EOT /workspace/server.py
#!/usr/bin/env python3
import os
import sys
from notebook.notebookapp import main

if __name__ == "__main__":
    sys.exit(main())
EOT

# Make the server script executable
RUN chmod +x /workspace/server.py

# Prepare for WASM conversion
RUN python3 /workspace/prepare_for_wasm.py

# Expose the Jupyter port
EXPOSE 8888

# Set the default command to start the Jupyter server
CMD ["python3", "/workspace/server.py"]