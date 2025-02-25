#!/bin/bash
# Script to build and convert the Docker image to WASM

# Step 1: Build the Docker image
echo "Building the 32-bit Jupyter Docker image..."
docker build -t jupyter-datascience-32bit -f Dockerfile .

# Step 2: Install Docker-WASM tools
echo "Installing Docker-WASM conversion tools..."
npm install -g @wasmer/wasm-transformer
npm install -g docker-wasm-cli

# Step 3: Export the Docker image
echo "Exporting Docker image to a tarball..."
docker save jupyter-datascience-32bit -o jupyter-datascience-32bit.tar

# Step 4: Convert the Docker image to WASM
echo "Converting Docker image to WASM format..."
docker-wasm convert jupyter-datascience-32bit.tar --output jupyter-datascience.wasm

# Step 5: Create a simple HTML launcher
echo "Creating HTML launcher for the WASM module..."
cat > jupyter-wasm-launcher.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jupyter WASM Instance</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        button {
            padding: 10px 15px;
            font-size: 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
        #status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 4px;
            background-color: #f8f9fa;
        }
        #jupyter-frame {
            width: 100%;
            height: 600px;
            border: 1px solid #ddd;
            margin-top: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <h1>Jupyter WASM Instance</h1>
    <p>This page runs a Jupyter notebook server directly in your browser using WebAssembly.</p>
    
    <button id="start-button">Start Jupyter Server</button>
    <div id="status">Status: Ready to launch</div>
    <iframe id="jupyter-frame" sandbox="allow-scripts allow-same-origin"></iframe>

    <script>
        document.getElementById('start-button').addEventListener('click', async () => {
            const statusEl = document.getElementById('status');
            const frameEl = document.getElementById('jupyter-frame');
            
            statusEl.textContent = 'Status: Loading WASM module...';
            
            try {
                // Import the WASM module
                const wasmModule = await WebAssembly.instantiateStreaming(
                    fetch('jupyter-datascience.wasm'),
                    {}
                );
                
                statusEl.textContent = 'Status: Starting Jupyter server...';
                
                // Initialize the WASM instance
                const instance = wasmModule.instance;
                await instance.exports._start();
                
                // Connect to the virtual server
                const port = 8888; // The port defined in the Docker image
                const url = `http://localhost:${port}`;
                
                statusEl.textContent = 'Status: Jupyter server running at ' + url;
                
                // Display in iframe
                frameEl.style.display = 'block';
                frameEl.src = url;
            } catch (error) {
                statusEl.textContent = 'Status: Error - ' + error.message;
                console.error(error);
            }
        });
    </script>
</body>
</html>
EOL

echo "Done! You now have:"
echo "1. jupyter-datascience.wasm - The WASM module"
echo "2. jupyter-wasm-launcher.html - A HTML launcher for the WASM module"
echo ""
echo "To use, serve these files with a web server that supports WebAssembly and WASM-compatible headers."