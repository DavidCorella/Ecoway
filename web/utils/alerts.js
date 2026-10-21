import Swal from "sweetalert2";

export const showSuccess = (message) => {
return Swal.fire({
icon: "success",
title: "Éxito",
text: message,
timer: 2000,
showConfirmButton: false,
});
};

export const showError = (message) => {
return Swal.fire({
icon: "error",
title: "Error",
text: message,
});
};

export const showWarning = (message) => {
return Swal.fire({
icon: "warning",
title: "Advertencia",
text: message,
});
};

// options permite pisar puntualmente icon/iconHtml (por ejemplo, un
// emoji como icono en vez del warning por defecto) sin tocar el resto
// de las pantallas que ya usan showConfirm
export const showConfirm = (title, message, options = {}) => {
return Swal.fire({
title,
text: message,
icon: "warning",
showCancelButton: true,
confirmButtonColor: "#dc2626",
cancelButtonColor: "#6b7280",
confirmButtonText: "Aceptar",
cancelButtonText: "Cancelar",
reverseButtons: true,
...options,
});
};
