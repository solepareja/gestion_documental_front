# Base de datos de Gestión Documental — SQL Server 2019

Fecha de revisión: 20 de noviembre de 2026.

## 1. Alcance y origen

Este documento contiene la estructura completa deducida del código actual del backend (entidades JPA, colecciones y migraciones), una propuesta de DDL para Microsoft SQL Server 2019 y una descripción funcional limitada al módulo de transportistas. Incluye también las tablas de trabajadores, materiales, entregas y firmas porque forman parte de la misma base de datos.

**No es un volcado de la instancia MySQL local.** No se ha consultado esa instancia: los nombres físicos se deducen de las anotaciones y de la convención `snake_case` de Spring/Hibernate. Antes de migrar, contrastar con `SHOW CREATE TABLE` de cada tabla: una base actualizada con `ddl-auto=update` puede conservar columnas, índices o tablas antiguos que ya no figuran en el código. No se han trasladado datos ni cambiado las conexiones.

La definición SQL de cada tabla que aparece abajo sirve como diccionario de columnas: especifica nombre, tipo, longitud, nulabilidad, clave primaria, identidad, valores predeterminados y relaciones. Se conservan campos históricos para no perder información durante el traslado.

## 2. Convenciones de la adaptación

| Origen Java/MySQL | Propuesta SQL Server | Criterio |
| --- | --- | --- |
| Integer / INT | INT | Identificadores de 32 bits |
| Identidad / AUTO_INCREMENT | IDENTITY(1,1) | Conservar además la PK |
| Long | BIGINT | Versión de concurrencia |
| String sin longitud explícita | NVARCHAR(255) | Longitud JPA por defecto, conservando Unicode |
| String con longitud explícita | NVARCHAR(n) | Se mantiene el límite del modelo |
| TEXT / LONGTEXT / String LOB | NVARCHAR(MAX) | Texto extenso, rutas o base64 heredado |
| Boolean / boolean | BIT | NULL permitido solo cuando lo admite el modelo |
| LocalDate | DATE | Sin hora |
| LocalDateTime | DATETIME2(6) | Sin zona horaria; seis decimales de precisión |
| double | FLOAT(53) | Valor aproximado como el campo Java actual |
| EnumType.STRING | NVARCHAR(n) | Se conserva el nombre textual; no el ordinal |

Los `DEFAULT` de flags, cantidades y fechas incluidos en el DDL son **una propuesta para el destino** que reproduce las inicializaciones Java; una inicialización Java no implica que MySQL tenga ese DEFAULT. Las fechas `SYSDATETIME()` usan la hora del servidor: acordar la misma política horaria que el backend antes de cargar datos nuevos.

Las FK usan `NO ACTION` implícito al borrar y actualizar. Las cascadas JPA y `orphanRemoval` se ejecutan desde la aplicación; no equivalen a `ON DELETE CASCADE` en la base de datos. No se añaden restricciones de unicidad para matrícula, correo o NIF de transportista porque las entidades no las declaran. Los índices únicos filtrados conservan la posibilidad de múltiples NULL en relaciones opcionales, a diferencia de un UNIQUE simple de SQL Server.

Las colecciones de tipo lista sin `@OrderColumn` no tienen orden persistente ni PK artificial en este diseño. Se mantienen posibles repeticiones. En `material_stock_talla` sí se define la clave compuesta correspondiente a la clave del mapa.

## 3. Inventario de tablas

| Tabla | Uso |
| --- | --- |
| usuario | Cuentas de acceso y rol |
| vehiculo | Flota y disponibilidad forzada |
| transportista | Empresas/autónomos y datos históricos |
| permiso_conducir | Permisos antiguos asociados al transportista |
| conductor | Persona física que conduce |
| conductor_permiso | Permisos actuales de cada conductor |
| vinculo_conductor | Relación entre transportistas y conductores |
| trabajador | Personal del módulo de RR. HH. |
| documento | Metadatos y archivo/ruta de documentación |
| aviso | Avisos generales de calendario |
| material | Catálogo de EPI y vestuario |
| material_stock_talla | Existencias de material por talla |
| entrega | Cabecera de entrega al trabajador |
| linea_entrega | Materiales incluidos en una entrega |
| plantilla_documento | Texto de documentos para firma |
| plantilla_documento_departamento | Departamentos destinatarios |
| firma_documento | Firma individual y PDF firmado |
| renovacion_vestuario | Fecha global y versión de renovación |
| migracion_transporte | Registro técnico de migración histórica |

## 4. DDL completo propuesto

Ejecutar sobre una **base de datos vacía previamente creada**, seleccionada en SSMS, con esquema `dbo`. El script no borra tablas, no carga datos, no crea usuarios y no es idempotente. El orden respeta las dependencias. La intercalación (collation) se hereda de la base: revisar sensibilidad a mayúsculas y acentos, especialmente para DNI, correo y valores únicos.

### 4.1. Usuarios

`admin` es el indicador heredado y `rol` contiene el perfil textual; deben mantenerse coherentes. No se incluye ningún usuario ni contraseña en este documento.

```sql
CREATE TABLE dbo.usuario (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_usuario PRIMARY KEY,
    nombre NVARCHAR(255) NULL,
    correo NVARCHAR(255) NULL,
    contrasenya NVARCHAR(255) NULL,
    admin BIT NOT NULL CONSTRAINT DF_usuario_admin DEFAULT (0),
    rol NVARCHAR(255) NULL
);
```

### 4.2. Vehículos

`anyo` es el año; `km` conserva el tipo aproximado del modelo. `activo` y `disponibilidad_forzada` son anulables por ser Boolean en Java. La disponibilidad calculada y sus motivos no son columnas.

```sql
CREATE TABLE dbo.vehiculo (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_vehiculo PRIMARY KEY,
    matricula NVARCHAR(255) NULL,
    marca NVARCHAR(255) NULL,
    modelo NVARCHAR(255) NULL,
    tipo NVARCHAR(255) NULL,
    anyo INT NOT NULL,
    km FLOAT(53) NOT NULL,
    activo BIT NULL CONSTRAINT DF_vehiculo_activo DEFAULT (1),
    disponibilidad_forzada BIT NULL CONSTRAINT DF_vehiculo_forzada DEFAULT (0)
);
```

### 4.3. Transportistas

`dni` almacena la identificación fiscal también cuando se trata de una empresa. `empresa_id` es una autorrelación histórica; los vínculos actuales con personas se guardan en `vinculo_conductor`. Los datos de carnet y vehículo se conservan por compatibilidad, aunque ahora se gestionan desde `conductor`.

```sql
CREATE TABLE dbo.transportista (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_transportista PRIMARY KEY,
    tipo_transportista NVARCHAR(255) NULL,
    empresa_id INT NULL,
    nombre NVARCHAR(255) NULL,
    apellidos NVARCHAR(255) NULL,
    dni NVARCHAR(255) NULL,
    correo NVARCHAR(255) NULL,
    telefono NVARCHAR(255) NULL,
    tipo_carnet NVARCHAR(255) NULL,
    cad_carnet DATE NULL,
    foto_carnet_anverso NVARCHAR(MAX) NULL,
    foto_carnet_reverso NVARCHAR(MAX) NULL,
    vehiculo_id INT NULL,
    CONSTRAINT FK_transportista_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.transportista(id),
    CONSTRAINT FK_transportista_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES dbo.vehiculo(id)
);
CREATE UNIQUE INDEX UX_transportista_vehiculo ON dbo.transportista(vehiculo_id)
    WHERE vehiculo_id IS NOT NULL;

CREATE TABLE dbo.permiso_conducir (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_permiso_conducir PRIMARY KEY,
    transportista_id INT NOT NULL,
    tipo NVARCHAR(20) NOT NULL,
    fecha_emision DATE NULL,
    fecha_caducidad DATE NULL,
    observaciones NVARCHAR(255) NULL,
    CONSTRAINT FK_permiso_transportista FOREIGN KEY (transportista_id) REFERENCES dbo.transportista(id)
);
```

### 4.4. Conductores, permisos y vínculos

`legacy_transportista_id` es una referencia técnica al identificador original, única cuando está informada; el modelo no la declara como FK. `dni` sí es obligatorio y único. Los resúmenes `tipo_carnet` y `cad_carnet` conviven con el detalle de permisos. Cada conductor puede tener un vehículo; la unicidad impide compartirlo entre dos conductores. Esta unicidad no cruza automáticamente con el campo histórico de `transportista`.

```sql
CREATE TABLE dbo.conductor (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_conductor PRIMARY KEY,
    legacy_transportista_id INT NULL,
    nombre NVARCHAR(255) NULL,
    apellidos NVARCHAR(255) NULL,
    dni NVARCHAR(255) NOT NULL,
    correo NVARCHAR(255) NULL,
    telefono NVARCHAR(255) NULL,
    tipo_conductor NVARCHAR(255) NULL,
    tipo_carnet NVARCHAR(255) NULL,
    cad_carnet DATE NULL,
    foto_carnet_anverso NVARCHAR(MAX) NULL,
    foto_carnet_reverso NVARCHAR(MAX) NULL,
    vehiculo_id INT NULL,
    CONSTRAINT UQ_conductor_dni UNIQUE (dni),
    CONSTRAINT FK_conductor_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES dbo.vehiculo(id)
);
CREATE UNIQUE INDEX UX_conductor_legacy ON dbo.conductor(legacy_transportista_id)
    WHERE legacy_transportista_id IS NOT NULL;
CREATE UNIQUE INDEX UX_conductor_vehiculo ON dbo.conductor(vehiculo_id)
    WHERE vehiculo_id IS NOT NULL;

CREATE TABLE dbo.conductor_permiso (
    conductor_id INT NOT NULL,
    tipo NVARCHAR(255) NULL,
    fecha_emision DATE NULL,
    fecha_caducidad DATE NULL,
    observaciones NVARCHAR(255) NULL,
    CONSTRAINT FK_conductor_permiso FOREIGN KEY (conductor_id) REFERENCES dbo.conductor(id)
);

CREATE TABLE dbo.vinculo_conductor (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_vinculo_conductor PRIMARY KEY,
    transportista_id INT NOT NULL,
    conductor_id INT NOT NULL,
    tipo_vinculo NVARCHAR(255) NULL,
    CONSTRAINT UQ_vinculo_conductor UNIQUE (transportista_id, conductor_id),
    CONSTRAINT FK_vinculo_transportista FOREIGN KEY (transportista_id) REFERENCES dbo.transportista(id),
    CONSTRAINT FK_vinculo_conductor FOREIGN KEY (conductor_id) REFERENCES dbo.conductor(id)
);
```

### 4.5. Trabajadores y documentos

La ficha de trabajador no incluye teléfono en el modelo actual. `documento` tiene cuatro FK opcionales: el servicio exige exactamente un titular, pero las anotaciones JPA no incluyen una restricción CHECK para ello. El DDL conserva esa diferencia para facilitar la migración de registros históricos. `archivo` puede contener una ruta NAS o contenido base64 heredado; `archivo_nombre` es el nombre presentado al usuario.

```sql
CREATE TABLE dbo.trabajador (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_trabajador PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    apellidos NVARCHAR(255) NOT NULL,
    dni NVARCHAR(255) NOT NULL,
    correo NVARCHAR(255) NOT NULL,
    departamento NVARCHAR(255) NULL
);

CREATE TABLE dbo.documento (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_documento PRIMARY KEY,
    tipo NVARCHAR(100) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_caducidad DATE NULL,
    vehiculo_id INT NULL,
    transportista_id INT NULL,
    conductor_id INT NULL,
    trabajador_id INT NULL,
    numero_referencia NVARCHAR(255) NULL,
    compania_aseguradora NVARCHAR(255) NULL,
    estado NVARCHAR(50) NOT NULL,
    archivo NVARCHAR(MAX) NULL,
    archivo_nombre NVARCHAR(255) NULL,
    avisos BIT NOT NULL CONSTRAINT DF_documento_avisos DEFAULT (1),
    CONSTRAINT FK_documento_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES dbo.vehiculo(id),
    CONSTRAINT FK_documento_transportista FOREIGN KEY (transportista_id) REFERENCES dbo.transportista(id),
    CONSTRAINT FK_documento_conductor FOREIGN KEY (conductor_id) REFERENCES dbo.conductor(id),
    CONSTRAINT FK_documento_trabajador FOREIGN KEY (trabajador_id) REFERENCES dbo.trabajador(id)
);
```

### 4.6. Avisos

```sql
CREATE TABLE dbo.aviso (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_aviso PRIMARY KEY,
    titulo NVARCHAR(255) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    fecha DATE NOT NULL,
    tipo NVARCHAR(255) NULL,
    prioridad NVARCHAR(255) NULL,
    fecha_creacion DATETIME2(6) NULL CONSTRAINT DF_aviso_fecha DEFAULT (SYSDATETIME())
);
```

### 4.7. Materiales y existencias por talla

```sql
CREATE TABLE dbo.material (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_material PRIMARY KEY,
    tipo NVARCHAR(20) NOT NULL,
    nombre NVARCHAR(255) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,
    requiere_talla BIT NOT NULL CONSTRAINT DF_material_talla DEFAULT (0),
    vida_util_meses INT NULL,
    activo BIT NOT NULL CONSTRAINT DF_material_activo DEFAULT (1),
    stock INT NOT NULL CONSTRAINT DF_material_stock DEFAULT (0),
    tipo_tallaje NVARCHAR(30) NULL
);

CREATE TABLE dbo.material_stock_talla (
    material_id INT NOT NULL,
    talla NVARCHAR(50) NOT NULL,
    stock INT NOT NULL,
    CONSTRAINT PK_material_stock_talla PRIMARY KEY (material_id, talla),
    CONSTRAINT FK_stock_material FOREIGN KEY (material_id) REFERENCES dbo.material(id)
);
```

### 4.8. Entregas y líneas

```sql
CREATE TABLE dbo.entrega (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_entrega PRIMARY KEY,
    trabajador_id INT NOT NULL,
    fecha_entrega DATE NOT NULL,
    firma NVARCHAR(MAX) NULL,
    observaciones NVARCHAR(MAX) NULL,
    CONSTRAINT FK_entrega_trabajador FOREIGN KEY (trabajador_id) REFERENCES dbo.trabajador(id)
);

CREATE TABLE dbo.linea_entrega (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_linea_entrega PRIMARY KEY,
    entrega_id INT NOT NULL,
    material_id INT NOT NULL,
    cantidad INT NOT NULL CONSTRAINT DF_linea_cantidad DEFAULT (1),
    talla NVARCHAR(50) NULL,
    fecha_renovacion DATE NULL,
    estado NVARCHAR(30) NOT NULL CONSTRAINT DF_linea_estado DEFAULT (N'ENTREGADO'),
    CONSTRAINT FK_linea_entrega FOREIGN KEY (entrega_id) REFERENCES dbo.entrega(id),
    CONSTRAINT FK_linea_material FOREIGN KEY (material_id) REFERENCES dbo.material(id)
);
```

### 4.9. Plantillas, departamentos y firmas

Solo se permite una firma por combinación de plantilla y trabajador. `fecha_creacion` de la plantilla es no actualizable desde JPA; el DDL no añade un trigger que bloquee modificaciones directas. Las firmas y los PDF se conservan como texto según el modelo.

```sql
CREATE TABLE dbo.plantilla_documento (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_plantilla_documento PRIMARY KEY,
    titulo NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(500) NULL,
    colectivo NVARCHAR(2000) NOT NULL,
    contenido_legal NVARCHAR(MAX) NOT NULL,
    activo BIT NOT NULL CONSTRAINT DF_plantilla_activo DEFAULT (1),
    fecha_creacion DATETIME2(6) NOT NULL CONSTRAINT DF_plantilla_fecha DEFAULT (SYSDATETIME())
);

CREATE TABLE dbo.plantilla_documento_departamento (
    plantilla_id INT NOT NULL,
    departamento NVARCHAR(255) NOT NULL,
    CONSTRAINT FK_departamento_plantilla FOREIGN KEY (plantilla_id) REFERENCES dbo.plantilla_documento(id)
);

CREATE TABLE dbo.firma_documento (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_firma_documento PRIMARY KEY,
    plantilla_id INT NOT NULL,
    trabajador_id INT NOT NULL,
    fecha_firma DATETIME2(6) NOT NULL CONSTRAINT DF_firma_fecha DEFAULT (SYSDATETIME()),
    firma_svg_base64 NVARCHAR(MAX) NULL,
    ip_address NVARCHAR(60) NULL,
    user_agent NVARCHAR(255) NULL,
    pdf_firmado_base64 NVARCHAR(MAX) NULL,
    CONSTRAINT UQ_firma_plantilla_trabajador UNIQUE (plantilla_id, trabajador_id),
    CONSTRAINT FK_firma_plantilla FOREIGN KEY (plantilla_id) REFERENCES dbo.plantilla_documento(id),
    CONSTRAINT FK_firma_trabajador FOREIGN KEY (trabajador_id) REFERENCES dbo.trabajador(id)
);
```

### 4.10. Renovación global y control de migración

`renovacion_vestuario.id` se inicializa a 1 en Java, pero no es autoincremental ni tiene DEFAULT en este DDL. `version` es el contador numérico de `@Version`: **no convertirlo a ROWVERSION/TIMESTAMP de SQL Server**. La columna `aplicada` procede de TIMESTAMP de MySQL y representa una fecha/hora, no un contador binario.

```sql
CREATE TABLE dbo.renovacion_vestuario (
    id INT NOT NULL CONSTRAINT PK_renovacion_vestuario PRIMARY KEY,
    proxima_fecha DATE NULL,
    ultima_renovacion DATE NULL,
    version BIGINT NULL
);

CREATE TABLE dbo.migracion_transporte (
    version NVARCHAR(80) NOT NULL CONSTRAINT PK_migracion_transporte PRIMARY KEY,
    aplicada DATETIME2(6) NULL CONSTRAINT DF_migracion_aplicada DEFAULT (SYSDATETIME())
);
```

### 4.11. Índices adicionales propuestos

Son recomendaciones de rendimiento para SQL Server; no se presentan como índices constatados en MySQL. Los índices de PK y UNIQUE ya quedan creados por los apartados anteriores. No se añaden índices redundantes sobre el primer campo de una clave compuesta.

```sql
CREATE INDEX IX_transportista_empresa ON dbo.transportista(empresa_id);
CREATE INDEX IX_permiso_transportista ON dbo.permiso_conducir(transportista_id);
CREATE INDEX IX_conductor_permiso ON dbo.conductor_permiso(conductor_id);
CREATE INDEX IX_vinculo_conductor ON dbo.vinculo_conductor(conductor_id);
CREATE INDEX IX_documento_vehiculo_tipo ON dbo.documento(vehiculo_id, tipo, fecha_caducidad);
CREATE INDEX IX_documento_transportista_tipo ON dbo.documento(transportista_id, tipo, fecha_caducidad);
CREATE INDEX IX_documento_conductor_tipo ON dbo.documento(conductor_id, tipo, fecha_caducidad);
CREATE INDEX IX_documento_trabajador_tipo ON dbo.documento(trabajador_id, tipo, fecha_caducidad);
CREATE INDEX IX_entrega_trabajador ON dbo.entrega(trabajador_id);
CREATE INDEX IX_linea_entrega ON dbo.linea_entrega(entrega_id);
CREATE INDEX IX_linea_material ON dbo.linea_entrega(material_id);
CREATE INDEX IX_plantilla_departamento ON dbo.plantilla_documento_departamento(plantilla_id);
CREATE INDEX IX_firma_trabajador ON dbo.firma_documento(trabajador_id);
```

## 5. Valores de dominio y reglas

No hay tablas de catálogo independientes para los siguientes valores. El DDL utiliza texto y no añade CHECK nuevos, para no rechazar históricos sin analizarlos primero. Los valores de enums proceden del modelo; los tipos de transportista, conductor y vínculo proceden de la lógica de negocio.

| Campo | Valores actuales |
| --- | --- |
| documento.tipo | PERMISO_CIRCULACION, FICHA_TECNICA, ITV, TARJETA_TRANSPORTE, SEGURO, SEGURO_RESPONSABILIDAD_CIVIL, SEGURO_CARGA, ALTA_AUTONOMO, MODELO_036_037, CERTIFICADO_SEG_SOCIAL, AEAT, ALTA_TRABAJADOR, CARNET |
| documento.estado | VIGENTE, PENDIENTE, CADUCADO, ANULADO |
| transportista.tipo_transportista | EMPRESA, AUTONOMO; pueden quedar CONDUCTOR o NULL de etapas anteriores |
| conductor.tipo_conductor | EMPLEADO, AUTONOMO |
| vinculo_conductor.tipo_vinculo | EMPLEADO, AUTONOMO_COLABORADOR |
| usuario.rol | ADMIN, USUARIO, KIOSKO |
| material.tipo | EPI, VESTUARIO |
| material.tipo_tallaje | UNICA, PARTES_ARRIBA, PANTALONES, CALZADO, GUANTES, OTRO |
| linea_entrega.estado | ENTREGADO, DEVUELTO, PENDIENTE_RENOVACION, RENOVADO, CADUCADO |
| aviso.tipo (documentado en el modelo) | NOTA, RECORDATORIO, EVENTO, AVISO |
| aviso.prioridad (documentada en el modelo) | NORMAL, IMPORTANTE, URGENTE |

Las categorías de permisos de conducir se almacenan como texto, no como tabla ni enum JPA. No confundir el límite de 20 caracteres de `permiso_conducir.tipo` con los 255 de `conductor_permiso.tipo`.

Reglas que aplica el servicio y que no son restricciones SQL de este DDL:

- Validación y normalización de DNI/NIF y validación fiscal según empresa o autónomo.
- Un documento pertenece exactamente a una entidad; fechas coherentes y caducidad obligatoria según su tipo.
- El alta/edición de documentos requiere adjuntar PDF o imagen. `archivo` sigue siendo NULL permitido en SQL para admitir registros existentes.
- El carnet se gestiona mediante fotos de anverso y reverso del conductor; el servicio rechaza nuevas altas documentales genéricas de tipo CARNET.
- El vínculo AUTONOMO_COLABORADOR requiere un conductor de tipo AUTONOMO. Cambiarlo a EMPLEADO exige resolver antes esos vínculos.
- Se impide borrar un transportista con conductores vinculados y un conductor con documentos. Eliminar un vínculo no elimina la persona.

## 6. Funcionamiento de la web: transportistas

### 6.1. Organización general

El frontend es React y consume la API REST de Spring Boot. Las fichas y documentos se persisten desde el backend mediante JPA. La web guarda información de sesión y preferencias en el navegador, pero las tablas de negocio residen en la base de datos del servidor.

El área de transporte distingue tres piezas:

1. **Transportistas:** empresas y autónomos responsables de la actividad. Se registran identificación fiscal, nombre o razón social y datos de contacto. Un autónomo puede tener también una ficha de conductor.
2. **Conductores:** personas físicas con DNI único, datos de contacto, tipo de conductor, permisos, fotos del carnet y vehículo asignado.
3. **Vehículos:** matrícula, marca, modelo, tipo, año, kilometraje y documentación propia.

`vinculo_conductor` conecta las fichas: un transportista puede tener varios conductores y una misma persona puede estar vinculada a varios transportistas. Cada pareja aparece una sola vez. La relación indica empleado o autónomo colaborador; no obliga a duplicar la persona por cada empresa.

### 6.2. Flujo habitual

1. Acceder a la aplicación con una cuenta y abrir el listado de transportistas. Se pueden buscar y filtrar empresas y autónomos y abrir su ficha o formulario.
2. Crear la empresa o el autónomo. En el alta de un autónomo, la opción de que también sea conductor permite crear o reutilizar una ficha compatible con el mismo DNI y dejarla vinculada. Si ya existe como empleado, la aplicación solicita revisar la ficha para evitar una asociación incoherente.
3. Vincular conductores existentes desde la ficha del transportista o dar de alta la persona en el apartado de conductores. Desvincular la persona conserva su ficha y su documentación.
4. Registrar los permisos del conductor, sus fechas de emisión y caducidad y las imágenes del carnet. El servicio calcula el resumen de caducidad tomando la fecha más próxima de sus permisos informados.
5. Asignar un vehículo desde la ficha del conductor. La aplicación rechaza asignarlo si ya pertenece a otro conductor.
6. Adjuntar la documentación a su titular: transportista, conductor o vehículo. Se registran tipo, emisión, caducidad cuando corresponda, referencia, aseguradora cuando proceda, estado y activación de avisos.
7. Revisar la documentación vigente y su historial, visualizar/descargar los archivos y consultar vencimientos desde los componentes de calendario y avisos.

Las renovaciones se representan como registros documentales que pueden coexistir para un mismo tipo y titular; por eso no se establece UNIQUE sobre esa combinación. El historial permite conservar versiones anteriores.

### 6.3. Disponibilidad documental de vehículos

La disponibilidad se calcula en el backend y se muestra con sus motivos. Para cada tipo requerido se selecciona el documento no anulado con mayor fecha de caducidad (o emisión si no hay caducidad), desempatando por ID. No se elige simplemente el último insertado.

Se revisan permiso de circulación, ficha técnica, ITV, tarjeta de transporte, seguro, seguro de responsabilidad civil y seguro de carga. ITV, tarjeta y los tres seguros requieren fecha de caducidad para este cálculo. La falta de documento, el estado pendiente, la falta de una caducidad requerida o una fecha ya vencida generan motivos de no disponibilidad. La fecha actual se toma en Europe/Madrid. El estado almacenado CADUCADO puede estar desactualizado: el cálculo se guía por la fecha.

`disponibilidad_forzada` permite mostrar el vehículo como disponible aun cuando existan motivos documentales. Es independiente del campo `activo`; en el método actual de cálculo de disponibilidad no se utiliza `activo` como condición adicional.

### 6.4. Archivos y NAS

El código actual de `DocumentoArchivoService` y `CarnetArchivoService` envía nuevos documentos y fotos al NAS mediante la API de RR. HH. y guarda la ruta devuelta. También contempla contenido base64 heredado. Los documentos admiten PDF, JPG, PNG y WebP hasta 25 MB; las fotos de carnet deben ser imágenes. La matrícula o identificación fiscal se utiliza para organizar el almacenamiento, junto con categoría, tipo y año.

**Trasladar SQL no traslada los archivos del NAS.** Deben conservarse también el almacenamiento externo, las rutas y la configuración de acceso de la API. No convertir indiscriminadamente estas columnas a VARBINARY ni decodificar todos sus valores: algunos son rutas. Para cambiar titular, tipo o año de un documento ya almacenado en el NAS, el servicio requiere adjuntar de nuevo el archivo.

### 6.5. API principal implicada

| Recurso | Finalidad |
| --- | --- |
| /transportistas | Listado y mantenimiento de empresas y autónomos |
| /conductores | Listado y mantenimiento de personas conductoras |
| /transportistas/{id}/conductores | Consultar, crear o quitar vínculos |
| /vehiculos | Mantenimiento de flota y consulta de disponibilidad |
| /documentos | Metadatos, historial y gestión documental |

Los sufijos concretos y métodos de descarga, fotos y disponibilidad están definidos en los controladores del backend. Esta tabla resume recursos y no sustituye una especificación OpenAPI.

## 7. Cambios necesarios antes de conectar SQL Server

Crear estas tablas por sí solo no hace compatible el backend actual. Quedan pendientes de implementación y prueba:

1. Sustituir el conector MySQL por el JDBC de Microsoft SQL Server (`com.microsoft.sqlserver:mssql-jdbc`) y configurar URL, credenciales y driver `com.microsoft.sqlserver.jdbc.SQLServerDriver`. Mantener los secretos fuera del documento y del repositorio.
2. Configurar Hibernate para SQL Server y revisar el mapeo Unicode/LOB de las entidades: el uso de NVARCHAR en este documento es una decisión de adaptación, no la traducción automática garantizada del dialecto. Eliminar o adaptar `columnDefinition = "LONGTEXT"`, `TEXT` y cualquier definición específica de MySQL. Tras aplicar un esquema versionado, usar validación del esquema en lugar de dejar `ddl-auto=update` como mecanismo de migración.
3. Reescribir `DatabaseSchemaMigration`: utiliza `DATABASE()`, `MODIFY COLUMN`, `IF(...)` y literales booleanos propios de MySQL. Su primera consulta no está protegida por los bloques que ignoran excepciones y puede impedir el arranque en SQL Server.
4. Reescribir o sustituir `MigracionTransporte`: su `CREATE TABLE IF NOT EXISTS` no es T-SQL. La tabla `migracion_transporte` registra `separacion-conductores-v1`. Si ya se ejecutó en origen, migrar también ese registro; no insertarlo manualmente como aplicado si no se ha realizado la separación. El chequeo de marca no evita la ejecución previa del CREATE incompatible.
5. Buscar SQL nativo adicional en repositorios y consultas antes del cambio definitivo. Revisar collation y comparación de texto, límites NVARCHAR e índices, precisión temporal y tratamiento de nulos en la configuración elegida.

## 8. Procedimiento de traslado y validación

1. Obtener copia consistente de MySQL y del almacenamiento documental. Extraer DDL real, inventario y recuentos de todas las tablas, incluyendo posibles tablas antiguas ajenas a este inventario.
2. Revisar datos incompatibles: fechas cero de MySQL, campos obligatorios vacíos/nulos, duplicados bajo la collation de destino, referencias huérfanas, tamaños de texto y documentos sin titular o con varios titulares.
3. Crear el esquema en una base de ensayo vacía con el DDL anterior, acordando previamente los DEFAULT y la política horaria.
4. Cargar las tablas padre antes que las dependientes. Conservar los ID existentes usando `SET IDENTITY_INSERT dbo.<tabla> ON/OFF` para cada tabla con identidad, con lista explícita de columnas; solo una tabla por sesión puede tenerlo activado. Cargar la autorrelación `transportista.empresa_id` en una segunda pasada si el orden de los datos no permite resolverla durante la primera carga.
5. Conservar `legacy_transportista_id`, vínculos y marca de migración histórica. No ejecutar otra separación sobre datos ya separados. Ajustar/verificar después el valor de identidad con `DBCC CHECKIDENT` para que las altas continúen por encima del máximo importado.
6. Comparar recuentos, ID, relaciones, nulos, valores de dominio, fechas, Unicode, longitudes y muestras de archivos/rutas. Validar FK e índices y la apertura real de documentos y fotos desde el backend.
7. Con el backend adaptado, probar login, alta/edición de empresa y autónomo, reutilización de conductor por DNI, vínculos y desvinculaciones, asignación exclusiva de vehículo, permisos, carga/descarga documental, historial, estados y disponibilidad forzada. Por ser una base compartida, comprobar también entregas, materiales y firmas antes de sustituir producción.
8. Hacer el corte con escrituras detenidas en origen o un procedimiento de sincronización acordado; conservar copia y procedimiento de vuelta hasta validar el destino.

**Estado de validación de este documento:** revisado contra el código del repositorio. El DDL no se ha ejecutado en una instancia SQL Server 2019 ni contrastado con el catálogo de MySQL; requiere ensayo de creación, importación y pruebas de integración antes del corte.

## 9. Fuentes de referencia

Código revisado: `src/main/java/com/sofavalencia/gestion_documental_back/model/*.java`, `utils/DatabaseSchemaMigration.java`, `config/MigracionTransporte.java`, servicios de transportistas, conductores, vehículos y documentos, servicios de archivos/NAS y páginas/componentes de transporte del frontend. Se ha considerado el contenido actual del espacio de trabajo, incluidos cambios aún sin commit.

La elección de índices únicos filtrados para columnas opcionales sigue la documentación de Microsoft: [Crear índices filtrados](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/create-filtered-indexes) y [CREATE INDEX: semántica de UNIQUE y NULL](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-index-transact-sql?view=sql-server-ver15).
