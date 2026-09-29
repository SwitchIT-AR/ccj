#!/bin/bash

# Recorre todos los archivos que empiezan con slide1
for file in slide1*; do
  # Verifica que sea archivo (no carpeta)
  if [[ -f "$file" ]]; then
    # Si el archivo también empieza con slide2 (por ejemplo: slide2-slide1.jpg), renombrar primero esa parte
    if [[ "$file" == slide2* ]]; then
      newname="familien-fest${file#slide2}"
      echo "Renombrando $file → $newname"
      mv "$file" "$newname"
    fi

    # Luego renombrar slide1 → slide2
    if [[ "$file" == slide1* ]]; then
      newname="slide2${file#slide1}"
      echo "Renombrando $file → $newname"
      mv "$file" "$newname"
    fi
  fi
done
