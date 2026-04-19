key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZWZjaWd4bGJybWJlcXF6am1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NjQ2NjAsImV4cCI6MjA1NTU0MDY2MH0.r2cNPGpb5MMy99kEMIRSgHgBBmJU1gfjsGOEFWBYfwY'
url = 'https://fgefcigxlbrmbeqqzjmo.supabase.co'
import pathlib, re
for fp in ['lib/supabase.ts', 'components/MastroDesktop.tsx', 'components/mastro-sync.tsx']:
    f = pathlib.Path(fp)
    if not f.exists(): continue
    t = f.read_text(encoding='utf-8')
    t = re.sub(r'process\.env\.NEXT_PUBLIC_SUPABASE_URL[!\s]*(?:\|\|[^;]*)?', f'process.env.NEXT_PUBLIC_SUPABASE_URL || "{url}"', t)
    t = re.sub(r'process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY[!\s]*(?:\|\|[^;]*)?', f'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "{key}"', t)
    f.write_text(t, encoding='utf-8', newline='\n')
    print(f'{fp} fixed')
