namespace EcowayBackend.BC
{
    // Todo lo que es timestamp real (created_at, updated_at, bloqueos por
    // intentos fallidos, etc.) usa DateTime.UtcNow y se guarda en UTC.
    // Pero el numero sugerido de cotizaciones/certificados/resumenes
    // (ej. "5-26") usa el año calendario, y ese si tiene que ser el año
    // en Costa Rica, no en UTC: cerca de medianoche UTC ya seria un dia
    // (o un año) distinto al que ve el usuario en su pantalla
    public static class CostaRicaTime
    {
        // Costa Rica no usa horario de verano, el offset es fijo todo el año
        private static readonly TimeSpan Offset = TimeSpan.FromHours(-6);

        public static DateTime Now => DateTime.UtcNow + Offset;
    }
}
