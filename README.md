# Maestro Pagos

App de Monitoreo de Pagos para Profesor de Inglés

Quiero que construyas una aplicación web para un profesor particular de inglés, que le permita monitorear de forma simple y visual los pagos de sus alumnos.

Objetivo principal

El profesor necesita saber, de un vistazo, qué alumnos llevan más tiempo sin pagar, para poder darles seguimiento. La app debe ser elegante, clara y muy fácil de usar, pensada para un usuario que no es experto en tecnología.

Usuario y acceso

Un único usuario: el profesor.

Login extremadamente simple: acceso solo con su nombre de usuario, sin contraseñas complicadas (si se necesita algún mínimo de seguridad, usar algo tan simple como un PIN corto de 4 dígitos).

Estructura de datos

Grupos

Nombre del grupo

Estudiantes que pertenecen a ese grupo

Estudiantes

Nombre completo

Grupo asignado (puede no tener grupo)

Fecha del último pago

Historial de fechas de pago

Funcionalidades

1. Dashboard / Ranking principal

La vista principal muestra a todos los estudiantes ordenados de mayor a menor según los días que llevan sin pagar, para que los que necesitan más atención aparezcan primero. Cada fila muestra: nombre completo, grupo y cantidad de días sin pagar.

2. Gestión de grupos

Crear, renombrar y eliminar grupos.

Agregar estudiantes a un grupo o quitarlos (desagregar), sin perder su historial de pagos.

3. Gestión de estudiantes

Agregar, editar y eliminar estudiantes.

Asignar o cambiar el grupo de un estudiante.

Registrar un nuevo pago (esto actualiza automáticamente la fecha de último pago y reinicia el contador de días sin pagar).

4. Historial de pagos

Por cada estudiante, ver el listado completo de fechas en las que pagó.

5. Búsqueda y filtros

Buscar estudiante por nombre.

Filtrar la lista por grupo.

Ordenar por días sin pagar o alfabéticamente.

6. Estadísticas generales

Total de estudiantes activos.

Cantidad de estudiantes atrasados (más de X días sin pagar; que ese umbral sea configurable, sugerido 30 días).

Promedio de días sin pagar entre todos los estudiantes.

Estudiante con más días sin pagar.

7. Calendario / línea de tiempo

Vista tipo calendario o timeline que muestre los pagos registrados por fecha, y que estime visualmente los próximos vencimientos (asumiendo un ciclo mensual desde el último pago de cada estudiante).

Diseño visual

Estilo elegante y minimalista.

Paleta de colores en tonos grises y azules (azul marino o azul acero como color principal, grises claros y oscuros de apoyo).

Tipografía limpia y legible, con jerarquía visual clara.

Botones grandes y navegación simple, pensada para un usuario no técnico.

Diseño responsive, que se vea bien también desde el celular.

Notas técnicas

No es necesario manejar montos de dinero, solo el seguimiento de fechas de pago.

Priorizar la claridad y la simplicidad sobre elementos decorativos. idioa en español

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/509a933d-578b-4ca5-9758-a02444866dc2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
