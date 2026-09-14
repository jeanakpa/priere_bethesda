import sys
import os
from datetime import date, datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, PrayerRequest
from services.export_service import ExportService

with app.app_context():
    print("Testing PDF & Word export generation...")
    reqs = PrayerRequest.query.all()
    if not reqs:
        print("No requests found in DB!")
    else:
        logo_path = os.path.join(app.config['STORAGE_DIR'], 'assets', 'eglise.png')
        for r in reqs[:5]:
            print(f"Generating for Req #{r.id} ({r.form_type}, Code: {r.tracking_code})...")
            try:
                pdf_buf = ExportService.generate_pdf(r, logo_path)
                print(f"  -> PDF generated successfully ({len(pdf_buf.getvalue())} bytes)")
            except Exception as e:
                print(f"  -> ERROR PDF: {e}")
                
            try:
                docx_buf = ExportService.generate_word(r, logo_path)
                print(f"  -> Word generated successfully ({len(docx_buf.getvalue())} bytes)")
            except Exception as e:
                print(f"  -> ERROR Word: {e}")

print("Test complete!")
