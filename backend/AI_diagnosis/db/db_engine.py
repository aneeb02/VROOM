import os
from supabase import create_client

url: str = os.environ.get("SUPABASE_URL", "https://iswqidiznelibifkfatg.supabase.co")
key: str = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzd3FpZGl6bmVsaWJpZmtmYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTI5NTQsImV4cCI6MjA3NjM2ODk1NH0.pB8oaaAcqvxJUBLeXcNSQFE1dmIbc5b4meI1c0rsGlw")
supabase = create_client(url, key)
# expose a tiny async helper
async def get_supabase():
    return supabase