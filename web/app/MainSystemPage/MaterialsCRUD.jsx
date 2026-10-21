"use client";

import { useRef, useState } from "react";

import MaterialsTable from "../../Components/MaterialsTable";
import CurrencyInfo from "../../Components/ModalShowMoney";
import ModalUnits from "../../Components/ModalUnits";
import ModalClassify from "../../Components/ModalClassify";
import ModalPhysicalState from "../../Components/ModalPhysicalState";
import ModalCreateMaterial from "../../Components/ModalCreateMaterials";

export default function MaterialsCrud() {

  const tableRef = useRef(null);

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showClassifyModal, setShowClassifyModal] = useState(false);
  const [showPhysicalStateModal, setShowPhysicalStateModal] = useState(false);

  return (
    <div className="w-full">

      {/* ACCIONES */}
      <div className="flex flex-wrap justify-end gap-3 mb-6">

        <button onClick={() => setShowUnitsModal(true)} className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2">
          Unidades
        </button>

        <button onClick={() => setShowCurrencyModal(true)} className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2">
          Monedas
        </button>

        <button onClick={() => setShowClassifyModal(true)} className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2">
          Categoría de materiales
        </button>

        <button onClick={() => setShowPhysicalStateModal(true)} className="rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2">
          Estado físico
        </button>

        <button
          onClick={() => setShowMaterialModal(true)}
          className="rounded-xl bg-materials px-4 py-2.5 text-sm font-medium text-white transition hover:bg-materials-strong"
        >
          + Crear material
        </button>

      </div>

      {/* MODALES */}
      {showCurrencyModal && (
        <CurrencyInfo onClose={() => setShowCurrencyModal(false)} />
      )}

      {showUnitsModal && (
        <ModalUnits onClose={() => setShowUnitsModal(false)} />
      )}

      {showClassifyModal && (
        <ModalClassify onClose={() => setShowClassifyModal(false)} />
      )}

      {showPhysicalStateModal && (
        <ModalPhysicalState onClose={() => setShowPhysicalStateModal(false)} />
      )}

      {showMaterialModal && (
        <ModalCreateMaterial
          setShowModal={setShowMaterialModal}
          onSuccess={() => {
            setShowMaterialModal(false);
            tableRef.current?.reload();
          }}
        />
      )}

      {/* TABLA CON REF */}
      <MaterialsTable ref={tableRef} />

    </div>
  );
}