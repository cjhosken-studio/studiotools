from PySide6.QtGui import QIcon, QPainter
import os
import yaml


class Asset():
    def __init__(self, root, asset_type, version):
        self.path = os.path.dirname(root)
        self.name = os.path.basename(self.path)
        self.root = root
        self.asset_type = asset_type
        self.version = version
        
    def getThumbnail(self):
        thumbnail = os.path.join(self.path, "thumbnail.png")
        
        return thumbnail

def getAssetFromMetadata(metadata):
    with open(metadata, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
                
    asset = Asset(
        root=data.get("root", ""),
        asset_type=data.get("type", ""),
        version=data.get("version", 0)
    )
    
    return asset
    

def getIconFromAssetType(asset_type):    
    current_file = __file__
    app_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
    icons_dir = os.path.join(app_root, "public", "icons")
    
    return QIcon(os.path.join(icons_dir, f"{asset_type}.png"))

def overlay_warning_icon(base_icon: QIcon, size=32) -> QIcon:
    current_file = __file__
    base_pixmap = base_icon.pixmap(size, size)
    app_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
    icons_dir = os.path.join(app_root, "public", "icons")

    warning_icon = QIcon(os.path.join(icons_dir, "houdini.png"))
    if warning_icon.isNull():
        return base_icon  # fail safely

    warning_pixmap = warning_icon.pixmap(size // 2, size // 2)

    painter = QPainter(base_pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    painter.drawPixmap(
        base_pixmap.width()/2 - warning_pixmap.width(),
        base_pixmap.height()/2 - warning_pixmap.height(),
        warning_pixmap
    )
    painter.end()

    return QIcon(base_pixmap)