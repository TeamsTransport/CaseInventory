import os
import re
import win32com.client
import tkinter as tk
from tkinter import filedialog
from pathlib import Path

def is_writable(path):
    try:
        test_file = os.path.join(path, "test_write.tmp")
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        return True
    except Exception:
        return False

# Hide the root window
root = tk.Tk()
root.withdraw()

# Select Excel file
file_path = filedialog.askopenfilename(
    title="Select the Excel File",
    filetypes=[("Excel Files", "*.xlsx *.xlsm *.xls")]
)

# Select folder to save PDFs
folder_path = filedialog.askdirectory(title="Select the Folder Path")

# Fallback to Documents if folder is not writable
if not is_writable(folder_path):
    print(f"⚠️ Selected folder is not writable: {folder_path}")
    folder_path = str(Path.home() / "Documents")
    print(f"📁 Falling back to: {folder_path}")

if file_path and folder_path:
    excel = win32com.client.Dispatch("Excel.Application")
    excel.Visible = False

    try:
        workbook = excel.Workbooks.Open(file_path)

        for sheet in workbook.Worksheets:
            try:
                sheet.Activate()
                if sheet.UsedRange.Cells.Count > 1:
                    sheet.PageSetup.PrintArea = sheet.UsedRange.Address
                    safe_name = re.sub(r'[\\/*?:"<>|]', "_", sheet.Name)
                    pdf_path = os.path.join(folder_path, f"{safe_name}.pdf")

                    if os.path.exists(pdf_path):
                        os.remove(pdf_path)

                    sheet.ExportAsFixedFormat(0, pdf_path)
                    print(f"✅ Saved: {pdf_path}")
                else:
                    print(f"⏭️ Skipped empty sheet: {sheet.Name}")
            except Exception as e:
                print(f"❌ Failed to save {sheet.Name}: {e}")

        workbook.Close(False)
        print("✅ Done")

    except Exception as e:
        print(f"❌ Error opening workbook: {e}")
    finally:
        excel.Quit()
else:
    print("❌ File or folder not selected.")
