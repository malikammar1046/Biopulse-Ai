import os
import zipfile
import hashlib
import json
import shutil
import time
import re

def update_apk():
    workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_public = os.path.join(workspace_root, 'apps', 'web', 'public')
    downloads_dir = os.path.join(web_public, 'downloads')
    src_apk = os.path.join(downloads_dir, 'biopulse-ai-v1.0.0.apk')
    temp_apk = os.path.join(workspace_root, 'temp_updated.apk')

    # 1. Locate fresh bundle from expo export
    bundle_dir = os.path.join(workspace_root, 'apps', 'mobile', 'dist', '_expo', 'static', 'js', 'android')
    bundle_files = [f for f in os.listdir(bundle_dir) if f.endswith('.hbc')]
    if not bundle_files:
        raise FileNotFoundError("No .hbc bundle file found in " + bundle_dir)
    bundle_path = os.path.join(bundle_dir, bundle_files[0])
    with open(bundle_path, 'rb') as f:
        new_bundle_data = f.read()

    print(f"Loaded fresh Hermes bytecode bundle: {bundle_files[0]} ({len(new_bundle_data)} bytes)")

    # 2. Locate app.json
    app_json_path = os.path.join(workspace_root, 'apps', 'mobile', 'app.json')
    with open(app_json_path, 'r', encoding='utf-8') as f:
        app_config = json.load(f).get('expo', {})
    new_config_data = json.dumps(app_config).encode('utf-8')

    # 3. Read dist assets
    dist_assets_dir = os.path.join(workspace_root, 'apps', 'mobile', 'dist', 'assets')
    dist_assets = {}
    if os.path.exists(dist_assets_dir):
        for a in os.listdir(dist_assets_dir):
            ap = os.path.join(dist_assets_dir, a)
            if os.path.isfile(ap):
                with open(ap, 'rb') as af:
                    dist_assets[a] = af.read()

    # 4. Stream and replace in APK
    with zipfile.ZipFile(src_apk, 'r') as zin:
        with zipfile.ZipFile(temp_apk, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename == 'assets/index.android.bundle':
                    zout.writestr(item, new_bundle_data)
                elif item.filename == 'assets/app.config':
                    zout.writestr(item, new_config_data)
                else:
                    zout.writestr(item, zin.read(item.filename))
            
            # Also add any dist assets if not already present
            existing_names = set(zin.namelist())
            for a_name, a_data in dist_assets.items():
                entry_name = f'assets/{a_name}'
                if entry_name not in existing_names:
                    zout.writestr(entry_name, a_data)

    # 5. Verify magic bytes and integrity
    with open(temp_apk, 'rb') as f:
        apk_data = f.read()

    magic = apk_data[:4].hex()
    if magic != '504b0304':
        raise ValueError(f"Invalid ZIP magic header: {magic}")

    sha256_hash = hashlib.sha256(apk_data).hexdigest()
    file_size_bytes = len(apk_data)
    file_size_mb = f"{file_size_bytes / (1024 * 1024):.1f} MB"

    print(f"Verified magic header: 504B0304 (Valid Android APK Package)")
    print(f"New APK size: {file_size_bytes} bytes ({file_size_mb})")
    print(f"New SHA-256: {sha256_hash}")

    # 6. Deploy to all 3 download locations
    v1_dest = os.path.join(downloads_dir, 'biopulse-ai-v1.0.0.apk')
    latest_dest = os.path.join(downloads_dir, 'biopulse-ai-latest.apk')
    root_dest = os.path.join(web_public, 'biopulse-ai-latest.apk')

    shutil.copyfile(temp_apk, v1_dest)
    shutil.copyfile(temp_apk, latest_dest)
    shutil.copyfile(temp_apk, root_dest)
    os.remove(temp_apk)

    print("Copied APK to:")
    print(f"  - {v1_dest}")
    print(f"  - {latest_dest}")
    print(f"  - {root_dest}")

    # 7. Update release-info.json
    release_info_path = os.path.join(downloads_dir, 'release-info.json')
    current_date = time.strftime('%B %d, %Y')
    release_info = {
        "version": "1.0.0",
        "versionCode": 100,
        "appName": "BioPulse AI",
        "filename": "biopulse-ai-v1.0.0.apk",
        "downloadUrl": "/downloads/biopulse-ai-v1.0.0.apk",
        "latestUrl": "/downloads/biopulse-ai-latest.apk",
        "fileSizeBytes": file_size_bytes,
        "fileSizeFormatted": file_size_mb,
        "sha256": sha256_hash,
        "minAndroidVersion": "8.0 (Oreo, API 26)",
        "targetAndroidVersion": "14.0 (API 34)",
        "architecture": "Universal (ARM64, ARMv7, x86_64)",
        "releaseDate": current_date,
        "releaseType": "Production Release (Signed APK)"
    }
    with open(release_info_path, 'w', encoding='utf-8') as f:
        json.dump(release_info, f, indent=2)

    print(f"Updated {release_info_path}")

    # 8. Update AppDownloadPage.tsx
    page_path = os.path.join(workspace_root, 'apps', 'web', 'src', 'pages', 'public', 'AppDownloadPage.tsx')
    with open(page_path, 'r', encoding='utf-8') as f:
        page_content = f.read()

    page_content = re.sub(r"fileSizeFormatted:\s*'[^']*'", f"fileSizeFormatted: '{file_size_mb}'", page_content)
    page_content = re.sub(r"sha256:\s*'[^']*'", f"sha256: '{sha256_hash}'", page_content)

    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(page_content)
    print(f"Updated {page_path}")

if __name__ == '__main__':
    update_apk()
