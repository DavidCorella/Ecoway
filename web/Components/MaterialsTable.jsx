"use client";

import {
    useEffect,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileSpreadsheet, FileDown } from "lucide-react";
import { getMaterials, deleteMaterial } from "../services/MaterialsService";
import { showConfirm } from "../utils/alerts";
import ModalEditMaterial from "../Components/ModalEditMaterial";
import ExportColumnPicker from "./ExportColumnPicker";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";

// Columnas disponibles al exportar, en el orden en que se muestran
const EXPORT_COLUMNS = [
    { key: "description_material", label: "Descripción", value: (m) => m.description_material },
    { key: "physical_state", label: "Estado Físico", value: (m) => m.physical_state },
    { key: "price", label: "Precio sugerido por kilogramo", value: (m) => m.price },
    { key: "currency", label: "Moneda", value: (m) => m.currency },
    { key: "unit", label: "Unidad", value: (m) => m.unit },
    { key: "classify", label: "Categoría", value: (m) => m.classify },
    { key: "max_management_days", label: "Máx. días de gestión", value: (m) => m.max_management_days ?? "" },
];

const TableMaterials = forwardRef((props, ref) => {

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMaterial, setEditMaterial] = useState(null);
    const [search, setSearch] = useState("");
    const [exportFormat, setExportFormat] = useState(null); // "excel" | "pdf" | null


    const loadMaterials = async () => {
        setLoading(true);

        try {
            const data = await getMaterials();
            setMaterials(data);
        } finally {
            setLoading(false);
        }
    };


    const exportExcel = (selectedKeys) => {
        const cols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));

        const data = filteredMaterials.map((item) => {
            const row = {};
            cols.forEach((c) => {
                row[c.label] = c.value(item);
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet["!cols"] = cols.map((c) => ({ wch: Math.max(10, c.label.length + 4) }));

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Materiales"
        );

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const file = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        saveAs(file, "Materiales.xlsx");
    };


    const exportPDF = (selectedKeys) => {
        const cols = EXPORT_COLUMNS.filter((c) => selectedKeys.includes(c.key));
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Listado de Materiales", 14, 20);

        autoTable(doc, {
            startY: 30,
            head: [cols.map((c) => c.label)],
            body: filteredMaterials.map((item) => cols.map((c) => c.value(item))),
        });

        doc.save("Materiales.pdf");
    };

    const filteredMaterials = materials.filter((item) => {
        const matchesSearch =
            !search ||
            item.description_material
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            item.physical_state
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            item.classify
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            item.unit
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            item.currency
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            String(item.price).includes(search);

        return matchesSearch;
    });


    useEffect(() => {
        loadMaterials();
    }, []);

    // Si otra PC crea/edita/borra un material, esta tabla se refresca
    // sola en el momento, sin que nadie tenga que recargar el navegador.
    // Tambien depende de categoria/unidad/moneda/estado fisico (se
    // muestran por nombre, ya unidos desde el backend): si alguno de esos
    // catalogos cambia en otro lado hay que volver a pedir la lista, si
    // no queda con el nombre viejo y despues no calza al editar un material
    useRealtimeRefresh("materials", loadMaterials);
    useRealtimeRefresh("classify", loadMaterials);
    useRealtimeRefresh("units", loadMaterials);
    useRealtimeRefresh("currency", loadMaterials);
    useRealtimeRefresh("physicalStates", loadMaterials);

    useImperativeHandle(ref, () => ({
        reload: loadMaterials,
    }));


    const handleDelete = async (id) => {
        const result = await showConfirm(
            "Confirmar eliminación",
            "¿Seguro que deseas eliminar este material?"
        );

        if (!result.isConfirmed) return;

        await deleteMaterial(id);
        loadMaterials();
    };


    if (loading) {
        return <p className="p-4 text-ink-dim">Cargando materiales...</p>;
    }


    return (
        <div className="overflow-x-auto rounded-2xl border border-edge bg-surface shadow-sm">

            <div className="border-b border-edge bg-surface-2 p-4 flex flex-col md:flex-row gap-3 justify-between">

    <input
        type="text"
        placeholder="Buscar material..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 rounded-lg border border-edge bg-surface px-4 py-2 focus:outline-none focus:ring-2 focus:ring-materials/40 focus:border-materials text-ink"
    />

    <div className="flex gap-2">

        <button
            onClick={() => setExportFormat("excel")}
            className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-2.5 text-sm font-semibold text-success transition hover:bg-success/15"
        >
            <FileSpreadsheet size={16} />
            Excel
        </button>

        <button
            onClick={() => setExportFormat("pdf")}
            className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/15"
        >
            <FileDown size={16} />
            PDF
        </button>

    </div>

</div>

            <table className="w-full text-ink">
                <thead className="bg-surface-2">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-dim">
                        <th className="px-6 py-3.5">Descripción</th>
                        <th className="px-6 py-3.5">Estado físico</th>
                        <th className="px-6 py-3.5">Precio sugerido por kilogramo</th>
                        <th className="px-6 py-3.5">Unidad</th>
                        <th className="px-6 py-3.5">Categoría</th>
                        <th className="px-6 py-3.5">Máx. días de gestión</th>
                        <th className="px-6 py-3.5">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredMaterials.length > 0 ? (
                        filteredMaterials.map((item) => (
                            <tr
                                key={item.id}
                                className="border-t border-edge transition hover:bg-surface-2/60"
                            >
                                <td className="px-6 py-4 font-medium">
                                    {item.description_material}
                                </td>

                                <td className="px-6 py-4">
                                    <span className="rounded-full bg-materials-soft px-3 py-1 text-sm text-materials-strong">
                                        {item.physical_state}
                                    </span>
                                </td>

                                <td className="px-6 py-4 font-data">
                                    {item.price} {item.currency}
                                </td>

                                <td className="px-6 py-4 text-ink-dim">
                                    {item.unit}
                                </td>

                                <td className="px-6 py-4 text-ink-dim">
                                    {item.classify}
                                </td>

                                <td className="px-6 py-4 font-data text-ink-dim">
                                    {item.max_management_days ?? "—"}
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                setEditMaterial(item)
                                            }
                                            title={`Editar ${item.description_material}`}
                                            className="rounded-lg border border-edge px-3.5 py-1.5 text-sm text-ink transition hover:bg-surface-2"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDelete(item.id)
                                            }
                                            title={`Eliminar ${item.description_material}`}
                                            className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-1.5 text-sm text-danger transition hover:brightness-95"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={7}
                                className="py-6 text-center text-ink-dim"
                            >
                                {materials.length === 0
                                    ? "No hay materiales registrados."
                                    : "No se encontraron materiales."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {editMaterial && (
                <ModalEditMaterial
                    material={editMaterial}
                    setShowModal={() => setEditMaterial(null)}
                    onSuccess={() => {
                        setEditMaterial(null);
                        loadMaterials();
                    }}
                />
            )}

            <ExportColumnPicker
                open={!!exportFormat}
                format={exportFormat}
                columns={EXPORT_COLUMNS}
                onCancel={() => setExportFormat(null)}
                onConfirm={(selectedKeys) => {
                    const format = exportFormat;
                    setExportFormat(null);
                    if (format === "excel") exportExcel(selectedKeys);
                    else exportPDF(selectedKeys);
                }}
            />
        </div>
    );
});

TableMaterials.displayName = "TableMaterials";

export default TableMaterials;