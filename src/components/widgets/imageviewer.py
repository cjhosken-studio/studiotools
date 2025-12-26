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
        
        self.label = QLabel(alignment=Qt.AlignmentFlag.AlignCenter)
        self.slider = QSlider(Qt.Orientation.Horizontal)
        self.play_btn = QPushButton("Play")

        self.timer = QTimer()
        self.timer.setInterval(40)  # ~25 FPS

        self.frames = []
        self.current_frame = 0

        self.slider.valueChanged.connect(self.set_frame)
        self.play_btn.clicked.connect(self.toggle_play)
        self.timer.timeout.connect(self.next_frame)

        controls = QHBoxLayout()
        controls.addWidget(self.play_btn)

        layout = QVBoxLayout(self)
        layout.addWidget(self.label)
        layout.addWidget(self.slider)
        layout.addLayout(controls)

        self.slider.hide()
        self.play_btn.hide()
    
    def show_frame(self, index):
        img = load_exr(self.frames[index])
        pix = QPixmap.fromImage(img)
        self.label.setPixmap(
            pix.scaled(
                self.label.size(),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
        )

    def set_frame(self, index):
        self.current_frame = index
        self.show_frame(index)

    def next_frame(self):
        self.current_frame = (self.current_frame + 1) % len(self.frames)
        self.slider.setValue(self.current_frame)

    def toggle_play(self):
        if self.timer.isActive():
            self.timer.stop()
            self.play_btn.setText("Play")
        else:
            self.timer.start()
            self.play_btn.setText("Pause")
    
    def refresh(self, path):
        self.frames = detect_sequence(path)

        self.slider.setMaximum(len(self.frames) - 1)
        self.slider.setValue(0)
        self.current_frame = 0

        has_sequence = len(self.frames) > 1
        self.slider.setVisible(has_sequence)
        self.play_btn.setVisible(has_sequence)

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
