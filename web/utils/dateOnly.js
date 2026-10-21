// Campos como ticket_date, exit_date, quotation_date, certificate_date_from
// / _to, date_from / date_to, etc. son fechas-sin-hora: representan un dia
// del calendario, nunca un instante puntual. El backend las guarda como
// medianoche y el navegador las recibe con sufijo "Z" (UTC). Si se hacen
// pasar por `new Date(valor).toLocaleDateString()` directo, el navegador
// las convierte a la hora LOCAL — en Costa Rica (UTC-6) la medianoche UTC
// cae en la tarde del dia anterior, y la fecha se ve un dia antes de la
// real. Estas dos funciones evitan esa conversion de zona horaria: leen
// solo la parte de fecha del string y arman un Date en hora local, para
// que el dia mostrado sea siempre el mismo que se guardo.
//
// Ojo: esto es solo para fechas-sin-hora. Timestamps reales (created_at,
// processed_at, management_date) SI deben pasar por conversion de zona
// horaria normal, porque ahi la hora del dia importa.

export function parseDateOnly(value) {
  if (!value) return null;
  const datePart = String(value).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return null;

  const [, year, month, day] = match;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateOnly(value, options) {
  const d = parseDateOnly(value);
  return d ? d.toLocaleDateString("es-CR", options) : "";
}
