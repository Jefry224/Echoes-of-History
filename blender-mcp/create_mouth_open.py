import bpy
import math

def create_mouth_open_shape_key(filepath, output_filepath):
    # Reset Blender scene and import GLB
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=filepath)
    
    # Get the head mesh object
    obj = bpy.data.objects.get("node_0")
    if not obj:
        print("Error: Could not find object 'node_0'")
        return False
        
    mesh = obj.data
    
    # Ensure Basis shape key exists
    if not mesh.shape_keys:
        basis = obj.shape_key_add(name="Basis")
    else:
        basis = mesh.shape_keys.key_blocks[0]
        
    # Check if Mouth_Open already exists, delete it to recreate
    if mesh.shape_keys and "Mouth_Open" in mesh.shape_keys.key_blocks:
        key_block = mesh.shape_keys.key_blocks["Mouth_Open"]
        obj.shape_key_remove(key_block)
        
    # Create the new shape key
    mouth_open_key = obj.shape_key_add(name="Mouth_Open")
    
    # Smoothstep helper
    def smoothstep(edge0, edge1, x):
        t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
        return t * t * (3.0 - 2.0 * t)

    # Deform vertices
    count = 0
    for i, vert in enumerate(mesh.vertices):
        co = vert.co
        
        # Calculate vertical mask (lower lip and chin)
        # Mouth split line is around Y = 0.485
        if co.y < 0.485:
            # Chin/jaw region: starts at Y = 0.42, fully active at Y = 0.45, fades out above 0.485
            weight_y = smoothstep(0.42, 0.45, co.y)
        elif co.y < 0.50:
            # Fade out quickly above the lip line so upper lip doesn't move
            weight_y = 1.0 - smoothstep(0.485, 0.50, co.y)
        else:
            weight_y = 0.0
            
        # Calculate horizontal mask (fade out towards ears/sides)
        weight_x = 1.0 - smoothstep(0.08, 0.18, abs(co.x))
        
        # Calculate depth mask (fade out towards back of head)
        weight_z = smoothstep(0.00, 0.12, co.z)
        
        # Combined weight
        weight = weight_x * weight_y * weight_z
        
        if weight > 0.01:
            # Move jaw down (Y decreases) and slightly back (Z decreases)
            displacement_y = -0.04 * weight
            displacement_z = -0.015 * weight
            
            # Apply displacement to the shape key vertex
            mouth_open_key.data[i].co.y += displacement_y
            mouth_open_key.data[i].co.z += displacement_z
            count += 1
            
    print(f"Successfully modified {count} vertices for 'Mouth_Open' shape key.")
    
    # Export back to GLB
    bpy.ops.export_scene.gltf(
        filepath=output_filepath,
        export_format="GLB",
        export_apply=True
    )
    print(f"Exported modified model to {output_filepath}")
    return True

if __name__ == "__main__":
    create_mouth_open_shape_key("/workspace/michael.glb", "/workspace/michael_rigged.glb")
