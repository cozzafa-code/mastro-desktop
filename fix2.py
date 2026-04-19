import pathlib
f = pathlib.Path('components/MastroDesktop.tsx')
t = f.read_text(encoding='utf-8')
# Fix the broken createClient block
old = '''const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fgefcigxlbrmbeqqzjmo.supabase.co";'''
new = '''const supabase = createClient(
  "https://fgefcigxlbrmbeqqzjmo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZWZjaWd4bGJybWJlcXF6am1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NjQ2NjAsImV4cCI6MjA1NTU0MDY2MH0.r2cNPGpb5MMy99kEMIRSgHgBBmJU1gfjsGOEFWBYfwY"
);'''
t = t.replace(old, new)
f.write_text(t, encoding='utf-8', newline='\n')
print('MastroDesktop.tsx fixed')
