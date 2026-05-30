import os
import math
from PIL import Image, ImageDraw, ImageFont

def generate_usd_thumbnail(output_path: str, shape: str = "mesh", asset_name: str = "asset", app_name: str = "blender"):
    """Generates a premium, highly stylized 3D clay viewport thumbnail in high resolution (1280x720).
    
    Shapes supported: sphere, cube, cylinder, cone, mesh.
    Background is a rich cinematic dark slate gradient with perspective DCC floor grids.
    The asset is drawn with a solid clay white look, smooth shading, specular highlights, and active wireframe grids.
    All dimensions and fonts are scaled by 2x for retina-ready crispness.
    """
    # 1. Create a 1280x720 image with RGBA
    width, height = 1280, 720
    scale = 2
    image = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(image)
    
    # 2. Draw dark slate gradient background manually
    # From top-left (15, 23, 42) to bottom-right (30, 41, 59)
    for y in range(height):
        t = y / height
        r = int(15 + t * 15)
        g = int(23 + t * 18)
        b = int(42 + t * 17)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        
    # 3. Draw Perspective Floor Grid
    horizon_y = int(height * 0.45) # 324
    grid_color = (30, 58, 86, 120)      # Soft dark blue-teal grid
    accent_color = (0, 240, 255, 60)    # Cyan grid accents
    
    # Draw perspective vanishing lines
    center_x = width // 2
    for x_offset in range(-500 * scale, 501 * scale, 100 * scale):
        # Line from horizon center to bottom edge offset
        color = accent_color if x_offset == 0 else grid_color
        draw.line([(center_x, horizon_y), (center_x + x_offset, height)], fill=color, width=1 * scale)
        
    # Draw horizontal grid steps with exponential spacing (perspective)
    for i in range(12):
        t = (i / 11) ** 2  # Exponential spacing
        y = int(horizon_y + t * (height - horizon_y))
        color = accent_color if i == 0 else grid_color
        draw.line([(0, y), (width, y)], fill=color, width=1 * scale)
        
    # 4. Draw Shaded 3D Geometry
    shape = shape.lower()
    cx, cy = width // 2, int(height * 0.48) # Center of the object (640, 345)
    
    # Palette definitions
    clay_base = (243, 244, 246)  # Opaque white clay
    clay_mid = (209, 213, 219)   # Light grey
    clay_shadow = (100, 116, 139) # Cool slate shadow
    outline_color = (30, 41, 59, 180) # Edge outline
    wireframe_color = (0, 240, 255, 90) # Glowing cyan wireframe
    
    if shape == "sphere":
        # Draw soft ambient drop shadow first
        draw.ellipse([cx - 80 * scale, cy + 40 * scale, cx + 80 * scale, cy + 64 * scale], fill=(8, 15, 30, 140))
        
        # Raycasted-like 3D radial gradient sphere using overlapping circles
        r_max = 76 * scale
        for r in range(r_max, 0, -2):
            factor = r / r_max
            # Light source is top-left, so offset smaller (brighter) circles top-left
            offset_x = int(-24 * scale * (1 - factor))
            offset_y = int(-24 * scale * (1 - factor))
            
            # Interpolate color from shadow to base
            r_c = int(clay_shadow[0] + (clay_base[0] - clay_shadow[0]) * (factor ** 0.6))
            g_c = int(clay_shadow[1] + (clay_base[1] - clay_shadow[1]) * (factor ** 0.6))
            b_c = int(clay_shadow[2] + (clay_base[2] - clay_shadow[2]) * (factor ** 0.6))
            
            draw.ellipse([cx + offset_x - r, cy + offset_y - r, cx + offset_x + r, cy + offset_y + r], fill=(r_c, g_c, b_c, 255))
            
        # Draw specular hot-spot
        draw.ellipse([cx - 30 * scale - 10 * scale, cy - 30 * scale - 10 * scale, cx - 30 * scale + 10 * scale, cy - 30 * scale + 10 * scale], fill=(255, 255, 255, 220))
        
        # Subtle cyan wireframe overlay contours (latitude and longitude)
        draw.arc([cx - r_max, cy - r_max, cx + r_max, cy + r_max], 0, 360, fill=wireframe_color, width=2 * scale)
        draw.ellipse([cx - r_max, cy - 24 * scale, cx + r_max, cy + 24 * scale], outline=wireframe_color, width=1 * scale)
        draw.ellipse([cx - 24 * scale, cy - r_max, cx + 24 * scale, cy + r_max], outline=wireframe_color, width=1 * scale)
        
    elif shape == "cube":
        # Draw soft ambient drop shadow first
        draw.polygon([(cx - 90 * scale, cy + 40 * scale), (cx, cy + 64 * scale), (cx + 90 * scale, cy + 40 * scale), (cx, cy + 20 * scale)], fill=(8, 15, 30, 140))
        
        # Isometric Cube face coordinates (2x scaled)
        # Top face
        top_pts = [(cx, cy - 70 * scale), (cx + 76 * scale, cy - 32 * scale), (cx, cy + 6 * scale), (cx - 76 * scale, cy - 32 * scale)]
        # Left face
        left_pts = [(cx - 76 * scale, cy - 32 * scale), (cx, cy + 6 * scale), (cx, cy + 72 * scale), (cx - 76 * scale, cy + 34 * scale)]
        # Right face
        right_pts = [(cx, cy + 6 * scale), (cx + 76 * scale, cy - 32 * scale), (cx + 76 * scale, cy + 34 * scale), (cx, cy + 72 * scale)]
        
        # Draw shaded faces
        draw.polygon(top_pts, fill=clay_base)       # Top gets most light
        draw.polygon(left_pts, fill=clay_mid)        # Left gets midtone light
        draw.polygon(right_pts, fill=clay_shadow)    # Right gets shadow
        
        # Outlines
        draw.polygon(top_pts, outline=outline_color, width=2 * scale)
        draw.polygon(left_pts, outline=outline_color, width=2 * scale)
        draw.polygon(right_pts, outline=outline_color, width=2 * scale)
        
        # Cyan Wireframe Highlights
        draw.line([top_pts[0], top_pts[2]], fill=wireframe_color, width=1 * scale)
        draw.line([top_pts[1], top_pts[3]], fill=wireframe_color, width=1 * scale)
        draw.line([left_pts[1], (cx - 76 * scale, cy + 34 * scale)], fill=wireframe_color, width=1 * scale)
        draw.line([right_pts[0], (cx + 76 * scale, cy + 34 * scale)], fill=wireframe_color, width=1 * scale)
        
    elif shape == "cylinder":
        # Draw soft ambient drop shadow first
        draw.ellipse([cx - 70 * scale, cy + 50 * scale, cx + 70 * scale, cy + 70 * scale], fill=(8, 15, 30, 140))
        
        h = 84 * scale # Cylinder height
        rx, ry = 60 * scale, 20 * scale # Radii of oval cap
        
        # Bottom cap filled with shadow
        draw.ellipse([cx - rx, cy + h - ry, cx + rx, cy + h + ry], fill=clay_shadow, outline=outline_color, width=2 * scale)
        
        # Tube body manually shaded using vertical lines
        for x_val in range(-rx, rx + 1):
            t = (x_val + rx) / (2 * rx)
            # Lighting from top-left (left is bright, right is dark)
            factor = math.cos((t - 0.25) * math.pi) # Shift highlight left
            factor = max(0, min(1, (factor + 1) / 2))
            
            r_c = int(clay_shadow[0] + (clay_base[0] - clay_shadow[0]) * (factor ** 0.8))
            g_c = int(clay_shadow[1] + (clay_base[1] - clay_shadow[1]) * (factor ** 0.8))
            b_c = int(clay_shadow[2] + (clay_base[2] - clay_shadow[2]) * (factor ** 0.8))
            
            draw.line([(cx + x_val, cy), (cx + x_val, cy + h)], fill=(r_c, g_c, b_c, 255), width=2 * scale)
            
        # Top cap
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=clay_base, outline=outline_color, width=2 * scale)
        
        # Tube boundaries outline
        draw.line([(cx - rx, cy), (cx - rx, cy + h)], fill=outline_color, width=2 * scale)
        draw.line([(cx + rx, cy), (cx + rx, cy + h)], fill=outline_color, width=2 * scale)
        
        # Wireframe mesh segments
        for step in [-30 * scale, 0, 30 * scale]:
            draw.line([(cx + step, cy), (cx + step, cy + h)], fill=wireframe_color, width=1 * scale)
        draw.ellipse([cx - rx, cy + (h//2) - ry, cx + rx, cy + (h//2) + ry], outline=wireframe_color, width=1 * scale)
        
    elif shape == "cone":
        # Draw soft ambient drop shadow first
        draw.ellipse([cx - 70 * scale, cy + 50 * scale, cx + 70 * scale, cy + 70 * scale], fill=(8, 15, 30, 140))
        
        h = 100 * scale # Cone height
        rx, ry = 60 * scale, 18 * scale # Oval base radii
        
        # Draw cone face shaded from top apex (cx, cy - h/2) using radial triangle slices
        apex = (cx, cy - 50 * scale)
        base_y = cy + 50 * scale
        
        # Generate shaded strips
        for x_val in range(-rx, rx + 1):
            t = (x_val + rx) / (2 * rx)
            factor = math.cos((t - 0.25) * math.pi)
            factor = max(0, min(1, (factor + 1) / 2))
            
            r_c = int(clay_shadow[0] + (clay_base[0] - clay_shadow[0]) * (factor ** 0.8))
            g_c = int(clay_shadow[1] + (clay_base[1] - clay_shadow[1]) * (factor ** 0.8))
            b_c = int(clay_shadow[2] + (clay_base[2] - clay_shadow[2]) * (factor ** 0.8))
            
            # Find matching Y on oval base
            dy = ry * math.sqrt(max(0.0, 1.0 - (x_val / rx) ** 2))
            draw.line([apex, (cx + x_val, base_y + int(dy * 0.3))], fill=(r_c, g_c, b_c, 255), width=3 * scale)
            
        # Draw oval base
        draw.ellipse([cx - rx, base_y - ry, cx + rx, base_y + ry], outline=outline_color, width=2 * scale)
        
        # Outline edges
        draw.line([apex, (cx - rx, base_y)], fill=outline_color, width=2 * scale)
        draw.line([apex, (cx + rx, base_y)], fill=outline_color, width=2 * scale)
        
        # Wireframe contours
        draw.line([apex, (cx, base_y + ry)], fill=wireframe_color, width=1 * scale)
        draw.line([apex, (cx - 30 * scale, base_y + int(ry * 0.7))], fill=wireframe_color, width=1 * scale)
        draw.line([apex, (cx + 30 * scale, base_y + int(ry * 0.7))], fill=wireframe_color, width=1 * scale)
        draw.ellipse([cx - rx//2, base_y - 24 * scale - ry//2, cx + rx//2, base_y - 24 * scale + ry//2], outline=wireframe_color, width=1 * scale)
        
    else:
        # Default Shape: Generic 'Mesh' (Renders a high-end multifaceted 3D Geodesic sphere/dome)
        draw.ellipse([cx - 80 * scale, cy + 40 * scale, cx + 80 * scale, cy + 64 * scale], fill=(8, 15, 30, 140))
        
        # Custom faceted model points representing a faceted 3D diamond/geodesic structure (2x scaled)
        apex = (cx, cy - 70 * scale)
        bottom = (cx, cy + 66 * scale)
        
        ring1 = [
            (cx - 70 * scale, cy - 16 * scale),
            (cx - 24 * scale, cy - 36 * scale),
            (cx + 24 * scale, cy - 36 * scale),
            (cx + 70 * scale, cy - 16 * scale),
            (cx + 36 * scale, cy + 10 * scale),
            (cx - 36 * scale, cy + 10 * scale)
        ]
        
        # Shaded faces depending on normals relative to top-left light
        # Formulate correct painter's algorithm drawing order (sort strictly back-to-front in depth)
        faces = [
            # 1. Back-most faces (Top & Bottom) - drawn first
            (apex, ring1[1], ring1[2], clay_shadow),     # Top back
            (bottom, ring1[1], ring1[2], clay_shadow),   # Bottom back
            
            # 2. Mid-back faces
            (apex, ring1[0], ring1[1], clay_mid),        # Top back-left
            (apex, ring1[2], ring1[3], clay_shadow),     # Top back-right
            (bottom, ring1[0], ring1[1], clay_shadow),   # Bottom back-left
            (bottom, ring1[2], ring1[3], clay_shadow),   # Bottom back-right
            
            # 3. Mid-front faces
            (apex, ring1[5], ring1[0], clay_base),       # Top front-left
            (apex, ring1[3], ring1[4], clay_mid),        # Top front-right
            (bottom, ring1[5], ring1[0], clay_mid),      # Bottom front-left
            (bottom, ring1[3], ring1[4], clay_shadow),   # Bottom front-right
            
            # 4. Front-most faces - drawn last (overlapping previous ones)
            (apex, ring1[4], ring1[5], clay_base),       # Top front-center
            (bottom, ring1[4], ring1[5], clay_mid),      # Bottom front-center
        ]
        
        # Draw faces
        for p1, p2, p3, color in faces:
            draw.polygon([p1, p2, p3], fill=color, outline=outline_color)
            
        # Draw cyan wireframe segments to emphasize topology
        for p1, p2, p3, _ in faces:
            draw.line([p1, p2], fill=wireframe_color, width=1 * scale)
            draw.line([p2, p3], fill=wireframe_color, width=1 * scale)
            draw.line([p3, p1], fill=wireframe_color, width=1 * scale)

    # 5. Draw Sleek VFX HUD Overlay details (scaled)
    # Border card outline
    draw.rectangle([0, 0, width - 1, height - 1], outline=(255, 255, 255, 15), width=2 * scale)
    
    # HUD text details (Draw solid dark banners with micro text)
    draw.rectangle([0, 0, width, 36 * scale], fill=(10, 15, 26, 200))
    draw.rectangle([0, height - 36 * scale, width, height], fill=(10, 15, 26, 200))
    
    # Try loading scaled default font, or fallback
    try:
        font = ImageFont.load_default(size=10 * scale)
    except Exception:
        try:
            font = ImageFont.load_default()
        except Exception:
            font = None
        
    # App brand badges
    app_name = app_name.lower()
    if app_name == "blender":
        brand_color = (234, 137, 36, 255) # Blender Orange
        brand_label = "BLENDER PUBLISH"
    elif app_name == "houdini":
        brand_color = (236, 90, 60, 255)  # Houdini Coral
        brand_label = "HOUDINI SOLARIS"
    else:
        brand_color = (0, 240, 255, 255)  # StudioTools Cyan
        brand_label = "USD PIPELINE"
        
    # Draw Brand Indicator Dot (scaled)
    draw.ellipse([16 * scale, 10 * scale, 28 * scale, 22 * scale], fill=brand_color)
    
    # Draw text annotations
    draw.text((40 * scale, 6 * scale), brand_label, fill=(200, 200, 200, 255), font=font)
    draw.text((width - 240 * scale, 6 * scale), "STUDIO TOOLS PREVIEW", fill=(100, 116, 139, 255), font=font)
    
    # Bottom HUD details
    draw.text((16 * scale, height - 28 * scale), f"ASSET: {asset_name.upper()}", fill=(255, 255, 255, 255), font=font)
    draw.text((width - 150 * scale, height - 28 * scale), "v3D.HIGHRES", fill=brand_color, font=font)
    
    # 6. Save image to disk
    image.save(output_path, "PNG")
    print(f"[Studio Tools] Generated high-res beauty thumbnail: {output_path} (Shape: {shape})")
