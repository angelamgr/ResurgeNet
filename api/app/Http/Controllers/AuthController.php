<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function loginUser(Request $request){
        $request->validate(['usuario' => 'required', 'password' => 'required']);
        $user = DB::table('usuario')->where('usuario', $request->usuario)->first();
        if (!$user) return response()->json(['message' => 'Credenciales incorrectas'], 401);

        \Log::info("Password recibida: " . $request->password);
        \Log::info("Hash generado: " . hash('sha256', $request->password));
        \Log::info("Hash en BD: " . $user->password);

        $hashGenerado = hash('sha256', $request->password);
        if ($hashGenerado !== $user->password) {
            return response()->json(['message' => 'Contraseña incorrecta', 'debug' => [
                'enviada_texto_plano' => $request->password,
                'hash_que_genero_php' => $hashGenerado,
                'hash_que_hay_en_bd'  => $user->password,
                'comparacion_match'   => ($hashGenerado === $user->password)
            ]], 401);
        }

        session(['id_usuario' => $user->id_usuario]);
        session(['rol' => intval($user->rol)]);

        $redirect = '';
        switch(intval($user->rol)){
            case 1: $redirect = 'admin_dashboard.html'; break;
            case 2: $redirect = 'consumidor_dashboard.html'; break;
            case 3: $redirect = 'dashboard_validador.html'; break;
            case 4: $redirect = 'comercio_dashboard.html'; break;
            default: $redirect = 'index.html';
        }
        return response()->json(['message' => 'Sesión iniciada', 'redirect' => $redirect, 'id_usuario' => $user->id_usuario]);
    }

    public function logoutUser(Request $request){
        $request->session()->forget('id_usuario');
        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function registerConsumer(Request $request){
        try {
            $id_usuario = DB::table('usuario')->insertGetId([
                'nombre' => $request->nombre, 'usuario' => $request->username,
                'password' => hash('sha256', $request->password), 'rol' => 2,
            ]);
            if (!$id_usuario) return response()->json(['message' => 'Error al crear la cuenta de usuario.'], 500);

            $date_object = \DateTime::createFromFormat('d/m/Y', $request->input('fecha_nacimiento'));
            if ($date_object === false) return response()->json(['message' => 'Formato de fecha incorrecto. Use DD/MM/YYYY.'], 400);

            DB::table('consumidor')->insert([
                'id' => $id_usuario, 'direccion' => $request->direccion,
                'ciudad' => $request->ciudad, 'cod_postal' => $request->cod_postal,
                'n_telefono' => $request->telefono, 'email' => $request->email,
                'fecha_nac' => $date_object->format('Y-m-d'),
            ]);
            return response()->json(['message' => 'Registro completado con éxito.', 'redirect' => 'inicio_sesion.html']);
        } catch (\Exception $e) {
            \Log::error("Error de registro de consumidor: " . $e->getMessage());
        }
    }

    public function registerProduct(Request $request) {
        try {
            $id_comercio = $request->input('id_comercio');
            if (!$id_comercio) return response()->json(['message' => 'Error: Identificador de comercio no encontrado.'], 401);

            $rutaImagen = null;
            if ($request->hasFile('imagen')) {
                $file = $request->file('imagen');
                $nombreImagen = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/productos'), $nombreImagen);
                $rutaImagen = 'uploads/productos/' . $nombreImagen;
            }
            $id_producto = DB::table('productos')->insertGetId([
                'nombre' => $request->input('nombre'), 'tipo' => $request->input('tipo'),
                'descripcion' => $request->input('descripcion'), 'precio' => $request->input('precio'),
                'stock' => $request->input('stock'), 'imagen' => $rutaImagen, 'id_comercio' => $id_comercio,
            ]);
            return response()->json(['message' => 'Producto registrado con éxito.', 'id_producto' => $id_producto], 201);
        } catch (\Exception $e) {
            \Log::error("Error al registrar producto: " . $e->getMessage());
            return response()->json(['message' => 'Error interno del servidor', 'error_real' => $e->getMessage()], 500);
        }
    }

    public function getConsumers() {
        try {
            return response()->json(DB::table('usuario')->where('rol', 2)->select('id_usuario', 'nombre')->get());
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    public function deleteConsumer($id) {
        try {
            DB::beginTransaction();
            DB::table('usuario')->where('id_usuario', $id)->delete();
            DB::commit();
            return response()->json(['message' => 'Consumidor eliminado con éxito'], 200);
        } catch (\Exception $e) { DB::rollBack(); return response()->json(['error' => 'No se pudo eliminar: ' . $e->getMessage()], 500); }
    }

    public function getComerciosEspera() {
        try {
            return response()->json(DB::table('solicitudComercio')->where('estado', 'aceptada')->select('id_solicitud', 'nombreComercio', 'email', 'ciudad')->get());
        } catch (\Exception $e) { return response()->json(['error' => 'Error al obtener datos: ' . $e->getMessage()], 500); }
    }

    public function activarComercio($id) {
        try {
            $solicitud = DB::table('solicitudComercio')->where('id_solicitud', $id)->first();
            if (!$solicitud) return response()->json(['error' => 'Solicitud no encontrada'], 404);
            $idUsuario = DB::table('usuario')->where('usuario', $solicitud->nombreComercio)->value('id_usuario');
            if (!$idUsuario) return response()->json(['error' => 'Usuario no encontrado'], 404);
            DB::table('comercio')->insert(['id' => $idUsuario, 'ciudad' => $solicitud->ciudad, 'direccion' => $solicitud->ciudad,
                'n_telefono' => $solicitud->n_telefono, 'tiene_web' => $solicitud->tiene_web, 'estado' => 'activo', 'nombreComercio' => $solicitud->nombreComercio]);
            DB::table('solicitudComercio')->where('id_solicitud', $id)->update(['estado' => 'alta admin']);
            $emailComercio = $solicitud->email ?? null;
            $nombreComercio = $solicitud->nombreComercio ?? 'Comercio';
            if ($emailComercio) {
                Mail::raw("Hola $nombreComercio,\nSu solicitud ha sido aceptada.\nUsuario: $solicitud->nombreComercio\nContraseña: $solicitud->nombreComercio\n\nSaludos,\nResurgeNet",
                    function ($message) use ($emailComercio) { $message->to($emailComercio)->subject("Solicitud aceptada"); });
            }
            return response()->json(['message' => 'Comercio activado correctamente y email enviado'], 200);
        } catch (\Exception $e) { return response()->json(['error' => 'Error: ' . $e->getMessage()], 500); }
    }

    public function getComerciosGestion() {
        try {
            return response()->json(DB::table('usuario')->join('comercio', 'usuario.id_usuario', '=', 'comercio.id')
                ->whereIn('comercio.estado', ['activo', 'desactivado tmp'])->select('usuario.id_usuario', 'comercio.nombreComercio', 'comercio.estado')->get());
        } catch (\Exception $e) { return response()->json(['error' => 'Error: ' . $e->getMessage()], 500); }
    }

    public function estadoActivoComercio($id) {
        try { DB::table('comercio')->where('id', $id)->update(['estado' => 'activo']); return response()->json(['message' => 'Comercio activado correctamente']);
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    public function estadoDesactivarComercio($id) {
        try { DB::table('comercio')->where('id', $id)->update(['estado' => 'desactivado tmp']); return response()->json(['message' => 'Comercio desactivado correctamente']);
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    public function deleteComercio($id) {
        try {
            $eliminado = DB::table('comercio')->where('id', $id)->delete();
            return $eliminado ? response()->json(['message' => 'Comercio eliminado con éxito']) : response()->json(['error' => 'No se encontró el comercio'], 404);
        } catch (\Exception $e) { return response()->json(['error' => 'Error al eliminar: ' . $e->getMessage()], 500); }
    }

    public function solicitudComercio(Request $request){
        $validated = $request->validate([
            'nombre_personal' => 'required|string|max:50', 'nombre_comercio' => 'required|string|max:50',
            'email' => 'required|email|max:40', 'ciudad' => 'required|string|max:40',
            'telefono' => 'required|string|max:10', 'motivo' => 'required|string|max:300', 'web_operativa' => 'required|in:si,no',
        ]);
        DB::table('solicitudComercio')->insert([
            'nombrePropietario' => $validated['nombre_personal'], 'nombreComercio' => $validated['nombre_comercio'],
            'email' => $validated['email'], 'ciudad' => $validated['ciudad'], 'n_telefono' => $validated['telefono'],
            'motivoSolicitud' => $validated['motivo'], 'tiene_web' => $validated['web_operativa'] === 'si'
        ]);
        return response()->json(['message' => 'Tu solicitud ha sido enviada correctamente.']);
    }

    public function getSolicitudesComercio() {
        try {
            return response()->json(DB::table('solicitudComercio')->whereIn('estado', ['pendiente'])->select('id_solicitud', 'nombreComercio', 'motivoSolicitud')->get());
        } catch (\Exception $e) { return response()->json(['error' => 'Error: ' . $e->getMessage()], 500); }
    }

    public function denegarSolicitudComercio($id) {
        try {
            DB::table('solicitudComercio')->where('id_solicitud', $id)->update(['estado' => 'denegada']);
            $solicitud = DB::table('solicitudComercio')->where('id_solicitud', $id)->first();
            if (!$solicitud) return response()->json(['error' => 'Solicitud no encontrada'], 404);
            $emailComercio = $solicitud->email ?? null;
            $nombreComercio = $solicitud->nombreComercio ?? 'Comercio';
            if ($emailComercio) {
                Mail::raw("Hola $nombreComercio,\n\nLamentablemente su solicitud ha sido denegada.\n\nSaludos,\nResurgeNet",
                    function ($message) use ($emailComercio) { $message->to($emailComercio)->subject("Solicitud denegada"); });
            }
            return response()->json(['message' => 'Solicitud denegada correctamente']);
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    public function aceptarSolicitudComercio($id) {
        try {
            $solicitud = DB::table('solicitudComercio')->where('id_solicitud', $id)->first();
            if (!$solicitud) return response()->json(['error' => 'Solicitud no encontrada'], 404);
            DB::table('solicitudComercio')->where('id_solicitud', $id)->update(['estado' => 'aceptada']);
            DB::table('usuario')->insert(['nombre' => $solicitud->nombrePropietario, 'usuario' => $solicitud->nombreComercio,
                'password' => bcrypt($solicitud->nombreComercio), 'rol' => '3']);
            return response()->json(['message' => 'Solicitud aceptada y usuario creado correctamente']);
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    public function getProductosComercio($id_usuario) {
        try {
            return response()->json(DB::table('productos')->where('id_comercio', $id_usuario)->select('id_producto', 'nombre', 'id_comercio')->get());
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    public function getInfoProducto($id_producto) {
        try {
            return response()->json(DB::table('productos')->where('id_producto', $id_producto)
                ->select('id_producto', 'nombre', 'tipo', 'descripcion', 'precio', 'stock', 'imagen')->first());
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    public function actualizarProducto(Request $request, $id_producto) {
        try {
            $data = ['nombre' => $request->nombre, 'tipo' => $request->tipo, 'descripcion' => $request->descripcion,
                'precio' => $request->precio, 'stock' => $request->stock];
            if ($request->hasFile('imagen')) {
                $data['imagen'] = $request->file('imagen')->store('uploads/productos', 'public');
            }
            DB::table('productos')->where('id_producto', $id_producto)->update($data);
            return response()->json(['message' => 'Producto actualizado correctamente']);
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    // -------------------------------------------------------
    // Obtener perfil completo del consumidor (GET)
    // -------------------------------------------------------
    public function getPerfilConsumidor($id) {
        try {
            $perfil = DB::table('usuario')
                ->join('consumidor', 'usuario.id_usuario', '=', 'consumidor.id')
                ->where('usuario.id_usuario', $id)
                ->select('usuario.nombre', 'consumidor.email', 'consumidor.ciudad',
                    'consumidor.n_telefono', 'consumidor.direccion', 'consumidor.cod_postal', 'consumidor.fecha_nac')
                ->first();
            if (!$perfil) return response()->json(['error' => 'Consumidor no encontrado'], 404);
            if ($perfil->fecha_nac) {
                $perfil->fecha_nac = \DateTime::createFromFormat('Y-m-d', $perfil->fecha_nac)->format('d/m/Y');
            }
            return response()->json($perfil);
        } catch (\Exception $e) { return response()->json(['error' => $e->getMessage()], 500); }
    }

    // -------------------------------------------------------
    // Actualizar perfil del consumidor (PUT)
    // Solo actualiza los campos que han cambiado realmente
    // -------------------------------------------------------
    public function actualizarPerfilConsumidor(Request $request, $id) {
        try {
            $actual = DB::table('usuario')
                ->join('consumidor', 'usuario.id_usuario', '=', 'consumidor.id')
                ->where('usuario.id_usuario', $id)
                ->select('usuario.nombre', 'consumidor.email', 'consumidor.ciudad',
                    'consumidor.n_telefono', 'consumidor.direccion', 'consumidor.cod_postal', 'consumidor.fecha_nac')
                ->first();
            if (!$actual) return response()->json(['error' => 'Consumidor no encontrado'], 404);

            $fecha_raw = $request->input('fecha_nacimiento');
            $fecha_sql = null;
            if ($fecha_raw) {
                $date_object = \DateTime::createFromFormat('d/m/Y', $fecha_raw);
                if ($date_object === false) return response()->json(['error' => 'El formato de la fecha debe ser DD/MM/AAAA.'], 400);
                if ($date_object >= new \DateTime('today')) return response()->json(['error' => 'La fecha de nacimiento no puede ser hoy ni una fecha futura.'], 400);
                $fecha_sql = $date_object->format('Y-m-d');
            }

            $datosUsuario = [];
            if ($request->input('nombre') !== $actual->nombre) $datosUsuario['nombre'] = $request->input('nombre');
            if ($request->input('password')) $datosUsuario['password'] = hash('sha256', $request->input('password'));

            $datosConsumidor = [];
            if ($request->input('email')      !== $actual->email)      $datosConsumidor['email']      = $request->input('email');
            if ($request->input('ciudad')     !== $actual->ciudad)     $datosConsumidor['ciudad']     = $request->input('ciudad');
            if ($request->input('n_telefono') !== $actual->n_telefono) $datosConsumidor['n_telefono'] = $request->input('n_telefono');
            if ($request->input('direccion')  !== $actual->direccion)  $datosConsumidor['direccion']  = $request->input('direccion');
            if ($request->input('cod_postal') !== $actual->cod_postal) $datosConsumidor['cod_postal'] = $request->input('cod_postal');
            if ($fecha_sql && $fecha_sql !== $actual->fecha_nac)       $datosConsumidor['fecha_nac']  = $fecha_sql;

            if (empty($datosUsuario) && empty($datosConsumidor)) {
                return response()->json(['message' => 'No se detectaron cambios en tus datos.']);
            }
            if (!empty($datosUsuario))    DB::table('usuario')->where('id_usuario', $id)->update($datosUsuario);
            if (!empty($datosConsumidor)) DB::table('consumidor')->where('id', $id)->update($datosConsumidor);

            return response()->json(['message' => 'Tus datos se han actualizado correctamente.']);
        } catch (\Exception $e) {
            \Log::error('Error al actualizar perfil consumidor: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------------
    // Obtener pedidos del consumidor con paginación (GET)
    // JOIN entre pedido y comercio para obtener nombreComercio
    // -------------------------------------------------------
    public function getPedidosConsumidor(Request $request, $id) {
        try {
            $porPagina   = intval($request->query('por_pagina', 5));
            $paginaActual = intval($request->query('pagina', 1));
            $offset      = ($paginaActual - 1) * $porPagina;

            $total = DB::table('pedido')->where('id_consumidor', $id)->count();
            $totalPaginas = $total > 0 ? ceil($total / $porPagina) : 1;

            $pedidos = DB::table('pedido')
                ->join('comercio', 'pedido.id_comercio', '=', 'comercio.id')
                ->where('pedido.id_consumidor', $id)
                ->select('pedido.id_pedido', 'comercio.nombreComercio', 'pedido.estado', 'pedido.fecha')
                ->orderBy('pedido.fecha', 'desc')
                ->skip($offset)
                ->take($porPagina)
                ->get();

            return response()->json([
                'pedidos'       => $pedidos,
                'total'         => $total,
                'pagina_actual' => $paginaActual,
                'total_paginas' => $totalPaginas,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener pedidos del consumidor: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
