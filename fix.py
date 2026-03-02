import os

def restore_extensions(directory):
    for root, dirs, files in os.walk(directory):
        for filename in files:
            # Only target the files that ended up with .txt
            if filename.endswith(".txt"):
                old_path = os.path.join(root, filename)
                # Remove the .txt suffix
                new_name = filename[:-4]
                new_path = os.path.join(root, new_name)
                
                print(f"Restoring: {filename} -> {new_name}")
                os.rename(old_path, new_path)

if __name__ == "__main__":
    restore_extensions(".")
    print("\nDone! Your project files are ready.")