# Blender MCP Server (Dockerized)

This directory contains a Model Context Protocol (MCP) server that runs Blender 4.2 LTS in headless mode inside a Docker container. It exposes tools to LLMs (like Claude, ChatGPT, or Cursor) to execute python scripts inside Blender using the `bpy` library, allowing automated inspection, rigging, and editing of 3D models (such as GLB, FBX, OBJ, and Blend files).

## Features

1. **`get_blender_version`**: Get the current Blender version.
2. **`run_blender_script`**: Runs any Python script inside Blender (which has the complete `bpy` API).
3. **`inspect_model`**: Imports a 3D model, reads its structure (meshes, vertex counts, materials, shape keys, armatures/bones), and returns a clean JSON summary.

---

## 🚀 How to Set Up

### 1. Build the Docker Image
First, compile the Docker image using Docker Compose:

```bash
docker compose build
```

This will download Blender 4.2.0 LTS, install required headless graphics/audio dependencies, and prepare the Python MCP server.

### 2. Configure Your MCP Client

Since the server runs inside a Docker container, we redirect the Standard Input/Output (`stdio`) of the container to your host.

#### For Cursor (IDE)
1. Open Cursor Settings.
2. Go to **Features** -> **MCP**.
3. Click **+ Add New MCP Server**.
4. Configure it as follows:
   * **Name**: `blender-mcp`
   * **Type**: `command`
   * **Command**: 
     ```bash
     docker run -i --rm -v /home/daniel/Desktop/Echoes-of-History:/workspace blender-mcp:latest
     ```
5. Click **Save**.

#### For Claude Desktop
Add the following to your Claude Desktop configuration file (typically at `~/.config/Claude/claude_desktop_config.json` on Linux/macOS):

```json
{
  "mcpServers": {
    "blender-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "/home/daniel/Desktop/Echoes-of-History:/workspace",
        "blender-mcp:latest"
      ]
    }
  }
}
```

---

## 🛠️ Usage Examples

Once connected, your LLM agent will have access to the Blender tools. Here are examples of scripts the agent can run:

### Inspect a Model
You can ask the agent:
> *"Inspect the model in `dist/michael.glb`"*
The agent will call `inspect_model(model_path="dist/michael.glb")` and output all meshes, vertices, and shape keys.

### Add a Shape Key/Blendshape Programmatically
You can write python code inside `run_blender_script` to modify geometry:
```python
import bpy

# Load model (automatically handled if file_to_open is set, or manually imported):
# bpy.ops.import_scene.gltf(filepath="/workspace/dist/michael.glb")

# Find the head mesh
mesh_obj = bpy.data.objects.get("node_0") # or head object name
if mesh_obj:
    # Create basis key
    if not mesh_obj.data.shape_keys:
        mesh_obj.shape_key_add(name="Basis")
        
    # Create a new shape key for "Mouth_Open"
    key = mesh_obj.shape_key_add(name="Mouth_Open")
    
    # Move vertices programmatically (example: pull jaw vertices down)
    for vertex in key.data:
        # Check if vertex index is part of the jaw/mouth area
        co = vertex.co
        if co.z < 0.2 and co.y > 0.4:  # Adjust threshold based on model space
            vertex.co.z -= 0.1  # Shift down
            
    # Export back to the workspace
    bpy.ops.export_scene.gltf(filepath="/workspace/dist/michael.glb", export_format="GLB")
```
