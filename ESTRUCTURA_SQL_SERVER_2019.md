# Gestión documental: estructura para SQL Server 2019

Fecha de revisión: 24/11/2026.

## 1. Alcance y origen

Este documento recoge **toda la estructura persistente identificada en el backend**, y explica el funcionamiento del módulo de transporte. Incluye tablas de otros módulos porque `documento` comparte relaciones con trabajadores y porque se solicita la estructura completa.

La fuente son las entidades JPA de `gestion_documental_back/src/main/java/com/sofavalencia/gestion_documental_back/model`, `utils/DatabaseSchemaMigration.java` y `config/MigracionTransporte.java`, contrastadas con servicios y pantallas React. **No es un volcado de la base MySQL local**: no se ha conectado a ella. Columnas antiguas, índices creados manualmente, triggers, vistas o tablas ajenas al código podrían existir y deben inventariarse antes del traslado.

El siguiente DDL es una **propuesta de destino para una base vacía de Microsoft SQL Server 2019**, en esquema `dbo`. No migra datos ni modifica la aplicación. Se mantienen nombres en `snake_case`, conforme al uso SQL explícito del backend; comprobarlos contra MySQL y la configuración efectiva de Hibernate.

## 2. Convenciones de la definición

- `int IDENTITY(1,1)`: identificadores autogenerados; PK significa clave primaria.
- `nvarchar(n)`: texto Unicode de hasta n caracteres; cuando JPA no fija longitud se emplea 255. `nvarchar(max)` sustituye a los textos `TEXT`/`LONGTEXT` y campos LOB.
- `date`: fecha sin hora; `datetime2(6)`: fecha y hora sin zona horaria. El `TIMESTAMP` de MySQL de la tabla de migraciones se convierte en fecha y hora, **no** en `timestamp/rowversion` de SQL Server.
- `bit`: booleano; `float(53)`: equivalente propuesto para el `double` Java de kilómetros; `bigint`: versión de bloqueo optimista.
- Todas las columnas indican explícitamente si admiten `NULL`. Se sigue la nulabilidad declarada por el mapeo, que puede ser más permisiva que los formularios y servicios.
- Los `DEFAULT` reflejan valores iniciales del código como comodidad para inserciones SQL. Un inicializador Java no implica que ese valor por defecto exista hoy en MySQL. Un valor `NULL` explícito no se sustituye por un `DEFAULT`.
- Las FK se crean sin borrado ni actualización en cascada (`NO ACTION` por defecto). Las cascadas y `orphanRemoval` de JPA son comportamiento de la aplicación, no equivalentes automáticos a `ON DELETE CASCADE`.
- Los índices únicos filtrados permiten varios `NULL` en relaciones opcionales o identificadores históricos, manteniendo únicos los valores informados.
- No se añaden restricciones de negocio nuevas a los datos históricos. Las enumeraciones y reglas se documentan después del DDL; no se convierten aquí en `CHECK`.

## 3. DDL completo

Ejecutar sobre la base de destino vacía, seleccionada previamente en SQL Server Management Studio. No ejecutar sobre tablas ya existentes. No incluye `CREATE DATABASE`, usuarios, permisos ni configuración de almacenamiento.

```sql
CREATE TABLE dbo.usuario (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_usuario PRIMARY KEY,
    nombre nvarchar(255) NULL,
    correo nvarchar(255) NULL,
    contrasenya nvarchar(255) NULL,
    admin bit NOT NULL CONSTRAINT DF_usuario_admin DEFAULT (0),
    rol nvarchar(255) NULL
);

CREATE TABLE dbo.vehiculo (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_vehiculo PRIMARY KEY,
    matricula nvarchar(255) NULL,
    marca nvarchar(255) NULL,
    modelo nvarchar(255) NULL,
    tipo nvarchar(255) NULL,
    anyo int NOT NULL,
    km float(53) NOT NULL,
    activo bit NULL CONSTRAINT DF_vehiculo_activo DEFAULT (1),
    disponibilidad_forzada bit NULL CONSTRAINT DF_vehiculo_forzada DEFAULT (0)
);

CREATE TABLE dbo.transportista (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_transportista PRIMARY KEY,
    tipo_transportista nvarchar(255) NULL,
    empresa_id int NULL,
    nombre nvarchar(255) NULL,
    apellidos nvarchar(255) NULL,
    dni nvarchar(255) NULL,
    correo nvarchar(255) NULL,
    telefono nvarchar(255) NULL,
    tipo_carnet nvarchar(255) NULL,
    cad_carnet date NULL,
    foto_carnet_anverso nvarchar(max) NULL,
    foto_carnet_reverso nvarchar(max) NULL,
    vehiculo_id int NULL,
    CONSTRAINT FK_transportista_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.transportista(id),
    CONSTRAINT FK_transportista_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES dbo.vehiculo(id)
);
CREATE UNIQUE INDEX UX_transportista_vehiculo ON dbo.transportista(vehiculo_id)
    WHERE vehiculo_id IS NOT NULL;

CREATE TABLE dbo.conductor (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_conductor PRIMARY KEY,
    legacy_transportista_id int NULL,
    nombre nvarchar(255) NULL,
    apellidos nvarchar(255) NULL,
    dni nvarchar(255) NOT NULL,
    correo nvarchar(255) NULL,
    telefono nvarchar(255) NULL,
    tipo_conductor nvarchar(255) NULL,
    tipo_carnet nvarchar(255) NULL,
    cad_carnet date NULL,
    foto_carnet_anverso nvarchar(max) NULL,
    foto_carnet_reverso nvarchar(max) NULL,
    vehiculo_id int NULL,
    CONSTRAINT UQ_conductor_dni UNIQUE (dni),
    CONSTRAINT FK_conductor_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES dbo.vehiculo(id)
);
CREATE UNIQUE INDEX UX_conductor_legacy ON dbo.conductor(legacy_transportista_id)
    WHERE legacy_transportista_id IS NOT NULL;
CREATE UNIQUE INDEX UX_conductor_vehiculo ON dbo.conductor(vehiculo_id)
    WHERE vehiculo_id IS NOT NULL;

CREATE TABLE dbo.vinculo_conductor (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_vinculo_conductor PRIMARY KEY,
    transportista_id int NOT NULL,
    conductor_id int NOT NULL,
    tipo_vinculo nvarchar(255) NULL,
    CONSTRAINT UQ_vinculo_conductor UNIQUE (transportista_id, conductor_id),
    CONSTRAINT FK_vinculo_transportista FOREIGN KEY (transportista_id) REFERENCES dbo.transportista(id),
    CONSTRAINT FK_vinculo_conductor FOREIGN KEY (conductor_id) REFERENCES dbo.conductor(id)
);

CREATE TABLE dbo.permiso_conducir (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_permiso_conducir PRIMARY KEY,
    transportista_id int NOT NULL,
    tipo nvarchar(20) NOT NULL,
    fecha_emision date NULL,
    fecha_caducidad date NULL,
    observaciones nvarchar(255) NULL,
    CONSTRAINT FK_permiso_transportista FOREIGN KEY (transportista_id) REFERENCES dbo.transportista(id)
);

CREATE TABLE dbo.conductor_permiso (
    conductor_id int NOT NULL,
    tipo nvarchar(255) NULL,
    fecha_emision date NULL,
    fecha_caducidad date NULL,
    observaciones nvarchar(255) NULL,
    CONSTRAINT FK_conductor_permiso FOREIGN KEY (conductor_id) REFERENCES dbo.conductor(id)
);

CREATE TABLE dbo.trabajador (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_trabajador PRIMARY KEY,
    nombre nvarchar(255) NOT NULL,
    apellidos nvarchar(255) NOT NULL,
    dni nvarchar(255) NOT NULL,
    correo nvarchar(255) NOT NULL,
    departamento nvarchar(255) NULL
);

CREATE TABLE dbo.documento (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_documento PRIMARY KEY,
    tipo nvarchar(100) NOT NULL,
    fecha_emision date NOT NULL,
    fecha_caducidad date NULL,
    vehiculo_id int NULL,
    transportista_id int NULL,
    conductor_id int NULL,
    trabajador_id int NULL,
    numero_referencia nvarchar(255) NULL,
    compania_aseguradora nvarchar(255) NULL,
    estado nvarchar(50) NOT NULL,
    archivo nvarchar(max) NULL,
    archivo_nombre nvarchar(255) NULL,
    avisos bit NOT NULL CONSTRAINT DF_documento_avisos DEFAULT (1),
    CONSTRAINT FK_documento_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES dbo.vehiculo(id),
    CONSTRAINT FK_documento_transportista FOREIGN KEY (transportista_id) REFERENCES dbo.transportista(id),
    CONSTRAINT FK_documento_conductor FOREIGN KEY (conductor_id) REFERENCES dbo.conductor(id),
    CONSTRAINT FK_documento_trabajador FOREIGN KEY (trabajador_id) REFERENCES dbo.trabajador(id)
);

CREATE TABLE dbo.aviso (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_aviso PRIMARY KEY,
    titulo nvarchar(255) NOT NULL,
    descripcion nvarchar(max) NULL,
    fecha date NOT NULL,
    tipo nvarchar(255) NULL,
    prioridad nvarchar(255) NULL,
    fecha_creacion datetime2(6) NULL CONSTRAINT DF_aviso_creacion DEFAULT (SYSDATETIME())
);

CREATE TABLE dbo.material (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_material PRIMARY KEY,
    tipo nvarchar(20) NOT NULL,
    nombre nvarchar(255) NOT NULL,
    descripcion nvarchar(max) NULL,
    codigo nvarchar(255) NULL,
    marca_modelo nvarchar(255) NULL,
    normativa nvarchar(255) NULL,
    requiere_talla bit NOT NULL CONSTRAINT DF_material_talla DEFAULT (0),
    vida_util_meses int NULL,
    activo bit NOT NULL CONSTRAINT DF_material_activo DEFAULT (1),
    stock int NOT NULL CONSTRAINT DF_material_stock DEFAULT (0),
    tipo_tallaje nvarchar(30) NULL
);

CREATE TABLE dbo.material_stock_talla (
    material_id int NOT NULL,
    talla nvarchar(50) NOT NULL,
    stock int NOT NULL,
    CONSTRAINT PK_material_stock_talla PRIMARY KEY (material_id, talla),
    CONSTRAINT FK_stock_material FOREIGN KEY (material_id) REFERENCES dbo.material(id)
);

CREATE TABLE dbo.entrega (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_entrega PRIMARY KEY,
    trabajador_id int NOT NULL,
    fecha_entrega date NOT NULL,
    firma nvarchar(max) NULL,
    archivo_pdf nvarchar(2048) NULL,
    observaciones nvarchar(max) NULL,
    CONSTRAINT FK_entrega_trabajador FOREIGN KEY (trabajador_id) REFERENCES dbo.trabajador(id)
);

CREATE TABLE dbo.linea_entrega (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_linea_entrega PRIMARY KEY,
    entrega_id int NOT NULL,
    material_id int NOT NULL,
    cantidad int NOT NULL CONSTRAINT DF_linea_cantidad DEFAULT (1),
    talla nvarchar(50) NULL,
    observaciones nvarchar(max) NULL,
    fecha_renovacion date NULL,
    estado nvarchar(30) NOT NULL CONSTRAINT DF_linea_estado DEFAULT (N'ENTREGADO'),
    CONSTRAINT FK_linea_entrega FOREIGN KEY (entrega_id) REFERENCES dbo.entrega(id),
    CONSTRAINT FK_linea_material FOREIGN KEY (material_id) REFERENCES dbo.material(id)
);

CREATE TABLE dbo.plantilla_documento (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_plantilla_documento PRIMARY KEY,
    titulo nvarchar(150) NOT NULL,
    descripcion nvarchar(500) NULL,
    colectivo nvarchar(2000) NOT NULL,
    contenido_legal nvarchar(max) NOT NULL,
    activo bit NOT NULL CONSTRAINT DF_plantilla_activo DEFAULT (1),
    fecha_creacion datetime2(6) NOT NULL CONSTRAINT DF_plantilla_creacion DEFAULT (SYSDATETIME())
);

CREATE TABLE dbo.plantilla_documento_departamento (
    plantilla_id int NOT NULL,
    departamento nvarchar(255) NOT NULL,
    CONSTRAINT FK_plantilla_departamento FOREIGN KEY (plantilla_id) REFERENCES dbo.plantilla_documento(id)
);

CREATE TABLE dbo.plantilla_documento_firmante (
    plantilla_id int NOT NULL,
    trabajador_id int NOT NULL,
    CONSTRAINT FK_plantilla_firmante FOREIGN KEY (plantilla_id) REFERENCES dbo.plantilla_documento(id)
);

CREATE TABLE dbo.firma_documento (
    id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_firma_documento PRIMARY KEY,
    plantilla_id int NOT NULL,
    trabajador_id int NOT NULL,
    fecha_firma datetime2(6) NOT NULL CONSTRAINT DF_firma_fecha DEFAULT (SYSDATETIME()),
    firma_svg_base64 nvarchar(max) NULL,
    ip_address nvarchar(60) NULL,
    user_agent nvarchar(255) NULL,
    pdf_firmado_base64 nvarchar(max) NULL,
    archivo_pdf nvarchar(2048) NULL,
    CONSTRAINT UQ_firma_plantilla_trabajador UNIQUE (plantilla_id, trabajador_id),
    CONSTRAINT FK_firma_plantilla FOREIGN KEY (plantilla_id) REFERENCES dbo.plantilla_documento(id),
    CONSTRAINT FK_firma_trabajador FOREIGN KEY (trabajador_id) REFERENCES dbo.trabajador(id)
);

CREATE TABLE dbo.renovacion_vestuario (
    id int NOT NULL CONSTRAINT PK_renovacion_vestuario PRIMARY KEY,
    proxima_fecha date NULL,
    ultima_renovacion date NULL,
    version bigint NULL
);

CREATE TABLE dbo.migracion_transporte (
    version varchar(80) NOT NULL CONSTRAINT PK_migracion_transporte PRIMARY KEY,
    aplicada datetime2(6) NULL CONSTRAINT DF_migracion_aplicada DEFAULT (SYSDATETIME())
);
```

### Particularidades de claves y relaciones

Son **20 tablas**. Las colecciones `conductor_permiso`, `plantilla_documento_departamento` y `plantilla_documento_firmante` son listas JPA sin identificador propio ni columna de orden; no se les inventa una PK ni una unicidad que impediría duplicados admitidos por el mapeo. Si una herramienta de migración exige PK, habrá que acordar y adaptar ese cambio.

`plantilla_documento_firmante.trabajador_id` es un entero de una colección, no una relación JPA a `Trabajador`: el DDL conserva la ausencia de FK hacia trabajador. `conductor.legacy_transportista_id` tampoco es FK; es una referencia histórica única cuando tiene valor.

`renovacion_vestuario.id` no es `IDENTITY`: Java lo inicializa a 1. No se añade un `CHECK (id = 1)` porque el modelo no lo declara. Su `version` es un contador `@Version` administrado por Hibernate, sin `DEFAULT` ni conversión a `rowversion`.

La unicidad de `vehiculo_id` se aplica por separado en conductor y transportista. No impide por sí sola que ambas tablas referencien el mismo vehículo; el flujo nuevo gestiona asignaciones desde conductor.

No se declara unicidad para matrícula, correo de usuario, DNI de transportista o DNI de trabajador: las entidades no la establecen. No debe suponerse que ya exista.

### Índices adicionales recomendados (opcionales)

Las PK y las restricciones `UNIQUE` ya aportan sus índices. Estos índices adicionales son una propuesta para las consultas habituales, no una copia de los índices actuales de MySQL:

```sql
CREATE INDEX IX_documento_vehiculo ON dbo.documento(vehiculo_id);
CREATE INDEX IX_documento_transportista ON dbo.documento(transportista_id);
CREATE INDEX IX_documento_conductor ON dbo.documento(conductor_id);
CREATE INDEX IX_documento_trabajador ON dbo.documento(trabajador_id);
CREATE INDEX IX_documento_caducidad ON dbo.documento(fecha_caducidad);
CREATE INDEX IX_vinculo_conductor_id ON dbo.vinculo_conductor(conductor_id);
CREATE INDEX IX_conductor_permiso ON dbo.conductor_permiso(conductor_id);
CREATE INDEX IX_permiso_transportista ON dbo.permiso_conducir(transportista_id);
CREATE INDEX IX_transportista_empresa ON dbo.transportista(empresa_id);
CREATE INDEX IX_entrega_trabajador ON dbo.entrega(trabajador_id);
CREATE INDEX IX_linea_entrega ON dbo.linea_entrega(entrega_id);
CREATE INDEX IX_linea_material ON dbo.linea_entrega(material_id);
CREATE INDEX IX_plantilla_departamento ON dbo.plantilla_documento_departamento(plantilla_id);
CREATE INDEX IX_plantilla_firmante ON dbo.plantilla_documento_firmante(plantilla_id);
CREATE INDEX IX_firma_trabajador ON dbo.firma_documento(trabajador_id);
```

## 4. Valores y significado de los datos

| Campo | Valores o significado |
|---|---|
| `transportista.tipo_transportista` | Altas actuales: `EMPRESA`, `AUTONOMO`. Puede quedar `CONDUCTOR` en fichas históricas. |
| `conductor.tipo_conductor` | `EMPLEADO`, `AUTONOMO`. |
| `vinculo_conductor.tipo_vinculo` | `EMPLEADO`, `AUTONOMO_COLABORADOR`. |
| `documento.estado` | `VIGENTE`, `PENDIENTE`, `CADUCADO`, `ANULADO`. |
| `documento.tipo`: vehículos | `PERMISO_CIRCULACION`, `FICHA_TECNICA`, `ITV`, `TARJETA_TRANSPORTE`, `SEGURO`, `SEGURO_RESPONSABILIDAD_CIVIL`, `SEGURO_CARGA`. |
| `documento.tipo`: transportistas | `ALTA_AUTONOMO`, `MODELO_036_037`, `CERTIFICADO_SEG_SOCIAL`, `AEAT`. |
| `documento.tipo`: conductores | `ALTA_TRABAJADOR`, `CARNET`. `CARNET` sigue en la enumeración por compatibilidad; el servicio rechaza nuevas altas de ese tipo y lo excluye de los listados documentales ordinarios. |
| `usuario.rol` | Valores previstos por el modelo: `ADMIN`, `GESTOR`, `USUARIO`, `KIOSKO`. |
| `aviso.tipo` | Valores descritos en el modelo: `NOTA`, `RECORDATORIO`, `EVENTO`, `AVISO`. Texto libre a nivel SQL. |
| `aviso.prioridad` | `NORMAL`, `IMPORTANTE`, `URGENTE`, según el comentario del modelo. |
| `material.tipo` | `EPI`, `VESTUARIO`. |
| `material.tipo_tallaje` | `UNICA`, `PARTES_ARRIBA`, `PANTALONES`, `CALZADO`, `GUANTES`, `OTRO`. |
| `linea_entrega.estado` | `ENTREGADO`, `DEVUELTO`, `PENDIENTE_RENOVACION`, `RENOVADO`, `CADUCADO`. |
| Permisos: `tipo` | Categoría del permiso de conducir. Es una cadena, no una enumeración SQL. |

Los campos `tipo_carnet` y `cad_carnet` de conductor resumen sus permisos: categorías distintas concatenadas y fecha de caducidad más próxima entre las informadas. Las fotos contienen referencias a archivos o contenido histórico; no se debe deducir su formato solo por el nombre del campo.

## 5. Funcionamiento de la web: transportistas

### Transportistas y conductores

La interfaz React consume una API Java/Spring Boot. El apartado **Transportistas** permite consultar y filtrar empresas y autónomos, buscar por sus datos y acceder a su ficha. Una empresa guarda su nombre o razón social y NIF; un autónomo guarda nombre, apellidos y DNI/NIE, además de correo y teléfono. El servicio normaliza y valida la identificación; los apellidos son obligatorios para autónomos.

La persona que conduce tiene una ficha independiente en **Conductores**, con DNI único, contacto, condición de empleado o autónomo, permisos de conducir, fechas, fotos del anverso y reverso y vehículo asignado. Se puede dar de alta un transportista autónomo indicando que también es conductor: el backend crea o reutiliza la ficha compatible de conductor y genera el vínculo correspondiente.

`vinculo_conductor` conecta ambas fichas. Un transportista puede tener varios conductores y un conductor puede estar vinculado a varios transportistas. La pareja no se duplica; asociarla de nuevo actualiza su tipo de vínculo. Para `AUTONOMO_COLABORADOR`, el conductor debe ser autónomo. Desvincular elimina la asociación, manteniendo la ficha del conductor.

El vehículo se asigna desde conductor y no puede estar asignado a otro conductor simultáneamente. La aplicación mantiene separados los datos fiscales del transportista, la documentación personal del conductor y la documentación del vehículo.

### Documentación y vencimientos

`documento` guarda tipo, emisión, caducidad, referencia, aseguradora cuando corresponde, estado, nombre de archivo y activación de avisos. El servicio asocia cada documento a una sola entidad: transportista, conductor, vehículo o trabajador. Las cuatro FK son opcionales individualmente en SQL; la exclusividad se valida en la aplicación, no mediante un `CHECK` en esta propuesta.

Al guardar se exige adjuntar PDF o imagen y se valida que las fechas sean coherentes y que los tipos que requieren caducidad la incluyan. El carnet se gestiona mediante las fotos de la ficha del conductor. El historial documental permite conservar distintas versiones del mismo tipo.

El servicio mantiene `ANULADO` y `PENDIENTE`; para los demás casos calcula `CADUCADO` si la fecha de caducidad es anterior a hoy y `VIGENTE` en caso contrario. Por ello, el estado devuelto por la API puede diferir del texto almacenado. El calendario muestra vencimientos documentales y de carnets; el campo `avisos` permite controlar los avisos de documentos. Esto no implica por sí solo envío de correos o notificaciones externas.

Para la disponibilidad documental de un vehículo se revisan los siete tipos de documentación de vehículo. Se toma por tipo la versión no anulada más reciente, ordenada por caducidad o, si falta, emisión, y después por ID. La falta de documento, un estado pendiente, la ausencia de caducidad requerida o una fecha vencida producen motivos de no disponibilidad. Permiso de circulación y ficha técnica no requieren caducidad en ese cálculo. `disponibilidad_forzada` permite marcarlo disponible conservando los motivos; `activo` es un dato separado.

### Archivos e históricos

El código actual utiliza servicios de archivos y una API de RR. HH. para almacenar documentación y carnets en NAS; también contempla contenido histórico en los campos de texto. **Copiar SQL no copia los archivos externos**. Deben trasladarse o conservarse las rutas/referencias, el acceso del servicio al NAS y la configuración de esa API.

Antes de eliminar un transportista hay que desvincular sus conductores. Las referencias documentales también deben resolverse para que las FK permitan el borrado. El servicio de eliminación de conductor elimina sus documentos, vínculos y fotos mediante los servicios correspondientes. Al eliminar un vehículo se desasigna y se eliminan sus registros documentales. Estas operaciones de aplicación no deben sustituirse por borrados directos sin revisar el ciclo de vida de archivos.

### Separación histórica del transporte

`MigracionTransporte` conserva las fichas originales de transportista y crea conductores a partir de antiguos autónomos o fichas `CONDUCTOR`, copia permisos, crea vínculos y reasigna determinados documentos. `legacy_transportista_id` permite rastrear esa procedencia. Las asignaciones antiguas de vehículo del transportista se vacían durante esa transformación.

Por compatibilidad se conservan `permiso_conducir`, `transportista.empresa_id` y los datos antiguos de carnet/vehículo del transportista. Los permisos actuales de los conductores se guardan en `conductor_permiso`. No eliminar los campos históricos durante el traslado sin verificar sus datos.

`migracion_transporte` registra la marca `separacion-conductores-v1`. Hay que copiar también esta tabla y su contenido si la separación ya se ejecutó en origen: crear la tabla vacía no equivale a haber aplicado la transformación.

## 6. Trabajo necesario para conectar con SQL Server

El backend aún está configurado para MySQL. Este documento no cambia esa configuración. Antes de conectarlo al nuevo servidor hay que:

1. Sustituir `com.mysql:mysql-connector-j` por el controlador JDBC de Microsoft `com.microsoft.sqlserver:mssql-jdbc`, compatible con el Java utilizado, en `pom.xml`.
2. Cambiar URL, controlador, credenciales y configuración de dialecto cuando corresponda. Ejemplo orientativo, sin credenciales reales:

   ```properties
   spring.datasource.url=jdbc:sqlserver://SERVIDOR:1433;databaseName=gestion_documental;encrypt=true;trustServerCertificate=false
   spring.datasource.username=${DB_USERNAME}
   spring.datasource.password=${DB_PASSWORD}
   spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
   spring.jpa.hibernate.ddl-auto=validate
   ```

   Ajustar puerto, instancia, autenticación y certificado al servidor real. Con `validate`, el arranque comprobará el esquema en vez de intentar alterarlo; revisar primero la correspondencia de los mapeos.

3. Sustituir las definiciones JPA explícitas `TEXT` y `LONGTEXT` por mapeos compatibles con SQL Server y con los tipos de destino; revisar Unicode, tipos LOB y validación Hibernate.
4. Adaptar `DatabaseSchemaMigration`: utiliza `DATABASE()`, `MODIFY COLUMN`, `ADD COLUMN`, `TRUE` e `IF(...)` con sintaxis de MySQL. Su primera consulta no está protegida por los bloques que ignoran errores y puede impedir el arranque.
5. Adaptar `MigracionTransporte`, que contiene `CREATE TABLE IF NOT EXISTS` y lógica SQL escrita para el origen. No basta con cambiar el dialecto de Hibernate: no reescribe SQL enviado a `JdbcTemplate`. Mantener la marca de migración y evitar repetir la separación sobre datos ya migrados.
6. Revisar las demás consultas nativas y probar las funciones del módulo, incluidos listados y filtros. No se ha ejecutado una validación completa de compatibilidad del backend en esta entrega.

## 7. Traslado y comprobación de datos

1. Obtener copia de seguridad de MySQL e inventario real de tablas, columnas, índices, FK, vistas y triggers. Comparar con las 20 tablas documentadas. `ddl-auto=update` puede haber dejado columnas de versiones anteriores.
2. Acordar la intercalación de destino y comprobar duplicados bajo sus reglas de mayúsculas y acentos, especialmente en DNI y claves de texto. Verificar tamaños reales de textos y valores de enumeraciones antes de cargar.
3. Crear las tablas en una base vacía. Cargar primero usuarios, vehículos, trabajadores, materiales y plantillas; después transportistas, conductores y relaciones dependientes. La autorrelación de transportista puede requerir cargar `empresa_id` a `NULL` y completarlo al terminar de insertar todos los transportistas.
4. Conservar los ID originales: activar `SET IDENTITY_INSERT dbo.nombre_tabla ON`, insertar con lista explícita de columnas y desactivarlo al terminar cada tabla. Solo una tabla por sesión puede tenerlo activo. No usarlo en las tablas sin `IDENTITY`.
5. Importar las colecciones, documentos, entregas, líneas, firmas, avisos y tablas de control respetando sus FK. Convertir booleanos, fechas y textos de forma explícita; revisar fechas inválidas o valores cero de MySQL antes de la carga.
6. Comprobar y ajustar la identidad con `DBCC CHECKIDENT` cuando proceda para que la siguiente inserción no colisione con ID importados. Conservar el contador `version` de renovación y el historial de migraciones.
7. Comparar recuentos por tabla, ID, relaciones y muestras de campos completos, incluidos textos largos. Comprobar descarga de documentos y fotos, navegación transportista-conductor, permisos, asignaciones, vencimientos y disponibilidad.
8. Hacer la sincronización final con las escrituras detenidas en origen, verificar el arranque del backend adaptado y conservar la copia de origen para recuperación.

El DDL se ha contrastado con el código del repositorio. **No se ha ejecutado en una instancia SQL Server ni contrastado con el esquema vivo de MySQL**; esas dos comprobaciones forman parte de la migración.
