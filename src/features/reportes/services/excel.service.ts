import ExcelJS from 'exceljs';
import type { DocumentoReporte } from '@/common/types/reportes';

const BORDE_SUAVE = { style: 'thin' as const, color: { argb: 'FFE2E8F0' } };

/** Exporta el reporte a .xlsx conservando el orden de las secciones. */
export async function descargarExcel(documento: DocumentoReporte): Promise<void> {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Presupuestador PRO';
  libro.created = new Date();

  const hoja = libro.addWorksheet(documento.titulo.slice(0, 30));

  const titulo = hoja.addRow([documento.titulo]);
  titulo.font = { bold: true, size: 14 };
  hoja.addRow([]);

  for (const [etiqueta, valor] of documento.encabezado) {
    const fila = hoja.addRow([etiqueta, valor]);
    fila.getCell(1).font = { bold: true, size: 10 };
    fila.getCell(2).font = { size: 10 };
  }
  hoja.addRow([]);

  for (const seccion of documento.secciones) {
    if (seccion.titulo) {
      const fila = hoja.addRow([seccion.titulo]);
      fila.font = { bold: true, size: 11 };
    }
    if (seccion.subtitulo) {
      const fila = hoja.addRow([seccion.subtitulo]);
      fila.font = { size: 9, color: { argb: 'FF64748B' } };
    }

    if (seccion.textos?.length) {
      for (const bloque of seccion.textos) {
        const fila = hoja.addRow([bloque.titulo, bloque.cuerpo]);
        fila.getCell(1).font = { bold: true, size: 9 };
        fila.getCell(2).alignment = { wrapText: true, vertical: 'top' };
      }
      hoja.addRow([]);
      continue;
    }

    if (seccion.columnas.length > 0) {
      const encabezado = hoja.addRow(seccion.columnas);
      encabezado.font = { bold: true, size: 10, color: { argb: 'FF475569' } };
      encabezado.eachCell((celda) => {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        celda.border = { top: BORDE_SUAVE, bottom: BORDE_SUAVE, left: BORDE_SUAVE, right: BORDE_SUAVE };
      });
    }

    seccion.filas.forEach((valores, indice) => {
      const fila = hoja.addRow(valores);
      if (seccion.destacadas?.includes(indice)) fila.font = { bold: true };
      fila.eachCell((celda) => {
        celda.border = { top: BORDE_SUAVE, bottom: BORDE_SUAVE, left: BORDE_SUAVE, right: BORDE_SUAVE };
      });
    });

    hoja.addRow([]);
  }

  hoja.columns.forEach((columna, indice) => {
    columna.width = indice === 0 ? 46 : 18;
  });

  const buffer = await libro.xlsx.writeBuffer();
  const enlace = document.createElement('a');
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  enlace.href = url;
  enlace.download = `${documento.archivo}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}
