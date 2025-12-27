from PySide6.QtWidgets import QWidget, QLabel, QSlider, QPushButton, QHBoxLayout, QVBoxLayout
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QImage, QPixmap

import numpy as np
import re
import OpenImageIO as oiio
import os

class ImageViewer(QWidget):
    def __init__(self):
        super().__init__()
        self.frames = []
        self.current_frame = 0
        
        self.label = QLabel(alignment=Qt.AlignmentFlag.AlignCenter)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.label)

    def show_frame(self, index):
        self.current_frame = index
        img = load_exr(self.frames[index])
        pix = QPixmap.fromImage(img)
        self.label.setPixmap(
            pix.scaled(
                self.label.size(),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
        )

    def setTime(self, time_value: float):
        """
        time_value maps to an image index or frame number
        """
        frame = int(time_value)
        self.show_frame(frame)

    def refresh(self, path):
        self.frames = detect_sequence(path)
        self.show_frame(0)
            
    def resizeEvent(self, event):
        if self.frames:
            self.show_frame(self.current_frame)
        super().resizeEvent(event)
            
def load_exr(path):
    inp = oiio.ImageInput.open(str(path))
    if not inp:
        raise RuntimeError(f"Cannot open EXR: {path}")

    spec = inp.spec()
    data = inp.read_image(format=oiio.FLOAT)
    inp.close()

    # Clamp and convert
    img = np.clip(data, 0.0, 1.0)
    img = (img * 255).astype(np.uint8)

    # Ensure RGB
    if img.shape[2] > 3:
        img = img[:, :, :3]

    # *** CRITICAL FIX ***
    img = np.ascontiguousarray(img)

    height, width, channels = img.shape

    qimg = QImage(
        img.data,
        width,
        height,
        width * 3,
        QImage.Format_RGB888,
    )

    return qimg.copy()  # detach from NumPy memory


def detect_sequence(path):
    """
    Accepts:
      - Concrete frame path: image.0001.exr
      - Hash template: image.####.exr

    Returns:
      Sorted list of absolute file paths for existing frames.
      Falls back to [path] if no sequence is found.
    """
    directory = os.path.dirname(path)
    filename = os.path.basename(path)

    if not os.path.isdir(directory):
        return [path]

    # Case 1: #### template
    hash_match = re.search(r"(#+)", filename)
    if hash_match:
        padding = len(hash_match.group(1))
        prefix, suffix = filename.split(hash_match.group(1), 1)

        pattern = re.compile(
            re.escape(prefix) + r"\d{" + str(padding) + r"}" + re.escape(suffix)
        )

    # Case 2: explicit frame number
    else:
        m = re.search(r"(.*?)(\d+)(\.exr)$", filename)
        if not m:
            return [path]

        prefix, frame, suffix = m.groups()
        padding = len(frame)

        pattern = re.compile(
            re.escape(prefix) + r"\d{" + str(padding) + r"}" + re.escape(suffix)
        )

    frames = []
    for name in os.listdir(directory):
        full_path = os.path.join(directory, name)
        if os.path.isfile(full_path) and pattern.fullmatch(name):
            frames.append(full_path)

    frames.sort()
    return frames or [path]
