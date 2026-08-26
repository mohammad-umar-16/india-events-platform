from pathlib import Path
import zipfile

# 1. Define paths
source_dir = Path(r"C:\Users\UMARA\mohammadumarprject\india-events-platform-main")
output_zip = Path(r"C:\Users\UMARA\Downloads\india-events-platform-main.zip")

print("Starting compression... Please wait.")

# 2. Open the ZIP file for writing
with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
    # 3. Walk through all files recursively
    for file_path in source_dir.rglob("*"):
        # Skip directories themselves (zipfile focuses on individual files)
        if file_path.is_dir():
            continue

        # Check if 'node_modules' is anywhere in the file path
        if "node_modules" in file_path.parts:
            continue

        # Calculate the file's path relative to the root directory
        relative_path = file_path.relative_to(source_dir)

        # Write the file into the archive
        zipf.write(file_path, arcname=relative_path)

print(f"Successfully zipped! Saved to: {output_zip}")
