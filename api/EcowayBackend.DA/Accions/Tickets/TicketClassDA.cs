using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;
using EcowayBackend.DA.Config.Materials;
using EcowayBackend.DA.Config.Tickets;
using EcowayBackend.DA.Entities.Tickets;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Tickets
{
    public class TicketClassDA : TicketInterfaceClassDA
    {
        private readonly TicketsContext _context;

        // Materiales vive en su propio contexto/dominio, pero es la misma
        // base de datos: se usa solo para traer el maximo de dias de
        // gestion de cada material y armar la cuenta regresiva
        private readonly MaterialsContext _materialsContext;

        public TicketClassDA(TicketsContext context, MaterialsContext materialsContext)
        {
            _context = context;
            _materialsContext = materialsContext;
        }

        private IQueryable<TicketResponse> Projected(IQueryable<TicketEntityDA> source)
        {
            return source
                .Include(t => t.Company)
                .Include(t => t.Items)
                .Select(t => new TicketResponse
                {
                    id = t.id,
                    ticket_number = t.ticket_number,
                    company_id = t.company_id,
                    // Si la empresa tiene proyecto se muestra "Nombre - Proyecto"
                    company_name = string.IsNullOrEmpty(t.Company!.project)
                        ? t.Company.nombre_comercial
                        : t.Company.nombre_comercial + " — " + t.Company.project,
                    ticket_date = t.ticket_date,
                    client_responsible_name = t.client_responsible_name,
                    client_responsible_id = t.client_responsible_id,
                    ecoway_responsible_name = t.ecoway_responsible_name,
                    ecoway_responsible_id = t.ecoway_responsible_id,
                    image_path = t.image_path,
                    freight_count = t.freight_count,
                    status = t.status,
                    void_reason = t.void_reason,
                    invoiced = t.invoiced,
                    version = t.version,
                    created_at = t.created_at,
                    updated_at = t.updated_at,
                    total_kg = t.Items.Sum(i => (decimal?)i.quantity_kg) ?? 0,
                    items = t.Items.Select(i => new TicketItemResponse
                    {
                        id = i.id,
                        material_description = i.material_description,
                        quantity_kg = i.quantity_kg,
                        physical_state = i.physical_state,
                        is_locked = _context.MaterialAllocations.Any(a => a.ticket_item_id == i.id)
                    }).ToList()
                });
        }

        // Sin paginar: lo usan Cotizaciones, Certificados y Resumen de
        // Recoleccion para armar sus propias listas de seleccion de
        // actas, donde hace falta ver todas las candidatas a la vez
        public async Task<List<TicketResponse>> getTickets()
        {
            return await Projected(_context.Tickets)
                .OrderByDescending(t => t.created_at)
                .ToListAsync();
        }

        public async Task<PagedResult<TicketResponse>> getTicketsPaged(
            string? search, string? status, bool? invoiced,
            DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            var query = _context.Tickets.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(t =>
                    t.ticket_number.Contains(term) ||
                    t.Company!.nombre_comercial.Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.status == status);

            if (dateFrom.HasValue)
                query = query.Where(t => t.ticket_date >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(t => t.ticket_date <= dateTo.Value);

            if (invoiced.HasValue)
                query = query.Where(t => t.invoiced == invoiced.Value);

            var totalCount = await query.CountAsync();

            var items = await Projected(query)
                .OrderByDescending(t => t.created_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<TicketResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<TicketResponse?> getTicketById(Guid id)
        {
            return await Projected(_context.Tickets).FirstOrDefaultAsync(t => t.id == id);
        }

        public async Task<TicketResponse?> createTicket(TicketInput input, Guid? actorId)
        {
            var entity = new TicketEntityDA
            {
                ticket_number = input.ticket_number,
                company_id = input.company_id,
                ticket_date = input.ticket_date,
                client_responsible_name = input.client_responsible_name,
                client_responsible_id = input.client_responsible_id,
                ecoway_responsible_name = input.ecoway_responsible_name,
                ecoway_responsible_id = input.ecoway_responsible_id,
                image_path = input.image_path,
                freight_count = input.freight_count,
                status = "Active",
                version = 1,
                created_by = actorId,
                Items = input.items.Select(i => new TicketItemEntityDA
                {
                    material_description = i.material_description,
                    quantity_kg = i.quantity_kg,
                    physical_state = i.physical_state
                }).ToList()
            };

            await _context.Tickets.AddAsync(entity);
            await _context.SaveChangesAsync();

            return await getTicketById(entity.id);
        }

        public async Task<(bool ok, string? error)> editTicket(TicketInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador del acta.");

            // No hace falta hacer Include de los items porque se borran y
            // se insertan de nuevo mas abajo
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.id == input.id);

            // Si el acta ya esta anulada no se puede editar
            if (ticket == null || ticket.status != "Active")
                return (false, "El acta no existe o ya fue anulada — no se puede editar.");

            ticket.ticket_number = input.ticket_number;
            ticket.company_id = input.company_id;
            ticket.ticket_date = input.ticket_date;
            ticket.client_responsible_name = input.client_responsible_name;
            ticket.client_responsible_id = input.client_responsible_id;
            ticket.ecoway_responsible_name = input.ecoway_responsible_name;
            ticket.ecoway_responsible_id = input.ecoway_responsible_id;

            if (!string.IsNullOrWhiteSpace(input.image_path))
                ticket.image_path = input.image_path;

            ticket.freight_count = input.freight_count;

            ticket.version += 1;
            ticket.updated_at = DateTime.UtcNow;

            // Los items se reconcilian por material + estado fisico en vez
            // de borrar todo y volver a insertar, para no perder la fecha
            // de gestion de un material que ya se habia marcado como
            // procesado. Si un material+estado ya no aparece en el nuevo
            // listado, ahi si se borra.
            var oldItems = await _context.TicketItems
                .Where(i => i.ticket_id == ticket.id)
                .ToListAsync();

            // Cuanto de cada linea ya esta "gastado": reservado en alguna
            // acta de salida, o procesado a mano (aunque sea parcial). Ese
            // gastado no se le puede quitar a la linea, solo sumarle
            var oldItemIds = oldItems.Select(i => i.id).ToList();
            var allocatedTotals = await _context.MaterialAllocations
                .Where(a => oldItemIds.Contains(a.ticket_item_id))
                .GroupBy(a => a.ticket_item_id)
                .Select(g => new { g.Key, Consumed = g.Sum(a => a.quantity_kg) })
                .ToDictionaryAsync(x => x.Key, x => x.Consumed);
            var processedTotals = await _context.TicketItemProcessings
                .Where(p => oldItemIds.Contains(p.ticket_item_id))
                .GroupBy(p => p.ticket_item_id)
                .Select(g => new { g.Key, Processed = g.Sum(p => p.quantity_kg) })
                .ToDictionaryAsync(x => x.Key, x => x.Processed);

            decimal UsedKg(Guid itemId) =>
                (allocatedTotals.TryGetValue(itemId, out var c) ? c : 0) +
                (processedTotals.TryGetValue(itemId, out var p) ? p : 0);

            var remainingOld = new List<TicketItemEntityDA>(oldItems);

            foreach (var itemInput in input.items)
            {
                var match = remainingOld.FirstOrDefault(o =>
                    string.Equals(o.material_description, itemInput.material_description, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(o.physical_state ?? "", itemInput.physical_state ?? "", StringComparison.OrdinalIgnoreCase));

                if (match != null)
                {
                    var usedKg = UsedKg(match.id);

                    // Bajar la cantidad no se permite si ya hay algo
                    // gastado de esa linea (reservado en una salida o
                    // procesado): para eso hay que anular el acta, asi no
                    // queda reservado/procesado mas de lo que en verdad
                    // tiene la acta
                    if (itemInput.quantity_kg < match.quantity_kg && usedKg > 0)
                        return (false, $"No se puede reducir \"{match.material_description}\": ya tiene {usedKg} kg reservados en actas de salida o procesados. Para reducirlo hay que anular el acta.");

                    // Si sube la cantidad y ya estaba completamente
                    // procesada, vuelve a quedar pendiente por el
                    // sobrante — el historial de lo ya procesado no se toca
                    if (itemInput.quantity_kg > match.quantity_kg && match.processed_at != null)
                        match.processed_at = null;

                    match.quantity_kg = itemInput.quantity_kg;
                    remainingOld.Remove(match);
                }
                else
                {
                    await _context.TicketItems.AddAsync(new TicketItemEntityDA
                    {
                        ticket_id = ticket.id,
                        material_description = itemInput.material_description,
                        quantity_kg = itemInput.quantity_kg,
                        physical_state = itemInput.physical_state
                    });
                }
            }

            // Lo que sobro ya no esta en el nuevo listado, pero si ya
            // tiene algo gastado (reservado en una salida o procesado) no
            // se puede quitar sin anular la acta primero
            var stillLocked = remainingOld.Where(i => UsedKg(i.id) > 0).ToList();
            if (stillLocked.Count > 0)
                return (false, "No se puede quitar un material que ya se sacó en una acta de salida o que ya se procesó. Para eso hay que anular el acta.");

            _context.TicketItems.RemoveRange(remainingOld);

            var result = await _context.SaveChangesAsync();
            return (result > 0, result > 0 ? null : "No fue posible actualizar el acta.");
        }

        public async Task<(bool ok, string? error)> voidTicket(VoidTicketInput input)
        {
            var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.id == input.id);

            if (ticket == null || ticket.status != "Active")
                return (false, "El acta no existe o ya fue anulada.");

            // Si algun material de esta acta ya se reservo en una acta de
            // salida activa, no se puede anular: la salida quedaria con
            // una reserva apuntando a una entrada anulada. Primero hay que
            // anular esa acta de salida (libera la reserva) y recien ahi
            // se puede anular esta entrada
            var itemIds = await _context.TicketItems
                .Where(i => i.ticket_id == ticket.id)
                .Select(i => i.id)
                .ToListAsync();

            var isLinked = await _context.MaterialAllocations
                .AnyAsync(a => itemIds.Contains(a.ticket_item_id));

            if (isLinked)
                return (false, "No se puede anular: ya se sacó material de esta acta en una acta de salida activa. Anulá primero esa acta de salida.");

            ticket.status = "Voided";
            ticket.void_reason = input.reason;
            ticket.updated_at = DateTime.UtcNow;

            var result = await _context.SaveChangesAsync();
            return (result > 0, result > 0 ? null : "No fue posible anular el acta.");
        }

        public async Task<bool> reactivateTicket(Guid id)
        {
            var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.id == id);

            if (ticket == null || ticket.status != "Voided")
                return false;

            ticket.status = "Active";
            ticket.void_reason = null;
            ticket.updated_at = DateTime.UtcNow;

            return await _context.SaveChangesAsync() > 0;
        }

        // Una sola vez: si el acta ya esta facturada no se vuelve a tocar.
        // Tampoco se puede facturar un acta anulada
        public async Task<bool> markTicketAsInvoiced(Guid id)
        {
            var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.id == id);

            if (ticket == null || ticket.invoiced || ticket.status != "Active")
                return false;

            ticket.invoiced = true;
            ticket.updated_at = DateTime.UtcNow;

            return await _context.SaveChangesAsync() > 0;
        }

        // Estado de gestion por material, para la pantalla de Estado de
        // actas de entrada. Se muestra un renglon por cada material de
        // cada acta activa, con la info del acta al lado. Las actas
        // anuladas no se muestran aca. El estado queda Procesada si se
        // marco a mano (processed_at) O si ya se saco todo el material en
        // actas de salida (consumed_kg >= quantity_kg) — un material se
        // puede procesar sin pasar por una boleta de salida formal, pero
        // si ya salio completo tampoco tiene sentido seguir mostrandolo
        // como pendiente
        public async Task<PagedResult<TicketItemManagementResponse>> getTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue, int page, int pageSize)
        {
            var itemsQuery = _context.TicketItems
                .Include(i => i.Ticket)
                .ThenInclude(t => t!.Company)
                .Where(i => i.Ticket!.status == "Active");

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                itemsQuery = itemsQuery.Where(i =>
                    i.Ticket!.ticket_number.Contains(term) ||
                    i.Ticket.Company!.nombre_comercial.Contains(term) ||
                    i.material_description.Contains(term));
            }

            var rawItems = await itemsQuery.ToListAsync();
            var itemIds = rawItems.Select(i => i.id).ToList();

            // Cuanto ya se saco en actas de salida: define el disponible
            // que se muestra, y tambien cuenta para el estado (Procesada
            // si se completo, aunque no se haya marcado a mano). Se trae
            // aparte (no en un solo LEFT JOIN con agregados: EF Core tira
            // "Nullable object must have a value" al traducirlo, SQL
            // Server devuelve NULL para los grupos sin match)
            var allocationTotals = await _context.MaterialAllocations
                .Where(a => itemIds.Contains(a.ticket_item_id))
                .GroupBy(a => a.ticket_item_id)
                .Select(g => new { TicketItemId = g.Key, Consumed = g.Sum(a => a.quantity_kg) })
                .ToDictionaryAsync(x => x.TicketItemId, x => x.Consumed);

            // Historial de procesamiento parcial, agrupado por linea. Se
            // trae completo (no solo la suma) porque tambien hace falta
            // para mostrar el detalle de cada corte
            var processingsByItem = (await _context.TicketItemProcessings
                    .Where(p => itemIds.Contains(p.ticket_item_id))
                    .OrderBy(p => p.processed_at)
                    .Select(p => new { p.ticket_item_id, p.id, p.quantity_kg, p.processed_at })
                    .ToListAsync())
                .GroupBy(p => p.ticket_item_id)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(p => new TicketItemProcessingResponse
                    {
                        id = p.id,
                        quantity_kg = p.quantity_kg,
                        processed_at = p.processed_at
                    }).ToList());

            // Materials vive en otro contexto (mismo servidor, misma base).
            // Se trae ANTES de filtrar/paginar (para todas las filas, no
            // solo la pagina visible), porque ahora tambien hace falta para
            // el filtro "Solo vencidos"
            var descriptions = rawItems.Select(i => i.material_description).Distinct().ToList();

            var maxDaysByDescription = await _materialsContext.Materials
                .Where(m => descriptions.Contains(m.Description_Material))
                .Select(m => new { m.Description_Material, m.max_management_days })
                .ToDictionaryAsync(m => m.Description_Material, m => m.max_management_days);

            IEnumerable<TicketItemManagementResponse> mapped = rawItems.Select(i =>
            {
                var consumed = allocationTotals.TryGetValue(i.id, out var c) ? c : 0m;
                var processings = processingsByItem.TryGetValue(i.id, out var pl) ? pl : new List<TicketItemProcessingResponse>();
                var processedKg = processings.Sum(p => p.quantity_kg);
                var isProcessed = i.processed_at != null || (consumed + processedKg) >= i.quantity_kg;
                var maxDays = maxDaysByDescription.TryGetValue(i.material_description, out var md) ? md : null;

                return new TicketItemManagementResponse
                {
                    id = i.id,
                    ticket_id = i.ticket_id,
                    ticket_number = i.Ticket!.ticket_number,
                    company_name = string.IsNullOrEmpty(i.Ticket.Company!.project)
                        ? i.Ticket.Company.nombre_comercial
                        : i.Ticket.Company.nombre_comercial + " — " + i.Ticket.Company.project,
                    ticket_date = i.Ticket.ticket_date,
                    client_responsible_name = i.Ticket.client_responsible_name,
                    client_responsible_id = i.Ticket.client_responsible_id,
                    ecoway_responsible_name = i.Ticket.ecoway_responsible_name,
                    ecoway_responsible_id = i.Ticket.ecoway_responsible_id,
                    image_path = i.Ticket.image_path,
                    material_description = i.material_description,
                    quantity_kg = i.quantity_kg,
                    physical_state = i.physical_state,
                    consumed_kg = consumed,
                    status = isProcessed ? "Procesada" : "Pendiente",
                    processed_at = i.processed_at,
                    processed_kg = processedKg,
                    processings = processings,
                    max_management_days = maxDays,
                };
            });

            if (management == "done")
                mapped = mapped.Where(x => x.status == "Procesada");
            else if (management == "pending")
                mapped = mapped.Where(x => x.status == "Pendiente");

            // Dias restantes hasta el plazo del material (fecha del acta +
            // plazo del catalogo), tomando como referencia la fecha en que
            // se proceso si ya se marco, o ahora si sigue pendiente. Null
            // si el material no tiene plazo definido en el catalogo — ese
            // material nunca entra en estos dos filtros
            int? DaysRemaining(TicketItemManagementResponse x) =>
                x.max_management_days.HasValue
                    ? (x.ticket_date.Date.AddDays(x.max_management_days.Value) - (x.processed_at ?? DateTime.UtcNow).Date).Days
                    : null;

            // El numero que se pasa es un techo de dias restantes: "X dias
            // o menos" (X puede ser negativo, para ver que tan vencido
            // esta). Con 4, por ejemplo, salen los que les quedan 4 dias,
            // menos, o ya vencidos
            if (minDays.HasValue)
            {
                mapped = mapped.Where(x => DaysRemaining(x) is int d && d <= minDays.Value);
            }

            // Vencido: ya paso el plazo (dias restantes negativos)
            if (onlyOverdue)
            {
                mapped = mapped.Where(x => DaysRemaining(x) is int d && d < 0);
            }

            var allMatching = mapped.ToList();
            var totalCount = allMatching.Count;

            var items = allMatching
                .OrderByDescending(x => x.ticket_date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<TicketItemManagementResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        // Cuanto queda disponible de cada material en el inventario de
        // entrada (recolectado en actas activas, menos lo ya reservado en
        // actas de salida). Se usa al armar una acta de salida
        public async Task<List<AvailableMaterialResponse>> getAvailableInventory()
        {
            // Ordenado por fecha de acta (FIFO): asi, dentro de cada grupo
            // por material, el primero con algo disponible es el que se
            // va a consumir primero, y de ahi se saca el estado fisico a
            // mostrar (no del catalogo de materiales, que puede no tener
            // una ficha exacta para lo que se recolecto). El disponible ya
            // descuenta lo procesado a mano (puede ser parcial: un
            // material puede tener parte procesada y el resto seguir
            // disponible para una acta de salida)
            var items = await _context.TicketItems
                .Include(i => i.Ticket)
                .Where(i => i.Ticket!.status == "Active")
                .OrderBy(i => i.Ticket!.ticket_date)
                .ThenBy(i => i.Ticket!.created_at)
                .Select(i => new { i.id, i.material_description, i.quantity_kg, i.physical_state })
                .ToListAsync();

            if (items.Count == 0)
                return new List<AvailableMaterialResponse>();

            var itemIds = items.Select(i => i.id).ToList();

            var allocations = await _context.MaterialAllocations
                .Where(a => itemIds.Contains(a.ticket_item_id))
                .GroupBy(a => a.ticket_item_id)
                .Select(g => new { g.Key, Consumed = g.Sum(a => a.quantity_kg) })
                .ToDictionaryAsync(x => x.Key, x => x.Consumed);

            var processed = await _context.TicketItemProcessings
                .Where(p => itemIds.Contains(p.ticket_item_id))
                .GroupBy(p => p.ticket_item_id)
                .Select(g => new { g.Key, Processed = g.Sum(p => p.quantity_kg) })
                .ToDictionaryAsync(x => x.Key, x => x.Processed);

            var result = new List<AvailableMaterialResponse>();

            foreach (var group in items.GroupBy(i => i.material_description))
            {
                decimal totalAvailable = 0;
                string? physicalState = null;

                // GroupBy conserva el orden original (ya viene por fecha)
                foreach (var item in group)
                {
                    var consumed = allocations.TryGetValue(item.id, out var c) ? c : 0;
                    var processedKg = processed.TryGetValue(item.id, out var p) ? p : 0;
                    var available = Math.Max(0, item.quantity_kg - consumed - processedKg);
                    if (available <= 0) continue;

                    totalAvailable += available;
                    physicalState ??= item.physical_state;
                }

                if (totalAvailable > 0)
                {
                    result.Add(new AvailableMaterialResponse
                    {
                        material_description = group.Key,
                        available_kg = totalAvailable,
                        physical_state = physicalState
                    });
                }
            }

            return result.OrderBy(m => m.material_description).ToList();
        }

        // Procesa una cantidad (puede ser parcial) de una linea. Se puede
        // llamar varias veces hasta completar quantity_kg — cada llamada
        // agrega un corte al historial. Es independiente de si el
        // material ya salio o no en una acta de salida (se puede procesar
        // sin pasar por una boleta formal), pero no se puede procesar mas
        // de lo que en verdad queda: quantity_kg menos lo ya procesado
        // menos lo ya reservado en actas de salida
        public async Task<(bool ok, string? error)> processItemQuantity(Guid itemId, decimal quantityKg, Guid? actorId)
        {
            if (quantityKg <= 0)
                return (false, "La cantidad a procesar debe ser mayor que cero.");

            var item = await _context.TicketItems
                .Include(i => i.Ticket)
                .FirstOrDefaultAsync(i => i.id == itemId);

            if (item == null)
                return (false, "El material no existe.");

            if (item.Ticket?.status != "Active")
                return (false, "El acta de este material está anulada.");

            if (item.processed_at != null)
                return (false, "Este material ya quedó completamente procesado.");

            var alreadyProcessed = await _context.TicketItemProcessings
                .Where(p => p.ticket_item_id == itemId)
                .SumAsync(p => (decimal?)p.quantity_kg) ?? 0;

            var alreadyConsumed = await _context.MaterialAllocations
                .Where(a => a.ticket_item_id == itemId)
                .SumAsync(a => (decimal?)a.quantity_kg) ?? 0;

            var remaining = item.quantity_kg - alreadyProcessed - alreadyConsumed;
            if (quantityKg > remaining)
                return (false, $"Solo quedan {remaining} kg disponibles para procesar de este material.");

            _context.TicketItemProcessings.Add(new TicketItemProcessingEntityDA
            {
                ticket_item_id = itemId,
                quantity_kg = quantityKg,
                processed_by = actorId
            });

            // Se completa (se congela la cuenta regresiva) cuando lo
            // procesado mas lo ya sacado en actas de salida llega al total
            if (alreadyProcessed + quantityKg + alreadyConsumed >= item.quantity_kg)
                item.processed_at = DateTime.UtcNow;

            var result = await _context.SaveChangesAsync();
            return (result > 0, result > 0 ? null : "No fue posible procesar el material.");
        }
    }
}
