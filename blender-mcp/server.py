import os
import subprocess
import tempfile
import json
from mcp.server.fastmcp import FastMCP

# Create FastMCP server
mcp = FastMCP("Blender MCP Server")

@mcp.tool()
def get_blender_version() -> str:
    """Get the version of Blender installed in the environment."""
    try:
        result = subprocess.run(["blender", "--version"], capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except Exception as e:
        return f"Error getting Blender version: {str(e)}"

@mcp.tool()
def run_blender_script(script_code: str, file_to_open: str = None) -> str:
    """
    Executes a Python script using the Blender API (`bpy`) in headless mode.
    The script runs within the container's environment. The /workspace directory is mounted
    from the host, so scripts can read and write files there (e.g., /workspace/dist/michael.glb).
    
    Args:
        script_code: The Python script to execute. Must use `import bpy` to interact with Blender.
        file_to_open: Optional path (relative to /workspace) to a .blend file or 3D model (.glb, .gltf, .fbx, .obj) to open/import before running the script.
    """
    # Create temp file for script
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        # If file_to_open is specified and is a GLB/FBX/OBJ (non-blend), we prepend import code
        injected_code = ""
        if file_to_open:
            abs_path = os.path.join("/workspace", file_to_open)
            if not os.path.exists(abs_path):
                return f"Error: File to open not found: {file_to_open}"
            
            # Prepend import logic for 3D formats
            if file_to_open.endswith((".glb", ".gltf")):
                injected_code = f"import bpy\nbpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.ops.import_scene.gltf(filepath={repr(abs_path)})\n"
            elif file_to_open.endswith(".fbx"):
                injected_code = f"import bpy\nbpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.ops.import_scene.fbx(filepath={repr(abs_path)})\n"
            elif file_to_open.endswith(".obj"):
                injected_code = f"import bpy\nbpy.ops.wm.read_factory_settings(use_empty=True)\nbpy.ops.import_scene.obj(filepath={repr(abs_path)})\n"
                
        f.write(injected_code + script_code)
        script_path = f.name

    try:
        # Build command
        cmd = ["blender", "-b"]
        
        # If it's a native blend file, open it directly via CLI
        if file_to_open and file_to_open.endswith(".blend"):
            cmd.append(os.path.join("/workspace", file_to_open))
            
        cmd.extend(["-P", script_path])
        
        # Run Blender
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        output = []
        if result.stdout:
            output.append("=== STDOUT ===")
            output.append(result.stdout)
        if result.stderr:
            output.append("=== STDERR ===")
            output.append(result.stderr)
            
        # Clean up script
        os.unlink(script_path)
        
        return "\n".join(output)
        
    except Exception as e:
        if os.path.exists(script_path):
            os.unlink(script_path)
        return f"Exception during execution: {str(e)}"

@mcp.tool()
def inspect_model(model_path: str) -> str:
    """
    Imports and inspects a 3D model (GLB, GLTF, FBX, OBJ, BLEND) and returns structured metadata
    about its meshes, vertex counts, bones (armatures), materials, and shape keys (morph targets).
    
    Args:
        model_path: Path to the 3D model file relative to /workspace (e.g. "dist/michael.glb")
    """
    abs_path = os.path.join("/workspace", model_path)
    if not os.path.exists(abs_path):
        return f"Error: Model file not found: {model_path}"
        
    # Python script to run inside Blender to inspect the model
    inspect_script = f"""
import bpy
import json
import os

try:
    # Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import based on file extension
    filepath = {repr(abs_path)}
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext == ".blend":
        bpy.ops.wm.open_mainfile(filepath=filepath)
    elif ext in [".glb", ".gltf"]:
        bpy.ops.import_scene.gltf(filepath=filepath)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=filepath)
    elif ext == ".obj":
        bpy.ops.import_scene.obj(filepath=filepath)
    else:
        raise ValueError(f"Unsupported file format: {{ext}}")
        
    data = {{
        "objects": [],
        "meshes": [],
        "armatures": [],
        "materials": [],
        "animations": []
    }}
    
    for obj in bpy.data.objects:
        obj_data = {{
            "name": obj.name,
            "type": obj.type,
            "location": list(obj.location),
            "parent": obj.parent.name if obj.parent else None
        }}
        data["objects"].append(obj_data)
        
        if obj.type == 'MESH':
            mesh = obj.data
            data["meshes"].append({{
                "name": obj.name,
                "vertex_count": len(mesh.vertices),
                "polygon_count": len(mesh.polygons),
                "materials": [slot.material.name for slot in obj.material_slots if slot.material],
                "shape_keys": [key.name for key in mesh.shape_keys.key_blocks] if mesh.shape_keys else []
            }})
        elif obj.type == 'ARMATURE':
            armature = obj.data
            data["armatures"].append({{
                "name": obj.name,
                "bones": [bone.name for bone in armature.bones]
            }})
            
    for mat in bpy.data.materials:
        data["materials"].append({{
            "name": mat.name,
            "use_nodes": mat.use_nodes
        }})
        
    for anim in bpy.data.actions:
        data["animations"].append({{
            "name": anim.name
        }})
        
    print("__INSPECT_DATA__" + json.dumps(data) + "__INSPECT_DATA__")
except Exception as e:
    print("__INSPECT_ERROR__" + str(e) + "__INSPECT_ERROR__")
"""

    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(inspect_script)
        script_path = f.name
        
    try:
        cmd = ["blender", "-b", "-P", script_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        os.unlink(script_path)
        
        stdout = result.stdout
        if "__INSPECT_ERROR__" in stdout:
            error_msg = stdout.split("__INSPECT_ERROR__")[1]
            return f"Blender Error: {error_msg}"
            
        if "__INSPECT_DATA__" in stdout:
            json_str = stdout.split("__INSPECT_DATA__")[1]
            data = json.loads(json_str)
            return json.dumps(data, indent=2)
            
        return f"Failed to inspect model. Output was:\n{stdout}\n{result.stderr}"
        
    except Exception as e:
        if os.path.exists(script_path):
            os.unlink(script_path)
        return f"Exception during execution: {str(e)}"

if __name__ == "__main__":
    mcp.run()
