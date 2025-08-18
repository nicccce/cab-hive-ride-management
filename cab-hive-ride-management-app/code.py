import os
import subprocess
import sys

def open_vscode():
    current_dir = os.getcwd()
    try:
        # 直接调用 code 命令（兼容 CMD 和 PowerShell）
        subprocess.run(["code", current_dir], shell=True)  # 关键：添加 shell=True
    except Exception as e:
        print(f"错误：无法调用 VS Code\n{e}")
        input("按 Enter 退出...")
        sys.exit(1)

if __name__ == "__main__":
    open_vscode()