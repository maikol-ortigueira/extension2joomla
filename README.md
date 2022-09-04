# Extension2Joomla

## Como funciona
Me permite tener el código de mis extensiones organizado en una carpeta de mi equipo, realizando aquí las modificaciones necesarias para el desarrollo y actualiza en tiempo real este código hacia un sitio joomla en local para comprobar los resultados.

### Estructura de carpetas de mis extensiones
A tener en cuenta que los nombres de las extensiones deben respetarse tal y como se muestran a continuación (en inglés).
Solo en el caso de los módulos se deberá nombrar tanto el archivo de manifiesto, como el archivo de entrada con el prefijo "mod_"
El archivo de manifiesto de las plantillas es siempre "templateDetails.xml"

```
my-extensions
    |--components
    |   |
    |   '-- foo
    |       |-- admin
    |       |-- site
    |       |-- media
    |       '-- foo.xml
    |--libraries 
    |   |
    |   '-- foo
    |       |-- language
    |       |-- src
    |       '-- foo.xml
    |--modules 
    |   |
    |   '-- [ site|admin ]
    |       |
    |       '--foo
    |           |-- onefolder
    |           |-- language
    |           |-- anotherfolder
    |           |-- mod_foo.php
    |           '-- mod_foo.xml
    |--plugins 
    |   |
    |   '-- [ system|user|content|... ]
    |       |
    |       '--foo
    |           |-- forms
    |           |-- language
    |           |-- anotherfolder
    |           |-- foo.php
    |           '-- foo.xml
    '--templates 
        |
        '-- [ site|admin ]
            |
            '--foo
                |-- html
                |-- language
                |-- media
                |-- component.php
                |-- error.php
                |-- index.php
                |-- joomla.asset.json
                |-- offline.php
                |-- template_preview.png
                |-- template_thumbnail.png
                '-- templateDetails.xml
```

## Instalación
Debes tener instalado en el equipo Node.js
Realizar un clone de este repositorio a local. Dentro del repositorio local instalar paquetes node con npm update.
Renombrar fichero config.json.dist a config.json. Dentro de este fichero añadir los valores de las variables (rutas absolutas a las carpetas).
Copiar el fichero extensions-config.json.dist y pegar dentro de la carpeta origen de los ficheros de extensiones.