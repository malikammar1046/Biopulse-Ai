"""
OvaSense — Real Medical Report OCR Engine (PaddleOCR / RapidOCR).

Self-hosted, local, open-source OCR engine utilizing PaddleOCR PP-OCRv4
weights via ONNX Runtime for high-performance CPU inference with zero
external API dependencies, zero cloud leakage, and zero recurring cost.
"""

from __future__ import annotations

import io
import logging
import os
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, List, Optional, Tuple

try:
    import pymupdf
except ImportError:
    pymupdf = None

import numpy as np
from PIL import Image

try:
    from rapidocr_onnxruntime import RapidOCR
except ImportError:
    RapidOCR = None

logger = logging.getLogger(__name__)


@dataclass
class OcrTextBlock:
    """Represents a single recognized line or text block from the document."""
    text: str
    confidence: float
    bbox: List[List[float]] = field(default_factory=list)
    page_number: int = 1


@dataclass
class OcrDocumentResult:
    """Represents the complete OCR extraction result for an uploaded document."""
    filename: str
    total_pages: int
    raw_text: str
    text_blocks: List[OcrTextBlock]
    avg_confidence: float
    has_selectable_text: bool
    engine_name: str = "PaddleOCR PP-OCRv4 (ONNX)"


class PaddleOcrEngine:
    """
    Thread-safe wrapper around the PaddleOCR / RapidOCR engine.
    Lazily loads model weights once in memory and reuses them across requests.
    """

    _instance: Optional[PaddleOcrEngine] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._engine: Optional[RapidOCR] = None
        self._initialized = False

    @classmethod
    def get_instance(cls) -> PaddleOcrEngine:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _ensure_loaded(self) -> None:
        if not self._initialized:
            with self._lock:
                if not self._initialized:
                    try:
                        if RapidOCR is not None:
                            logger.info("Initializing PaddleOCR (RapidOCR ONNX engine)...")
                            self._engine = RapidOCR()
                            logger.info("PaddleOCR engine loaded successfully.")
                        else:
                            logger.warning("rapidocr_onnxruntime is not installed. Running in degraded OCR mode.")
                    except Exception as exc:
                        logger.warning("Failed to initialize PaddleOCR engine: %s. Continuing with degraded mode.", exc)
                        self._engine = None
                    self._initialized = True

    def process_image(self, image_input: bytes | Image.Image | np.ndarray, page_number: int = 1) -> List[OcrTextBlock]:
        """
        Runs OCR on a single image (PIL Image, bytes, or numpy array).
        Returns a list of recognized OcrTextBlock objects.
        """
        self._ensure_loaded()
        if self._engine is None:
            return []

        if isinstance(image_input, bytes):
            image = Image.open(io.BytesIO(image_input)).convert("RGB")
            img_np = np.array(image)
        elif isinstance(image_input, Image.Image):
            img_np = np.array(image_input.convert("RGB"))
        elif isinstance(image_input, np.ndarray):
            img_np = image_input
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        try:
            ocr_out = self._engine(img_np)
        except Exception as exc:
            logger.warning("RapidOCR execution failed on image: %s", exc)
            return []

        if not ocr_out:
            return []

        if isinstance(ocr_out, (list, tuple)) and len(ocr_out) > 0:
            result = ocr_out[0]
        else:
            result = ocr_out

        raw_blocks: List[OcrTextBlock] = []
        if result:
            for item in result:
                if not item or len(item) < 3:
                    continue
                # RapidOCR format: [bbox, text, score]
                bbox, text, score = item[0], str(item[1]).strip(), float(item[2])
                if text:
                    raw_blocks.append(OcrTextBlock(
                        text=text,
                        confidence=round(score, 3),
                        bbox=bbox,
                        page_number=page_number,
                    ))

        return self._group_blocks_into_lines(raw_blocks)

    @staticmethod
    def _group_blocks_into_lines(blocks: List[OcrTextBlock]) -> List[OcrTextBlock]:
        """
        Groups OCR word blocks sharing roughly the same vertical Y-band
        into full horizontal rows sorted left to right.
        Crucial for laboratory report tables with columns: TEST | VALUE | UNIT | REFERENCE.
        """
        if not blocks:
            return []

        def get_y(b: OcrTextBlock) -> float:
            if b.bbox and len(b.bbox) >= 3:
                return (b.bbox[0][1] + b.bbox[2][1]) / 2.0
            return 0.0

        def get_x(b: OcrTextBlock) -> float:
            if b.bbox and len(b.bbox) >= 1:
                return float(b.bbox[0][0])
            return 0.0

        def get_h(b: OcrTextBlock) -> float:
            if b.bbox and len(b.bbox) >= 3:
                return max(10.0, abs(b.bbox[2][1] - b.bbox[0][1]))
            return 15.0

        sorted_blocks = sorted(blocks, key=lambda b: (get_y(b), get_x(b)))
        lines: List[List[OcrTextBlock]] = []

        for b in sorted_blocks:
            y = get_y(b)
            h = get_h(b)
            threshold = max(8.0, h * 0.6)

            matched_line = None
            for line in lines:
                avg_line_y = sum(get_y(x) for x in line) / len(line)
                if abs(y - avg_line_y) <= threshold:
                    matched_line = line
                    break

            if matched_line is not None:
                matched_line.append(b)
            else:
                lines.append([b])

        reconstructed: List[OcrTextBlock] = []
        for line in lines:
            line.sort(key=get_x)
            full_text = "   ".join(item.text for item in line)
            avg_conf = sum(item.confidence for item in line) / len(line)
            first_bbox = line[0].bbox if line[0].bbox else []
            reconstructed.append(OcrTextBlock(
                text=full_text,
                confidence=round(avg_conf, 3),
                bbox=first_bbox,
                page_number=line[0].page_number,
            ))

        return reconstructed

    def process_pdf(self, pdf_bytes: bytes) -> Tuple[List[OcrTextBlock], int, bool]:
        """
        Processes a multi-page PDF document:
        1. Checks for selectable digital text layer.
        2. If digital text layer is rich, extracts text blocks directly.
        3. If scanned / image-based, renders pages at 300 DPI and runs PaddleOCR.
        """
        if pymupdf is None:
            raise RuntimeError("PyMuPDF is not installed. Please install pymupdf to enable PDF OCR extraction.")
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        all_blocks: List[OcrTextBlock] = []
        is_digital_text = False

        # Check total native text across all pages
        total_text_length = 0
        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_text = page.get_text("text").strip()
            total_text_length += len(page_text)

        # If PDF has significant digital text (> 100 chars per page on average or > 150 total)
        if total_text_length > 120:
            is_digital_text = True
            for page_idx in range(total_pages):
                page = doc[page_idx]
                # Extract text blocks with layout info
                # get_text("blocks") returns (x0, y0, x1, y1, text, block_no, block_type)
                blocks = page.get_text("blocks")
                for b in blocks:
                    block_text = b[4].strip()
                    if block_text:
                        # Split by lines to maintain granularity
                        for line in block_text.split("\n"):
                            line_clean = line.strip()
                            if line_clean:
                                all_blocks.append(OcrTextBlock(
                                    text=line_clean,
                                    confidence=0.99,
                                    bbox=[[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]],
                                    page_number=page_idx + 1,
                                ))
        else:
            # Scanned / Image PDF: Render pages as images (2x resolution for crisp OCR)
            zoom_matrix = pymupdf.Matrix(2.0, 2.0)
            for page_idx in range(total_pages):
                page = doc[page_idx]
                pix = page.get_pixmap(matrix=zoom_matrix, alpha=False)
                img_bytes = pix.tobytes("png")
                page_blocks = self.process_image(img_bytes, page_number=page_idx + 1)
                all_blocks.extend(page_blocks)

        doc.close()
        return all_blocks, total_pages, is_digital_text

    def process_document(self, file_bytes: bytes, filename: str) -> OcrDocumentResult:
        """
        Top-level document processing method. Detects format and runs extraction.
        """
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            blocks, total_pages, is_digital = self.process_pdf(file_bytes)
        else:
            # Image formats: PNG, JPG, JPEG, WebP, BMP, TIFF
            blocks = self.process_image(file_bytes, page_number=1)
            total_pages = 1
            is_digital = False

        # Compute full raw text string
        raw_text_lines = [b.text for b in blocks]
        raw_text = "\n".join(raw_text_lines)

        # Compute average confidence
        if blocks:
            avg_conf = round(sum(b.confidence for b in blocks) / len(blocks), 3)
        else:
            avg_conf = 0.0

        return OcrDocumentResult(
            filename=filename,
            total_pages=total_pages,
            raw_text=raw_text,
            text_blocks=blocks,
            avg_confidence=avg_conf,
            has_selectable_text=is_digital,
        )


# Global singleton instance
paddle_ocr_engine = PaddleOcrEngine.get_instance()
