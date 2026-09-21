import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocumentoReporte } from '@/common/types/reportes';

const MARGEN = 12;

/** Genera el PDF del reporte y dispara la descarga. */
export function descargarPdf(documento: DocumentoReporte): void {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const ancho = pdf.internal.pageSize.getWidth();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(documento.titulo, MARGEN, 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90);

  const mitad = Math.ceil(documento.encabezado.length / 2);
  documento.encabezado.forEach(([etiqueta, valor], indice) => {
    const columna = indice < mitad ? MARGEN : ancho / 2;
    const linea = 20 + (indice % mitad) * 4;
    pdf.text(`${etiqueta}: ${valor}`.slice(0, 90), columna, linea);
  });

  let posicion = 22 + mitad * 4;
  pdf.setTextColor(20);

  for (const seccion of documento.secciones) {
    if (seccion.titulo) {
      if (posicion > pdf.internal.pageSize.getHeight() - 30) {
        pdf.addPage();
        posicion = 16;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(seccion.titulo, MARGEN, posicion);
      posicion += 4;
      if (seccion.subtitulo) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(110);
        pdf.text(seccion.subtitulo, MARGEN, posicion);
        pdf.setTextColor(20);
        posicion += 4;
      }
    }

    if (seccion.textos?.length) {
      pdf.setFontSize(8);
      for (const bloque of seccion.textos) {
        const lineas = pdf.splitTextToSize(`${bloque.titulo}: ${bloque.cuerpo}`, ancho - MARGEN * 2);
        if (posicion + lineas.length * 3.6 > pdf.internal.pageSize.getHeight() - 14) {
          pdf.addPage();
          posicion = 16;
        }
        pdf.setFont('helvetica', 'normal');
        pdf.text(lineas, MARGEN, posicion);
        posicion += lineas.length * 3.6 + 2;
      }
      posicion += 3;
      continue;
    }

    autoTable(pdf, {
      head: [seccion.columnas],
      body: seccion.filas.map((fila) => fila.map((celda) => String(celda))),
      startY: posicion,
      margin: { left: MARGEN, right: MARGEN },
      styles: { fontSize: 7.5, cellPadding: 1.4, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [252, 252, 253] },
      didParseCell: (datos) => {
        if (datos.section === 'body' && seccion.destacadas?.includes(datos.row.index)) {
          datos.cell.styles.fontStyle = 'bold';
          datos.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    const tabla = (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    posicion = (tabla?.finalY ?? posicion) + 7;
  }

  if (documento.pie) {
    const paginas = pdf.getNumberOfPages();
    pdf.setFontSize(7);
    pdf.setTextColor(140);
    for (let i = 1; i <= paginas; i += 1) {
      pdf.setPage(i);
      pdf.text(
        `${documento.pie} · página ${i} de ${paginas}`,
        MARGEN,
        pdf.internal.pageSize.getHeight() - 6,
      );
    }
  }

  pdf.save(`${documento.archivo}.pdf`);
}
