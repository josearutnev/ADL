# ADL Préstamos

App de cobro para una entidad informal. El rédito es un porcentaje fijo del dinero entregado: se suma al principio y se reparte en cuotas iguales. No es interés de banco sobre saldo.

Ejemplo: entregas $10.000 al 20% → rédito $2.000, total $12.000. En 24 cuotas, la cuota es $500.

## Cómo correrla

```bash
npm install
npm run dev
```

Abre [http://127.0.0.1:43123](http://127.0.0.1:43123).

Copia `.env.example` a `.env.local` si todavía no existe. Esas claves son la configuración pública de la web; no uses una cuenta de servicio.

## Primer administrador

No hay página de registro. La primera vez, la app pide crear al administrador (usuario y clave). El correo interno es `{usuario}@adl-prestamos.firebaseapp.com`; en pantalla solo se ve el usuario.

Eso usa una app secundaria de Firebase para no reemplazar la sesión. Cuando ya existe un administrador, esa pantalla se oculta. El administrador crea a los cobradores y marca las rutas de cada uno.

Quien entre con una cuenta sin perfil no ve clientes ni cobros.

## Reglas de Firestore

El proyecto `adl-prestamos` está en modo producción: **niega todas las lecturas y escrituras** hasta que publiques las reglas.

Jose, haz esto una vez:

1. Abre [Firebase console → Firestore → Reglas](https://console.firebase.google.com/project/adl-prestamos/firestore/rules).
2. Entra al proyecto **adl-prestamos**.
3. Ve a **Firestore Database → Reglas**.
4. Borra lo que hay y pega **todo** el archivo `firestore.rules` de este repositorio.
5. Pulsa **Publicar**.

Sin ese paso, la app muestra el aviso y no puede guardar nada. No hay llave de cuenta de servicio en este repo y no hace falta una para publicar las reglas a mano.

## Roles

- **Administrador:** rutas, clientes, préstamos, usuarios, todo el dinero, y anular un cobro.
- **Cobrador:** consulta y cobra solo en las rutas que le marcaron. No cambia el rédito, no borra préstamos y no ve otras rutas.

Un cliente pertenece a una ruta. Un cobrador puede tener varias rutas y una ruta puede tener varios cobradores.
