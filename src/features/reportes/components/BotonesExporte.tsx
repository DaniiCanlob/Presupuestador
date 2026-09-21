import { useState } from 'react';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import { reportesService } from '@/features/reportes/services/reportes.service';
import { Boton } from '@/common/ui/Boton';
import { useNotificar } from '@/common/ui/Notificaciones';
import type { TipoReporte } from '@/common/types/reportes';
import type { Proyecto } from '@/common/types/proyecto';

interface BotonesExporteProps {
  proyecto: Proyecto;
  reporte: TipoReporte;
}

export function BotonesExporte({ proyecto, reporte }: BotonesExporteProps) {
  const [generando, setGenerando] = useState<'pdf' | 'excel' | null>(null);
  const notificar = useNotificar();

  const exportar = async (formato: 'pdf' | 'excel'): Promise<void> => {
    setGenerando(formato);
    try {
      const documento = await reportesService.construir(proyecto, reporte);
      // jsPDF y ExcelJS pesan ~1 MB: se cargan solo cuando el usuario exporta.
      if (formato === 'pdf') {
        const { descargarPdf } = await import('@/features/reportes/services/pdf.service');
        descargarPdf(documento);
      } else {
        const { descargarExcel } = await import('@/features/reportes/services/excel.service');
        await descargarExcel(documento);
      }
    } catch (error) {
      notificar(error instanceof Error ? error.message : 'No pudimos generar el archivo.', 'error');
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Boton
        variante="secundario"
        tamano="sm"
        icono={<FileDown className="h-4 w-4" />}
        cargando={generando === 'pdf'}
        onClick={() => void exportar('pdf')}
      >
        PDF
      </Boton>
      <Boton
        variante="secundario"
        tamano="sm"
        icono={<FileSpreadsheet className="h-4 w-4" />}
        cargando={generando === 'excel'}
        onClick={() => void exportar('excel')}
      >
        Excel
      </Boton>
      <Boton
        variante="fantasma"
        tamano="sm"
        icono={<Printer className="h-4 w-4" />}
        onClick={() => window.print()}
        aria-label="Imprimir"
      />
    </div>
  );
}
