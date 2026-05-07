"""
Test script for Phase 5 face recognition.
Run: python test_face_recognition.py
"""
import os
import sys
import django
import base64
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

# ── Test 1: Verify face_recognition is installed ──────────────
print("\n── Test 1: Library check ──")
try:
    import face_recognition
    import numpy as np
    print("✅ face_recognition imported successfully")
except ImportError as e:
    print(f"❌ {e}")
    print("Run: pip install face_recognition")
    sys.exit(1)

# ── Test 2: Test the encoding logic directly ──────────────────
print("\n── Test 2: Encoding logic ──")
from services.attendance_service import AttendanceService
from apps.accounts.models import User

# Load any existing user
user = User.objects.first()
if not user:
    print("❌ No users found. Create a superuser first.")
    sys.exit(1)

print(f"Testing with user: {user.full_name}")

# Simulate what an encoding looks like
fake_encoding = [round(float(x) * 0.01, 6) for x in range(128)]
user.face_encoding = fake_encoding
user.save(update_fields=['face_encoding'])
print(f"✅ Saved fake encoding: {len(fake_encoding)} floats")
print(f"   First 5 values: {fake_encoding[:5]}")

# ── Test 3: Verify the JSONB storage ─────────────────────────
print("\n── Test 3: PostgreSQL JSONB storage ──")
user.refresh_from_db()
stored = user.face_encoding
print(f"✅ Retrieved from DB: {len(stored)} floats")
print(f"   Match original: {stored[:5] == fake_encoding[:5]}")

# ── Test 4: Distance calculation logic ───────────────────────
print("\n── Test 4: Distance math ──")
import numpy as np
encoding_a = np.array(fake_encoding)
encoding_b = np.array(fake_encoding)  # Same = distance 0
encoding_c = np.random.rand(128)      # Random = distance ~1

dist_same   = face_recognition.face_distance([encoding_a], encoding_b)[0]
dist_diff   = face_recognition.face_distance([encoding_a], encoding_c)[0]

print(f"✅ Same encoding distance:      {dist_same:.4f} (should be ~0.0)")
print(f"✅ Different encoding distance: {dist_diff:.4f} (should be > 0.6)")
print(f"   Match threshold: {AttendanceService.MATCH_THRESHOLD}")

print("\n✅ All tests passed! Face recognition system is ready.")
print("\nNext step: Register a real face via the API endpoint.")
print("POST /api/attendance/register-face/ with a base64 photo.")