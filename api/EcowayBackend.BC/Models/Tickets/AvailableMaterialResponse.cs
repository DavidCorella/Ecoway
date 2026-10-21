namespace EcowayBackend.BC.Models.Tickets
{
    // Cuanto queda disponible de un material en el inventario de entrada:
    // la suma de lo recolectado en actas de entrada activas, menos lo ya
    // reservado en actas de salida. Se usa al armar una acta de salida,
    // para no poder sacar mas de lo que hay
    public class AvailableMaterialResponse
    {
        public string material_description { get; set; }
        public decimal available_kg { get; set; }

        // Estado fisico de la boleta de entrada mas vieja con disponible
        // (la que se va a consumir primero). Se saca de ahi y no del
        // catalogo de materiales porque el material de una acta puede no
        // tener (o ya no tener) una ficha exacta en el catalogo
        public string? physical_state { get; set; }
    }
}
