"""Remove the white matte from the lab logo, preserving the original PNG.

Run: python public/images/home/remove_logo_background.py
Requires Pillow: python -m pip install pillow
"""
from pathlib import Path

from PIL import Image


def main():
    folder = Path(__file__).resolve().parent
    source = folder / "MLB 로고.png"
    destination = folder / "MLB 로고-투명.png"
    image = Image.open(source).convert("RGBA")
    result = []
    pixels = image.load()
    for red, green, blue, original_alpha in (
        pixels[x, y] for y in range(image.height) for x in range(image.width)
    ):
        # Keep dark/blue pixels and soften the transition into the white matte.
        lightest_background_channel = min(red, green, blue)
        coverage = max(0.0, min(1.0, (235 - lightest_background_channel) / 35))
        if coverage == 0:
            result.append((0, 0, 0, 0))
            continue
        # Remove white contamination along the semi-transparent outline.
        channels = tuple(
            max(0, min(255, round((channel - 255 * (1 - coverage)) / coverage)))
            for channel in (red, green, blue)
        )
        result.append((*channels, round(original_alpha * coverage)))
    image.putdata(result)
    image.save(destination, optimize=True)
    print(f"Saved transparent logo: {destination}")


if __name__ == "__main__":
    main()
