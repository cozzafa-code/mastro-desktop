f=open('components/MastroERP.tsx','r',encoding='utf-8')
t=f.read()
f.close()
old='useEffect(() => persistAndSync(syncReady, isUuid, sync, "cantieri", cantieri), [cantieri]);'
new='// DESKTOP: read-only, no overwrite Supabase\n  // useEffect(() => persistAndSync(syncReady, isUuid, sync, "cantieri", cantieri), [cantieri]);'
t=t.replace(old,new)
f=open('components/MastroERP.tsx','w',encoding='utf-8',newline='\n')
f.write(t)
f.close()
print('done')
