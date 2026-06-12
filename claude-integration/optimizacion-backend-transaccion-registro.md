# Optimización backend: transacción en el registro de consumidores

**Fecha:** 2026-05-27  
**Autor:** Claude (asistente IA)  
**Tarea:** Optimización backend #2 — garantizar atomicidad en el registro de consumidores

---

## 1. Problema resuelto

El método `registerConsumer` realiza dos operaciones de escritura en la base de datos:

1. `INSERT` en la tabla `usuario` (credenciales de acceso).
2. `INSERT` en la tabla `consumidor` (datos del perfil).

Antes de esta corrección, ambas operaciones se ejecutaban de forma **independiente y sin transacción**. Si la primera tenía éxito pero la segunda fallaba (por un error de validación de la fecha, un fallo de conexión, una violación de restricción en la BD, o cualquier otra excepción), la base de datos quedaba en un **estado inconsistente**: existía un registro en `usuario` sin su correspondiente fila en `consumidor`.

El análisis completo del problema está en `auditoria-backend-prioridad-alta.md`, sección 5.

---

## 2. Solución aplicada

Se han realizado dos cambios en `registerConsumer`:

### Cambio 1 — Validar la fecha antes de abrir la transacción

Antes, la validación del formato de fecha se hacía **después** del primer `INSERT`. Si el formato era incorrecto, el método devolvía un 400, pero el registro en `usuario` ya existía en la base de datos.

Ahora la validación de la fecha (y de su obligatoriedad) se hace **antes de cualquier operación de base de datos**. Si los datos de entrada son inválidos, se devuelve el error al cliente sin haber tocado la BD:

```php
// Validar ANTES de abrir la transaccion
$fecha_raw = $request->input('fecha_nacimiento');
if (!$fecha_raw) {
    return response()->json(['message' => 'La fecha de nacimiento es obligatoria.'], 400);
}
$date_object = \DateTime::createFromFormat('d/m/Y', $fecha_raw);
if ($date_object === false) {
    return response()->json(['message' => 'Formato de fecha incorrecto. Use DD/MM/YYYY.'], 400);
}
if ($date_object >= new \DateTime('today')) {
    return response()->json(['message' => 'La fecha no puede ser hoy ni futura.'], 400);
}
$fecha_sql = $date_object->format('Y-m-d');
```

### Cambio 2 — Envolver ambos INSERT en `DB::transaction()`

Los dos `INSERT` se agrupan dentro de `DB::transaction()`. Laravel gestiona automáticamente el `BEGIN`, `COMMIT` y `ROLLBACK`:

```php
DB::transaction(function () use ($request, $fecha_sql) {
    $id_usuario = DB::table('usuario')->insertGetId([
        'nombre'   => $request->nombre,
        'usuario'  => $request->username,
        'password' => hash('sha256', $request->password),
        'rol'      => 2,
    ]);

    DB::table('consumidor')->insert([
        'id'         => $id_usuario,
        'direccion'  => $request->direccion,
        'ciudad'     => $request->ciudad,
        'cod_postal' => $request->cod_postal,
        'n_telefono' => $request->telefono,
        'email'      => $request->email,
        'fecha_nac'  => $fecha_sql,
    ]);
});
```

Si el `INSERT` en `consumidor` lanza cualquier excepción, `DB::transaction()` ejecuta automáticamente un `ROLLBACK` que deshace el `INSERT` en `usuario`. La base de datos queda exactamente en el mismo estado que antes de intentar el registro.

---

## 3. Comparativa antes y después

### Escenario: fallo en el segundo INSERT

**Antes:**
```
INSERT usuario  -> OK  (fila creada con id=42)
Validar fecha   -> ERROR: formato incorrecto
Retorna 400     -> La fila del usuario 42 sigue en la BD sin consumidor asociado
                   Estado inconsistente: username ocupado, perfil inexistente
```

**Después:**
```
Validar fecha   -> ERROR: formato incorrecto
Retorna 400     -> Ningun INSERT se ha ejecutado
                   BD en estado limpio: el usuario puede intentar registrarse de nuevo
```

### Escenario: fallo de conexion durante el segundo INSERT

**Antes:**
```
BEGIN implicito
INSERT usuario  -> OK
INSERT consumidor -> FALLO (excepcion)
Catch -> Retorna 500
         La transaccion queda abierta o se hace commit parcial segun el driver
         Estado inconsistente garantizado
```

**Después:**
```
DB::transaction() abre BEGIN
INSERT usuario  -> OK
INSERT consumidor -> FALLO (excepcion)
DB::transaction() ejecuta ROLLBACK automatico
Catch -> Retorna 500
         BD en estado limpio: el INSERT de usuario se ha deshecho
```

---

## 4. Por qué `DB::transaction()` y no `beginTransaction()`/`commit()`/`rollBack()` manual

Laravel ofrece dos formas de gestionar transacciones:

```php
// Forma manual (como en deleteConsumer)
DB::beginTransaction();
try {
    // operaciones
    DB::commit();
} catch (\Exception $e) {
    DB::rollBack();
    throw $e;
}

// Forma con closure (usada en registerConsumer)
DB::transaction(function () {
    // operaciones
});
```

Se usa `DB::transaction()` con closure porque:
- Es mas concisa y menos propensa a errores: no es posible olvidar el `rollBack()` en el catch.
- Laravel gestiona automaticamente el rollback si el closure lanza cualquier excepcion.
- El codigo queda mas legible: queda claro que las operaciones dentro del closure son atomicas.

---

## 5. Archivo modificado

| Archivo | Cambio |
|---|---|
| `api/app/Http/Controllers/AuthController.php` | `registerConsumer`: validacion de fecha movida antes de la transaccion; ambos INSERT envueltos en `DB::transaction()` |
