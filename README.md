# Pepino AI — App

Panel de gestión de WhatsApp para negocios. Cada usuario tiene su propia línea de WhatsApp conectada, sus propios contactos, reservas y agente de IA.

---

## Arquitectura multi-tenant

Cada cliente de Pepino AI es un usuario en Supabase con su propia instancia de WhatsApp en Evolution API. Los datos están completamente aislados por `user_id`.

```
Cliente escribe al WhatsApp del negocio
        ↓
Evolution API recibe el mensaje
        ↓
n8n recibe el webhook (con instance_name)
        ↓
n8n busca en Supabase: whatsapp_instances WHERE instance_name = ?
        → devuelve user_id del dueño
        ↓
n8n arma contexto del agente (servicios, disponibilidad, historial)
        ↓
IA genera respuesta personalizada
        ↓
Evolution envía la respuesta al cliente
```

---

## WhatsApp — Cómo funciona

### Variables de entorno necesarias
```
EVOLUTION_URL=https://evolution-api-production-544b.up.railway.app
EVOLUTION_API_KEY=...       # API key global de Evolution (Railway)
EVOLUTION_KEY=...           # mismo valor, nombre legacy
```

### Instancias
- Cada usuario tiene **una instancia** en Evolution API
- El nombre de la instancia sigue el patrón: `pepino_<user_id_primeros16chars>`
- La instancia existente del owner es `pepino-principal`
- Las instancias se guardan en la tabla `whatsapp_instances` de Supabase

### Tabla `whatsapp_instances`
```sql
user_id        -- FK a auth.users (UNIQUE: un usuario = una instancia)
instance_name  -- nombre en Evolution API (ej: "pepino_7dfa511b436e401c")
instance_token -- API token de esa instancia específica
status         -- open | connecting | disconnected | close
phone_number   -- número conectado
profile_name   -- nombre del perfil de WhatsApp
```

### API routes de WhatsApp
| Route | Método | Descripción |
|-------|--------|-------------|
| `/api/whatsapp/connect` | POST | Crea instancia en Evolution, devuelve QR |
| `/api/whatsapp/status` | GET | Consulta estado desde Evolution, actualiza Supabase |
| `/api/whatsapp/disconnect` | POST | Elimina instancia de Evolution y Supabase |

### Flujo de conexión para un usuario nuevo
1. Usuario entra a `/configuracion`
2. Hace click en "Conectar WhatsApp"
3. El backend crea la instancia en Evolution (`POST /api/whatsapp/connect`)
4. Se muestra el QR en pantalla
5. El usuario escanea con su teléfono desde WhatsApp → Dispositivos vinculados
6. El status cambia a `open` automáticamente (polling cada 4 segundos)

---

## Supabase

**Proyecto:** `kbqfyysugikvafqprjbp`  
**URL:** `https://kbqfyysugikvafqprjbp.supabase.co`

### Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # clave pública, segura para el cliente
SUPABASE_SERVICE_ROLE_KEY=...       # solo para API routes del servidor, nunca exponer al cliente
```

### Tablas principales
| Tabla | Descripción |
|-------|-------------|
| `whatsapp_instances` | Instancias de WhatsApp por usuario |
| `contactos` | Contactos del negocio |
| `reservas` | Reservas/turnos |
| `disponibilidad` | Horarios disponibles por día de semana |
| `servicios` | Servicios que ofrece el negocio |
| `contact_columns` | Columnas personalizadas de contactos |
| `contact_field_values` | Valores de columnas personalizadas |

### Regla importante
**Siempre filtrar por `user_id`** en todas las queries. Nunca hacer un `select *` sin filtro de usuario o se mezclan los datos de todos los clientes.

```js
// ✅ Correcto
supabase.from('reservas').select('*').eq('user_id', uid)

// ❌ Nunca hacer esto
supabase.from('reservas').select('*')
```

---

## n8n

**URL:** `https://pepinoai.app.n8n.cloud`

El webhook de Evolution llega con esta estructura clave:
```json
{
  "instance": "pepino-principal",       // nombre de la instancia
  "data": {
    "instanceId": "28032f14-...",        // ID interno de Evolution
    "key": {
      "remoteJid": "5491131658808@s.whatsapp.net"  // número del contacto
    }
  }
}
```

Para resolver el `user_id` desde n8n:
```
GET /rest/v1/whatsapp_instances?instance_name=eq.<instance>&select=user_id
Headers: apikey: <SUPABASE_ANON_KEY>
```

---

## Agregar un cliente nuevo (Fase 1 — manual)

```bash
# Crear usuario en Supabase via API
curl -X POST "https://kbqfyysugikvafqprjbp.supabase.co/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@email.com",
    "password": "password_temporal",
    "email_confirm": true
  }'
```

Después el cliente entra a `app.getpepino.com`, se loguea y conecta su WhatsApp desde `/configuracion`.
