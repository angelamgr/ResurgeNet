<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    //funcion para el inicio se sesion del usuario
    public function loginUser(Request $request){
        // Validación
        $request->validate([
            'usuario' => 'required',
            'password' => 'required'
        ]);

        // Buscar el usuario en la base de datos
        $user = DB::table('usuario')->where('usuario', $request->usuario)->first(); 

        if (!$user) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }
        \Log::info("Password recibida: " . $request->password);
        \Log::info("Hash generado: " . hash('sha256', $request->password));
        \Log::info("Hash en BD: " . $user->password);

        // Comprobamos la contraseña (SHA-256 si usas trigger en BD)
        /*xif (hash('sha256', $request->password) !== $user->password) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }*/
        $hashGenerado = hash('sha256', $request->password);
        if ($hashGenerado !== $user->password) {
        return response()->json([
            'message' => 'Contraseña incorrecta',
            'debug' => [
                'enviada_texto_plano' => $request->password,
                'hash_que_genero_php' => $hashGenerado,
                'hash_que_hay_en_bd'  => $user->password,
                'comparacion_match'   => ($hashGenerado === $user->password)
            ]
        ], 401);
    }

        // Guardar sesión
        session(['id_usuario' => $user->id_usuario]);
        session(['rol' => intval($user->rol)]);

        // Redirigir según rol
        $redirect = '';
        switch(intval($user->rol)){
            case 1: // Administrador
                $redirect = 'admin_dashboard.html';
                break;
            case 2: // Consumidor
                $redirect = 'consumidor_dashboard.html';
                break;
            case 3: // Validador de comercio
                $redirect = 'dashboard_validador.html';
                break;
            case 4: // Comercio
                $redirect = 'comercio_dashboard.html';
                break;
            default: // Otros roles
                $redirect = 'index.html';
        }

        return response()->json([
            'message' => 'Sesión iniciada',
            'redirect' => $redirect,
            'id_usuario' => $user->id_usuario // devolvemos el id_usuario en la respuesta
        ]);
    }

    //funcion para el cierre de sesion del usuario
    public function logoutUser(Request $request){
        $request->session()->forget('id_usuario'); // eliminar sesión
        return response()->json([
            'message' => 'Sesión cerrada'
        ]);
    }

    //funcion para el registro de un consumidor
    public function registerConsumer(Request $request){
        try {
            // --- 1. INSERCIÓN EN TABLA 'usuario' ---
            $id_usuario = DB::table('usuario')->insertGetId([
                'nombre' => $request->nombre,
                'usuario' => $request->username, 
                'password' => hash('sha256', $request->password),
                'rol' => 2,
            ]);

            if (!$id_usuario) {
                return response()->json(['message' => 'Error al crear la cuenta de usuario.'], 500);
            }

            // --- 2. PREPARACIÓN DE LA FECHA ---
            $fecha_raw = $request->input('fecha_nacimiento'); 
            $date_object = \DateTime::createFromFormat('d/m/Y', $fecha_raw);

            if ($date_object !== false) {
                $fecha_nacimiento_sql = $date_object->format('Y-m-d');
            } else {
                return response()->json([
                    'message' => 'El formato de fecha de nacimiento es incorrecto o está vacío. Use DD/MM/YYYY.'
                ], 400); 
            }
                        
            // --- 3. INSERCIÓN EN TABLA 'consumidor' ---
            DB::table('consumidor')->insert([
                'id' => $id_usuario, 
                'direccion' => $request->direccion,
                'ciudad' => $request->ciudad,
                'cod_postal' => $request->cod_postal,
                'n_telefono' => $request->telefono,
                'email' => $request->email,
                'fecha_nac' => $fecha_nacimiento_sql, 
            ]);

            return response()->json([
                'message' => 'Registro completado con éxito.',
                'redirect' => 'inicio_sesion.html'
            ]);

        } catch (\Exception $e) {
            \Log::error("Error de registro de consumidor: " . $e->getMessage());       
        }
    }

    public function registerProduct(Request $request) {
        try {
            // Intentamos obtenerlo del request enviado manualmente
            $id_comercio = $request->input('id_comercio');

            if (!$id_comercio) {
                return response()->json(['message' => 'Error: Identificador de comercio no encontrado.'], 401);
            }
            // Gestion de la imagen
            $rutaImagen = null;
            if ($request->hasFile('imagen')) {
                $file = $request->file('imagen');
                $nombreImagen = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/productos'), $nombreImagen);
                $rutaImagen = 'uploads/productos/' . $nombreImagen;
            }

            // Inserción en la tabla 'productos' 
            $id_producto = DB::table('productos')->insertGetId([
                'nombre'      => $request->input('nombre'),
                'tipo'        => $request->input('tipo'),
                'descripcion' => $request->input('descripcion'),
                'precio'      => $request->input('precio'),
                'stock'       => $request->input('stock'),
                'imagen'      => $rutaImagen,
                'id_comercio' => $id_comercio, // ID obtenido de la sesión
            ]);

            return response()->json([
                'message' => 'Producto registrado con éxito.',
                'id_producto' => $id_producto
            ], 201);

        } catch (\Exception $e) {
            \Log::error("Error al registrar producto: " . $e->getMessage());
            return response()->json([
                'message' => 'Error interno del servidor',
                'error_real' => $e->getMessage() 
            ], 500);
        }
    }

    //funcion para eliminar un consumidor (solo para admin)
        //funcion para obtener todos los consumidores
    public function getConsumers() {
        try {
            $consumidores = DB::table('usuario')
                ->where('rol', 2) //este es el rol que tiene asignado el consumidor
                ->select('id_usuario','nombre') //nos quedamos con el nombre del mismo y el id que lo necesitamos para eliminarlo posteriormente
                ->get();
                
            return response()->json($consumidores);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
        //funcion para eliminar al consumidor
    public function deleteConsumer($id) {
        try {
            // Iniciamos una transacción para asegurar que se borre en ambos sitios o en ninguno
            DB::beginTransaction();

            // Borramos de la tabla 'usuario' ya que esta implementado con un ON CASCADE, si borramos aqui se borra tambien en consumidor
            DB::table('usuario')->where('id_usuario', $id)->delete();

            DB::commit();

            return response()->json(['message' => 'Consumidor eliminado con éxito'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'No se pudo eliminar: ' . $e->getMessage()], 500);
        }
    }

    //funcion para obtener el listado de comercios en espera de validacion (solo para admin)
                //mostramos los comercios que tenemos en validacion de la tabla solicitudComercio, ya que es donde se guardan las solicitudes aprobadas por el validador 
    public function getComerciosEspera() { 
        try {
            $comercios = DB::table('solicitudComercio')
                ->where('estado', 'aceptada') // Solo solicitudes aceptadas por el validador
                ->select('id_solicitud', 'nombreComercio', 'email', 'ciudad')
                ->get();

            return response()->json($comercios);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener datos: ' . $e->getMessage()], 500);
        }
    }

    //funcion para dar de alta a un comercio en espera (solo para admin) 
    public function activarComercio($id) {
    try {
        $solicitud = DB::table('solicitudComercio')
            ->where('id_solicitud', $id)
            ->first();

        if (!$solicitud) {
            return response()->json(['error' => 'Solicitud no encontrada'], 404);
        }

        $idUsuario = DB::table('usuario')
            ->where('usuario', $solicitud->nombreComercio)
            ->value('id_usuario');

        if (!$idUsuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        DB::table('comercio')->insert([
            'id' => $idUsuario,
            'ciudad' => $solicitud->ciudad,
            'direccion' => $solicitud->ciudad, // si no lo tienes en la solicitud
            'n_telefono' => $solicitud->n_telefono,
            'tiene_web' => $solicitud->tiene_web,
            'estado' => 'activo',
            'nombreComercio' => $solicitud->nombreComercio
        ]);

        DB::table('solicitudComercio')
            ->where('id_solicitud', $id)
            ->update(['estado' => 'alta admin']);

        // Enviamos el mail de confirmación usando log
        $emailComercio = $solicitud->email ?? null;
        $nombreComercio = $solicitud->nombreComercio ?? 'Comercio';

        if ($emailComercio) {
            Mail::raw(
                "Hola $nombreComercio,\nSu solicitud ha sido aceptada y se ha dado de alta en nuestra plataforma.
                Sus credenciales de acceso son:
                Usuario: $solicitud->nombreComercio
                Contraseña: $solicitud->nombreComercio

                Saludos,
                ResurgeNet",
                function ($message) use ($emailComercio) {
                $message->to($emailComercio)->subject("Solicitud aceptada");
                }
            );
        }

        return response()->json(['message' => 'Comercio activado correctamente y email enviado'], 200);
        } catch (\Exception $e) {
                return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
            }
        }

    //funcion para obtener el listado de comercios activos y desactivado tmp (para administrador)
    public function getComerciosGestion() { 
        try {
            $comercios = DB::table('usuario')
                ->join('comercio', 'usuario.id_usuario', '=', 'comercio.id') 
                ->whereIn('comercio.estado', ['activo', 'desactivado tmp']) 
                ->select('usuario.id_usuario', 'comercio.nombreComercio', 'comercio.estado')
                ->get();
                
            return response()->json($comercios);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    //funcion para cambiar el estado del comercio (activo/descativado tmp) (solo para admin)
    public function estadoActivoComercio($id) {
        try {
            DB::table('comercio')->where('id', $id)->update(['estado' => 'activo']);
            return response()->json(['message' => 'Comercio activado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function estadoDesactivarComercio($id) {
        try {
            DB::table('comercio')->where('id', $id)->update(['estado' => 'desactivado tmp']);
            return response()->json(['message' => 'Comercio desactivado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    //funcion para eliminar un comercio (solo para admin)
    public function deleteComercio($id) {
        try {
            $eliminado = DB::table('comercio')->where('id', $id)->delete();

            if ($eliminado) {
                return response()->json(['message' => 'Comercio eliminado con éxito']);
            } else {
                return response()->json(['error' => 'No se encontró el comercio'], 404);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar: ' . $e->getMessage()], 500);
        }
    }

    //funcion para recoger los datos del formulario de contacto del comercio y guardarlos en la base de datos
    public function solicitudComercio(Request $request){

        $validated = $request->validate([
            'nombre_personal' => 'required|string|max:50',
            'nombre_comercio' => 'required|string|max:50',
            'email'           => 'required|email|max:40',
            'ciudad'          => 'required|string|max:40',
            'telefono'        => 'required|string|max:10',
            'motivo'          => 'required|string|max:300',
            'web_operativa'   => 'required|in:si,no',
        ]);

        DB::table('solicitudComercio')->insert([
            'nombrePropietario' => $validated['nombre_personal'],
            'nombreComercio'    => $validated['nombre_comercio'],
            'email'             => $validated['email'],
            'ciudad'            => $validated['ciudad'],
            'n_telefono'        => $validated['telefono'],
            'motivoSolicitud'   => $validated['motivo'],
            'tiene_web'         => $validated['web_operativa'] === 'si'
        ]);

        return response()->json([
            'message' => 'Tu solicitud ha sido enviada correctamente.'
        ]);
    }

    //funcion para mostrar el listado de solicitudes de comercio (solo para validador)
    public function getSolicitudesComercio() {
        try {
            $solicitudes = DB::table('solicitudComercio')
                -> whereIn('estado', ['pendiente']) // Solo solicitudes pendientes
                ->select('id_solicitud', 'nombreComercio', 'motivoSolicitud')
                ->get();

            return response()->json($solicitudes);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
        }
    }
    //función para denegar la peticion del comercio (solo para validador)
   public function denegarSolicitudComercio($id) {
        try {
            // Cambiar el estado de la solicitud a 'denegada'
            DB::table('solicitudComercio')->where('id_solicitud', $id)->update(['estado' => 'denegada']);

            // Obtener datos del comercio, necesitamos el email
            $solicitud = DB::table('solicitudComercio')->where('id_solicitud', $id)->first();

            if (!$solicitud) {
                return response()->json(['error' => 'Solicitud no encontrada'], 404);
            }

            $emailComercio = $solicitud->email ?? null; // asegúrate de que tu tabla tenga columna email
            $nombreComercio = $solicitud->nombreComercio ?? 'Comercio';

            // Enviamos el email si tenemos el correo guardado
            if ($emailComercio) {
                Mail::raw(
                    "Hola $nombreComercio,\n\nLamentablemente su solicitud ha sido denegada.\n\nSaludos,\nResurgeNet",
                    function ($message) use ($emailComercio) {
                        $message->to($emailComercio)
                                ->subject("Solicitud denegada");
                    }
                );
            }

            // Devolvemos el json
            return response()->json(['message' => 'Solicitud denegada correctamente']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    //funcion para aceptar la peticion del comercio (solo para validador)
    public function aceptarSolicitudComercio($id) {
        try {
            // obtenemos la solicitud
            $solicitud = DB::table('solicitudComercio')->where('id_solicitud', $id)->first();
            if (!$solicitud) {
                return response()->json(['error' => 'Solicitud no encontrada'], 404);
            }

            // cambiamos el estado a aceptada
            DB::table('solicitudComercio')
                ->where('id_solicitud', $id)
                ->update(['estado' => 'aceptada']);

            // creamos el usuario en la tabla usuario con el rol de comercio (4)
            DB::table('usuario')->insert([
                'nombre' => $solicitud->nombrePropietario,
                'usuario' => $solicitud->nombreComercio,
                'password' => bcrypt($solicitud->nombreComercio), // encriptamos la contraseña
                'rol' => '3'
            ]);

            return response()->json(['message' => 'Solicitud aceptada y usuario creado correctamente']);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    //funcion para obtener el listado de productos de un comercio (solo para comercio)
    public function getProductosComercio($id_usuario) {
        try {
            $productos = DB::table('productos')
                ->where('id_comercio', $id_usuario)
                ->select('id_producto', 'nombre', 'id_comercio')
                //solo queremos una forma de identificarlo para posteriormente acceder a sus datos completos
                ->get();

            return response()->json($productos);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    //funcion para obtener los datos completos de un producto (solo para comercio)
    public function getInfoProducto($id_producto) {
       try{
            $info_producto = DB::table('productos')
                ->where('id_producto', $id_producto)
                ->select('id_producto', 'nombre', 'tipo', 'descripcion', 'precio', 'stock', 'imagen')
                ->first();  
            return response()->json($info_producto);  
       } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    //funcion para actualizar el producto (solo para comercio)
    public function actualizarProducto(Request $request, $id_producto) {
        try {
            $producto = DB::table('productos')->where('id_producto', $id_producto);

            $data = [
                'nombre' => $request->nombre,
                'tipo' => $request->tipo,
                'descripcion' => $request->descripcion,
                'precio' => $request->precio,
                'stock' => $request->stock
            ];

            if ($request->hasFile('imagen')) {
                $path = $request->file('imagen')->store('uploads/productos', 'public');
                $data['imagen'] = $path;
            }

            $producto->update($data);

            return response()->json(['message' => 'Producto actualizado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // -------------------------------------------------------
    // Función para obtener el perfil completo del consumidor
    // Devuelve datos de 'usuario' + 'consumidor' unidos por id
    // -------------------------------------------------------
    public function getPerfilConsumidor($id) {
        try {
            $perfil = DB::table('usuario')
                ->join('consumidor', 'usuario.id_usuario', '=', 'consumidor.id')
                ->where('usuario.id_usuario', $id)
                ->select(
                    'usuario.nombre',
                    'consumidor.email',
                    'consumidor.ciudad',
                    'consumidor.n_telefono',
                    'consumidor.direccion',
                    'consumidor.cod_postal',
                    'consumidor.fecha_nac'
                )
                ->first();

            if (!$perfil) {
                return response()->json(['error' => 'Consumidor no encontrado'], 404);
            }

            // Convertimos fecha_nac de YYYY-MM-DD a DD/MM/AAAA para el frontend
            if ($perfil->fecha_nac) {
                $perfil->fecha_nac = \DateTime::createFromFormat('Y-m-d', $perfil->fecha_nac)
                    ->format('d/m/Y');
            }

            return response()->json($perfil);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
