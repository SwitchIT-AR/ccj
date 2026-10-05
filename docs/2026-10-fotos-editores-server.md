# Fotos subidas desde los editores: deploy sin perderlas

Desde el commit que deja de versionar las fotos de los editores (`public/img/...` listado en
`.gitignore`), esas fotos viven solo en cada server. Como el commit las borra del repo, un
`git pull` a secas las borraría del server. Antes del pull:

```bash
cd /ruta/al/proyecto
mkdir -p ~/bkp-fotos-$(date +%F)
cp -a public/img ~/bkp-fotos-$(date +%F)/              # backup completo de las imágenes
git pull
# restaurar las fotos que git haya tocado o borrado:
cp -a ~/bkp-fotos-$(date +%F)/img/. public/img/        # OJO: pisa con la copia del backup
pm2 restart ccj                                        # o el nombre del proceso
```

Antes de correr el `cp` de restauración, revisá con `git status` qué archivos cambió el pull. Si
el colegio subió una foto nueva después del backup, no la pises: restaurá solo las que faltan:

```bash
cp -n -a ~/bkp-fotos-FECHA/img/. public/img/          # -n: no pisa lo que ya existe
```

Los archivos que git ya no trackea (las fotos de los editores) quedan en el disco como estaban.
