/* =====================================================================
   Registro de documentos de Corpoguepsa
   ---------------------------------------------------------------------
   Para publicar un documento nuevo:
   1. Copia el archivo en la subcarpeta de su categoría dentro de
      documentos/ (nombre en minúsculas, sin tildes ni espacios).
   2. Agrega una línea al arreglo CORPOGUEPSA_DOCUMENTOS:
        titulo    → nombre que verá la comunidad.
        categoria → una de las claves de CORPOGUEPSA_CATEGORIAS.
        archivo   → ruta del archivo desde la raíz del sitio.
        fecha     → 'AAAA-MM' o 'AAAA-MM-DD' (opcional).
        tamano    → texto como '1,6 MB' (opcional).
   3. Sube en index.html el número de versión de registro.js (?v=).
   El formato (PDF, Word, Excel…) se toma de la extensión del archivo.
   Las fechas actuales corresponden al mes en que cada archivo se
   publicó en el sitio anterior (corpoguepsa.com).
   ===================================================================== */

window.CORPOGUEPSA_CATEGORIAS = {
  'estados-financieros': 'Estados financieros',
  'comunicados-y-convocatorias': 'Comunicados y convocatorias',
  'estatutos': 'Estatutos',
  'contratos': 'Contratos de servicio',
  'servicio-de-aseo': 'Servicio de aseo'
};

window.CORPOGUEPSA_DOCUMENTOS = [
  { titulo: "Estados financieros vigencia 2025", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2025.pdf', fecha: '2026-05', tamano: '1,5 MB' },
  { titulo: "Estados financieros 2024", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2024.pdf', fecha: '2025-03', tamano: '1,6 MB' },
  { titulo: "Estados financieros 2023", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2023.pdf', fecha: '2024-04', tamano: '975 KB' },
  { titulo: "Estados financieros 2022 (E)", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2022.pdf', fecha: '2023-05', tamano: '17,6 MB' },
  { titulo: "Estados financieros 2021 (E)", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2021.pdf', fecha: '2023-05', tamano: '16,8 MB' },
  { titulo: "Estados financieros 2020 (E)", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2020.pdf', fecha: '2023-05', tamano: '23,3 MB' },
  { titulo: "Estados financieros 2019 (E)", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2019.pdf', fecha: '2023-05', tamano: '32,0 MB' },
  { titulo: "Estados financieros 2018 (E)", categoria: 'estados-financieros', archivo: 'documentos/estados-financieros/estados-financieros-2018.pdf', fecha: '2023-05', tamano: '17,0 MB' },
  { titulo: "Comunicado reunión 28 de agosto de 2026", categoria: 'comunicados-y-convocatorias', archivo: 'documentos/comunicados-y-convocatorias/comunicado-reunion-28-agosto-2026.pdf', fecha: '2026-07', tamano: '168 KB' },
  { titulo: "Convocatoria revisora fiscal 2026–2028", categoria: 'comunicados-y-convocatorias', archivo: 'documentos/comunicados-y-convocatorias/convocatoria-revisora-fiscal-2026-2028.pdf', fecha: '2026-06', tamano: '341 KB' },
  { titulo: "Convocatoria revisoría fiscal 2024", categoria: 'comunicados-y-convocatorias', archivo: 'documentos/comunicados-y-convocatorias/convocatoria-revisoria-fiscal-2024.pdf', fecha: '2024-06', tamano: '117 KB' },
  { titulo: "Cartilla Corpoguepsa asamblea 2024", categoria: 'comunicados-y-convocatorias', archivo: 'documentos/comunicados-y-convocatorias/cartilla-asamblea-2024.pdf', fecha: '2024-03', tamano: '1,5 MB' },
  { titulo: "Propuesta de reforma de estatutos 2025", categoria: 'estatutos', archivo: 'documentos/estatutos/propuesta-reforma-estatutos-2025.pdf', fecha: '2025-03', tamano: '375 KB' },
  { titulo: "Estatutos nuevos 2022", categoria: 'estatutos', archivo: 'documentos/estatutos/estatutos-2022.pdf', fecha: '2023-04', tamano: '8,0 MB' },
  { titulo: "Estatutos de la corporación", categoria: 'estatutos', archivo: 'documentos/estatutos/estatutos-de-la-corporacion.pdf', fecha: '2022-04', tamano: '52,6 MB' },
  { titulo: "Contrato de condiciones uniformes (CCU) aseo 2024", categoria: 'contratos', archivo: 'documentos/contratos/contrato-condiciones-uniformes-aseo-2024.pdf', fecha: '2024-10', tamano: '780 KB' },
  { titulo: "Concepto de legalidad CCU aseo 20240120126801", categoria: 'contratos', archivo: 'documentos/contratos/concepto-legalidad-ccu-aseo-20240120126801.pdf', fecha: '2024-11', tamano: '113 KB' },
  { titulo: "Contrato de condiciones uniformes 2021", categoria: 'contratos', archivo: 'documentos/contratos/contrato-condiciones-uniformes-2021.pdf', fecha: '2022-04', tamano: '1,5 MB' },
  { titulo: "Tarifas Corpoguepsa aseo", categoria: 'servicio-de-aseo', archivo: 'documentos/servicio-de-aseo/tarifas-aseo.pdf', fecha: '2024-11', tamano: '112 KB' },
  { titulo: "Nuevos horarios de rutas de recolección de basuras, barrido y lavado de áreas públicas", categoria: 'servicio-de-aseo', archivo: 'documentos/servicio-de-aseo/nuevos-horarios-rutas-recoleccion-barrido-lavado.pdf', fecha: '2024-11', tamano: '304 KB' },
  { titulo: "Horario y rutas de aseo", categoria: 'servicio-de-aseo', archivo: 'documentos/servicio-de-aseo/horario-y-rutas-de-aseo.pdf', fecha: '2024-01', tamano: '259 KB' },
  { titulo: "PPSPDA Corpoguepsa", categoria: 'servicio-de-aseo', archivo: 'documentos/servicio-de-aseo/ppspda-corpoguepsa.pdf', fecha: '2024-11', tamano: '3,2 MB' }
];
