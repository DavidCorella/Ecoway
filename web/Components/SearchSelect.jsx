"use client";

import { useState, useEffect, useRef } from "react";

// Las clases van completas porque Tailwind las necesita ver tal cual en el codigo
const ACCENT_STYLES = {
    materials: {
        focus: "focus:border-materials-strong focus:ring-materials/30",
        hover: "hover:bg-materials-soft",
    },
    entrada: {
        focus: "focus:border-entrada-strong focus:ring-entrada/30",
        hover: "hover:bg-entrada-soft",
    },
    salida: {
        focus: "focus:border-salida-strong focus:ring-salida/30",
        hover: "hover:bg-salida-soft",
    },
    quotes: {
        focus: "focus:border-quotes-strong focus:ring-quotes/30",
        hover: "hover:bg-quotes-soft",
    },
    certs: {
        focus: "focus:border-certs-strong focus:ring-certs/30",
        hover: "hover:bg-certs-soft",
    },
    summary: {
        focus: "focus:border-summary-strong focus:ring-summary/30",
        hover: "hover:bg-summary-soft",
    },
};

export default function SearchSelect({
    label,
    placeholder = "Buscar...",
    options = [],
    value,
    onChange,
    error = "",
    valueField = "id",        // 👈 valor real (id, name_currency, etc)
    labelField = "name",      // 👈 texto que se busca y se ve en la lista
    displayField,             // 👈 texto que queda en el input tras elegir (por defecto, el mismo que labelField)
    accent = "materials"
}) {
    const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.materials;
    const shownField = displayField ?? labelField;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const containerRef = useRef(null);

    // sincroniza el valor externo con el texto visible
    useEffect(() => {

        const selected = options.find(
            x => x?.[valueField] === value
        );

        if (selected) {
            setSearch(selected?.[shownField] ?? "");
        }

    }, [value, options, valueField, shownField]);

    // Cierra el desplegable si se hace click fuera del componente
    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }

        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);

    }, []);

    // String(...) por si labelField viene undefined en alguna opcion
    const filteredOptions = options.filter(option =>
        String(option?.[labelField] ?? "")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    // Sirve para cualquier lista de opciones, no solo un catalogo en particular
    const handleSelect = (option) => {

        setSearch(option?.[shownField] ?? "");

        onChange(option?.[valueField]); // 👈 CLAVE GENÉRICA

        setOpen(false);

    };

    return (

        <div className="relative" ref={containerRef}>

            <label className="mb-2 block text-sm font-medium text-ink-dim">
                {label}
            </label>

            <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => {

                    setSearch(e.target.value);

                    onChange(""); // limpia selección

                    setOpen(true);

                }}
                onFocus={() => setOpen(true)}
                className={`
                    w-full
                    rounded-xl
                    border
                    bg-surface-2
                    px-4
                    py-3
                    text-sm
                    text-ink
                    outline-none
                    transition

                    ${error
                        ? "border-danger"
                        : `border-edge focus:bg-surface focus:ring-2 ${styles.focus}`
                    }
                `}
            />

            {error && (
                <p className="mt-1 text-sm text-danger">
                    {error}
                </p>
            )}

            {open && (

                <div className="
                    absolute
                    z-50
                    mt-2
                    max-h-60
                    w-full
                    overflow-auto
                    rounded-xl
                    border border-edge
                    bg-surface
                    shadow-xl
                ">

                    {filteredOptions.length > 0 ? (

                        filteredOptions.map((option) => (

                            <button
                                key={String(option?.[valueField] ?? option?.[labelField])}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={`
                                    block
                                    w-full
                                    px-4
                                    py-3
                                    text-left
                                    text-sm
                                    text-ink
                                    ${styles.hover}
                                `}
                            >
                                {option?.[labelField]}
                            </button>

                        ))

                    ) : (

                        <div className="px-4 py-3 text-sm text-ink-dim">
                            Sin resultados
                        </div>

                    )}

                </div>

            )}

        </div>

    );
}
