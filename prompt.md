Hay varias diferencias entre el wireframe y el dashboard actual. 
Corrígelas en EnergyShell.tsx:

FIX 1 — Hero izquierdo: número maestro
El wireframe muestra UN número grande con % (ej: "74 %") 
no "16 / 90". 
El número debe ser el % de ocupación promedio del día.
El denominador debe quitarse — solo mostrar el número y el símbolo %.

FIX 2 — Barras del hero
En el wireframe las barras son más grandes, con más altura,
con el % arriba de cada barra y la fecha/semana debajo.
Aumenta la altura de cada barra a mínimo 40px.
El color de la barra debe ocupar TODO el ancho disponible
proporcional al % — no una barra delgada roja fija.

FIX 3 — KPIs de la derecha: dentro del mismo card
En el wireframe los 6 KPIs (Ingresado, Clases, Horas, Paquetes, 
Ticket, Precio/hora) están DENTRO del mismo card oscuro que el 
número maestro, a la derecha, en grid 2×3.
Actualmente están en cards separados afuera. 
Muévelos dentro del mismo card del hero.

FIX 4 — Datos del mes vs año
$36K y 106 paquetes son datos del año completo.
El wireframe muestra $22,140 y 38 paquetes (mes actual).
Verifica que todos los queries en getKPIsMes usan:
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())

FIX 5 — Chart de ingresos acumulados
En el wireframe el chart tiene:
- Fondo oscuro #161616
- Línea dorada = ingresos 2026
- Línea gris punteada = ingresos 2025  
- Línea azul = horas consumidas (eje derecho)
- Línea azul punteada = horas proyectadas (eje derecho)
- Los 6 stats debajo DENTRO del mismo card
Actualmente solo tiene barras azules y una línea amarilla.
Reconstruye este chart siguiendo exactamente el wireframe.

FIX 6 — Topbar del dashboard Energy
El wireframe tiene un topbar negro con:
- Punto dorado parpadeante + "Energy Cycle Studio · Pulso"
- Botones Día/Semana/Mes/Año a la derecha
- Fecha actual
Actualmente solo dice "Energy" en blanco simple.
Agrega este topbar al layout de Energy.

FIX 7 — Secciones faltantes
El wireframe tiene debajo del chart de ingresos:
- "¿Qué requiere acción ahora?" con 3 cards (rojo/amarillo/verde)
- "Tendencia del negocio" con 2 charts lado a lado
- "Lectura del negocio" con 4 bullets en grid 2×2
Agrégalas si no existen.

No toques Taller.
Muéstrame el resultado en el browser.