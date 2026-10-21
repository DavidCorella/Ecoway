namespace EcowayBackend.BC.Realtime
{
    // Nombres de grupo/entidad para las notificaciones en tiempo real,
    // compartidos entre los controllers (que avisan) y el front (que se
    // suscribe). Deben coincidir exactamente con las claves que usa el
    // hook useRealtimeRefresh en cada pantalla
    public static class DataEntities
    {
        public const string Materials = "materials";
        public const string Currency = "currency";
        public const string Classify = "classify";
        public const string Units = "units";
        public const string PhysicalStates = "physicalStates";
        public const string Companies = "companies";
        public const string Users = "users";
        public const string Permissions = "permissions";
        public const string Notifications = "notifications";
        public const string Tickets = "tickets";
        public const string ExitTickets = "exitTickets";
        public const string Quotations = "quotations";
        public const string Certificates = "certificates";
        public const string CollectionSummaries = "collectionSummaries";
        public const string AuditLogs = "auditLogs";
        public const string ErrorLogs = "errorLogs";
    }
}
