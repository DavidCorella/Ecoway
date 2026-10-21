using System.Linq.Expressions;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;
using EcowayBackend.DA.Config.Materials;
using EcowayBackend.DA.Config.Tickets;
using EcowayBackend.DA.Entities.Tickets;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Tickets
{
    public class ExitTicketClassDA : ExitTicketInterfaceClassDA
    {
        private readonly TicketsContext _context;

        // Materiales vive en su propio contexto/dominio, pero es la misma
        // base de datos: se usa solo para traer el maximo de dias de
        // gestion de cada material y armar el filtro "Solo vencidos"
        private readonly MaterialsContext _materialsContext;

        public ExitTicketClassDA(TicketsContext context, MaterialsContext materialsContext)
        {
            _context = context;
            _materialsContext = materialsContext;
        }

        // Un acta esta completada cuando esta activa y ya se gestionaron
        // todos sus materiales. Va como Expression (no Func) para que EF
        // Core la pueda traducir a SQL al filtrar por "Procesada"
        private static readonly Expression<Func<ExitTicketEntityDA, bool>> IsFullyManaged = t =>
            t.status == "Active" && t.Items.Any() && t.Items.All(i => i.management_date != null);

        private IQueryable<ExitTicketResponse> Projected(IQueryable<ExitTicketEntityDA> source)
        {
            return source
                .Include(t => t.DestinationCompany)
                .Include(t => t.Items)
                .Select(t => new ExitTicketResponse
                {
                    id = t.id,
                    exit_ticket_number = t.exit_ticket_number,
                    destination_company_id = t.destination_company_id,
                    // Si la empresa tiene proyecto se muestra "Nombre - Proyecto"
                    destination_company_name = string.IsNullOrEmpty(t.DestinationCompany!.project)
                        ? t.DestinationCompany.nombre_comercial
                        : t.DestinationCompany.nombre_comercial + " — " + t.DestinationCompany.project,
                    exit_date = t.exit_date,
                    receiver_responsible_name = t.receiver_responsible_name,
                    receiver_responsible_id = t.receiver_responsible_id,
                    ecoway_responsible_name = t.ecoway_responsible_name,
                    ecoway_responsible_id = t.ecoway_responsible_id,
                    image_path = t.image_path,
                    status = t.status,
                    void_reason = t.void_reason,
                    version = t.version,
                    created_at = t.created_at,
                    updated_at = t.updated_at,
                    total_kg = t.Items.Sum(i => (decimal?)i.quantity_kg) ?? 0,
                    items = t.Items.Select(i => new ExitTicketItemResponse
                    {
                        id = i.id,
                        material_description = i.material_description,
                        quantity_kg = i.quantity_kg,
                        physical_state = i.physical_state,
                        management_date = i.management_date
                    }).ToList()
                });
        }

        public async Task<PagedResult<ExitTicketResponse>> getExitTickets(
            string? search, string? status, string? processed,
            DateTime? dateFrom, DateTime? dateTo, int page, int pageSize)
        {
            var query = _context.ExitTickets.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(t =>
                    t.exit_ticket_number.Contains(term) ||
                    t.DestinationCompany!.nombre_comercial.Contains(term) ||
                    // tambien busca por el numero de la(s) acta(s) de entrada
                    // de donde salio el material de esta acta de salida
                    t.Items.Any(i => _context.MaterialAllocations.Any(a =>
                        a.exit_ticket_item_id == i.id &&
                        a.TicketItem!.Ticket!.ticket_number.Contains(term))));
            }

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.status == status);

            if (dateFrom.HasValue)
                query = query.Where(t => t.exit_date >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(t => t.exit_date <= dateTo.Value);

            if (processed == "done")
                query = query.Where(IsFullyManaged);
            else if (processed == "pending")
                query = query.Where(t => !(t.status == "Active" && t.Items.Any() && t.Items.All(i => i.management_date != null)));

            var totalCount = await query.CountAsync();

            var items = await Projected(query)
                .OrderByDescending(t => t.created_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<ExitTicketResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        public async Task<ExitTicketResponse?> getExitTicketById(Guid id)
        {
            var response = await Projected(_context.ExitTickets).FirstOrDefaultAsync(t => t.id == id);
            if (response == null) return null;

            await AttachSources(response);
            return response;
        }

        // De cuales actas de entrada (y cuanto de cada una) salio el
        // material de cada linea del acta. Se arma aparte de Projected,
        // no en el listado paginado, para no cargar este detalle donde no
        // hace falta (una fila del listado no necesita el desglose completo)
        private async Task AttachSources(ExitTicketResponse response)
        {
            var itemIds = response.items.Select(i => i.id).ToList();
            if (itemIds.Count == 0) return;

            var allocations = await _context.MaterialAllocations
                .Where(a => itemIds.Contains(a.exit_ticket_item_id))
                .Select(a => new
                {
                    a.exit_ticket_item_id,
                    a.quantity_kg,
                    ticket_id = a.TicketItem!.Ticket!.id,
                    ticket_number = a.TicketItem.Ticket.ticket_number,
                    ticket_date = a.TicketItem.Ticket.ticket_date,
                    company_name = a.TicketItem.Ticket.Company!.nombre_comercial
                })
                .ToListAsync();

            var byItem = allocations
                .GroupBy(a => a.exit_ticket_item_id)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var item in response.items)
            {
                if (!byItem.TryGetValue(item.id, out var itemAllocations)) continue;

                item.sources = itemAllocations
                    .OrderBy(a => a.ticket_date)
                    .Select(a => new MaterialAllocationSourceResponse
                    {
                        ticket_id = a.ticket_id,
                        ticket_number = a.ticket_number,
                        ticket_date = a.ticket_date,
                        company_name = a.company_name,
                        quantity_kg = a.quantity_kg
                    })
                    .ToList();
            }
        }

        // Calcula como reservar quantityKg del material indicado, tomando
        // primero de las actas de entrada mas viejas (FIFO por fecha de
        // acta). No toca el context todavia (solo arma la lista de
        // reservas a crear): asi, si alguna linea de la acta no alcanza,
        // no queda nada "a medias" trackeado por EF que despues se
        // guarde por accidente en otro SaveChanges. pendingConsumed lleva
        // lo que ya se planeo reservar en llamadas anteriores DENTRO de
        // la misma operacion (para que dos lineas del mismo material en
        // una sola acta de salida no se pisen entre si). Devuelve cuanto
        // falto reservar (0 si alcanzo para todo) y las reservas a crear
        private async Task<(decimal missing, List<MaterialAllocationEntityDA> allocations)> PlanAllocation(
            string materialDescription, decimal quantityKg, Guid exitTicketItemId,
            Dictionary<Guid, decimal> pendingConsumed)
        {
            // El disponible de cada linea ya descuenta lo procesado a
            // mano: puede ser parcial, asi que una linea con parte
            // procesada sigue entrando aca por el saldo que le queda
            var candidates = await _context.TicketItems
                .Include(i => i.Ticket)
                .Where(i => i.material_description == materialDescription && i.Ticket!.status == "Active")
                .OrderBy(i => i.Ticket!.ticket_date)
                .ThenBy(i => i.Ticket!.created_at)
                .ToListAsync();

            var allocations = new List<MaterialAllocationEntityDA>();

            if (candidates.Count == 0)
                return (quantityKg, allocations);

            var ids = candidates.Select(c => c.id).ToList();
            var savedConsumed = await _context.MaterialAllocations
                .Where(a => ids.Contains(a.ticket_item_id))
                .GroupBy(a => a.ticket_item_id)
                .Select(g => new { g.Key, Consumed = g.Sum(a => a.quantity_kg) })
                .ToDictionaryAsync(x => x.Key, x => x.Consumed);

            var savedProcessed = await _context.TicketItemProcessings
                .Where(p => ids.Contains(p.ticket_item_id))
                .GroupBy(p => p.ticket_item_id)
                .Select(g => new { g.Key, Processed = g.Sum(p => p.quantity_kg) })
                .ToDictionaryAsync(x => x.Key, x => x.Processed);

            var remaining = quantityKg;

            foreach (var item in candidates)
            {
                if (remaining <= 0) break;

                var already = (savedConsumed.TryGetValue(item.id, out var saved) ? saved : 0)
                    + (pendingConsumed.TryGetValue(item.id, out var pending) ? pending : 0)
                    + (savedProcessed.TryGetValue(item.id, out var processed) ? processed : 0);
                var available = item.quantity_kg - already;
                if (available <= 0) continue;

                var take = Math.Min(available, remaining);

                allocations.Add(new MaterialAllocationEntityDA
                {
                    ticket_item_id = item.id,
                    exit_ticket_item_id = exitTicketItemId,
                    quantity_kg = take
                });

                pendingConsumed[item.id] = (pendingConsumed.TryGetValue(item.id, out var p) ? p : 0) + take;
                remaining -= take;
            }

            return (remaining, allocations);
        }

        public async Task<(ExitTicketResponse? exitTicket, string? error)> createExitTicket(ExitTicketInput input, Guid? actorId)
        {
            var entity = new ExitTicketEntityDA
            {
                exit_ticket_number = input.exit_ticket_number,
                destination_company_id = input.destination_company_id,
                exit_date = input.exit_date,
                receiver_responsible_name = input.receiver_responsible_name,
                receiver_responsible_id = input.receiver_responsible_id,
                ecoway_responsible_name = input.ecoway_responsible_name,
                ecoway_responsible_id = input.ecoway_responsible_id,
                image_path = input.image_path,
                status = "Active",
                version = 1,
                created_by = actorId,
                Items = input.items.Select(i => new ExitTicketItemEntityDA
                {
                    material_description = i.material_description,
                    quantity_kg = i.quantity_kg,
                    physical_state = i.physical_state
                }).ToList()
            };

            // Calcula la reserva de cada linea contra el inventario de
            // entrada antes de tocar el context. Si alguna no alcanza, se
            // corta sin haber agregado nada todavia
            var pendingConsumed = new Dictionary<Guid, decimal>();
            var allAllocations = new List<MaterialAllocationEntityDA>();

            foreach (var item in entity.Items)
            {
                var (missing, allocations) = await PlanAllocation(item.material_description, item.quantity_kg, item.id, pendingConsumed);
                if (missing > 0)
                {
                    var available = item.quantity_kg - missing;
                    return (null, $"No hay suficiente \"{item.material_description}\" disponible en el inventario de entrada. Disponible: {available:0.##} kg, solicitado: {item.quantity_kg:0.##} kg.");
                }
                allAllocations.AddRange(allocations);
            }

            await _context.ExitTickets.AddAsync(entity);
            await _context.MaterialAllocations.AddRangeAsync(allAllocations);
            await _context.SaveChangesAsync();

            return (await getExitTicketById(entity.id), null);
        }

        // El material y la cantidad de cada linea ya NO se pueden editar
        // despues de creada el acta: una vez reservado el inventario de
        // entrada, cambiar los kilos despues podia fallar si el material
        // de origen ya se habia marcado como procesado mientras tanto. Si
        // hace falta corregir el material, se anula esta acta y se crea
        // una nueva. Por eso editar ya no toca items ni MaterialAllocations
        // Libera hasta releaseAmount kg de estas reservas, empezando por
        // las mas recientes (las mas viejas quedan intactas si alcanza
        // con liberar solo las nuevas). Se usa cuando se baja la cantidad
        // de una linea al editar una acta de salida: el material liberado
        // vuelve a quedar disponible en el inventario de entrada
        private void ReleaseAllocations(List<MaterialAllocationEntityDA> allocationsNewestFirst, decimal releaseAmount)
        {
            foreach (var alloc in allocationsNewestFirst)
            {
                if (releaseAmount <= 0) break;

                if (alloc.quantity_kg <= releaseAmount)
                {
                    releaseAmount -= alloc.quantity_kg;
                    _context.MaterialAllocations.Remove(alloc);
                }
                else
                {
                    alloc.quantity_kg -= releaseAmount;
                    releaseAmount = 0;
                }
            }
        }

        public async Task<(bool ok, string? error)> editExitTicket(ExitTicketInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador del acta.");

            // Mismo motivo que reactivateExitTicket: el contexto tiene
            // EnableRetryOnFailure, hay que envolver todo con
            // CreateExecutionStrategy para poder abrir una transaccion a
            // mano. Hace falta una transaccion real (no un solo
            // SaveChanges) porque primero se liberan kilos que ya no
            // hacen falta y despues se reservan los que se agregaron, y
            // si lo segundo falla no debe quedar aplicado lo primero
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                var exitTicket = await _context.ExitTickets.FirstOrDefaultAsync(t => t.id == input.id);

                // Si el acta ya esta anulada no se puede editar
                if (exitTicket == null || exitTicket.status != "Active")
                {
                    await transaction.RollbackAsync();
                    return (false, "El acta no existe o ya fue anulada — no se puede editar.");
                }

                exitTicket.exit_ticket_number = input.exit_ticket_number;
                exitTicket.destination_company_id = input.destination_company_id;
                exitTicket.exit_date = input.exit_date;
                exitTicket.receiver_responsible_name = input.receiver_responsible_name;
                exitTicket.receiver_responsible_id = input.receiver_responsible_id;
                exitTicket.ecoway_responsible_name = input.ecoway_responsible_name;
                exitTicket.ecoway_responsible_id = input.ecoway_responsible_id;

                if (!string.IsNullOrWhiteSpace(input.image_path))
                    exitTicket.image_path = input.image_path;

                // Los items se reconcilian por material + estado fisico,
                // igual que en las actas de entrada
                var oldItems = await _context.ExitTicketItems
                    .Where(i => i.exit_ticket_id == exitTicket.id)
                    .ToListAsync();

                bool SameLine(ExitTicketItemEntityDA o, ExitTicketItemInput itemInput) =>
                    string.Equals(o.material_description, itemInput.material_description, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(o.physical_state ?? "", itemInput.physical_state ?? "", StringComparison.OrdinalIgnoreCase);

                // FASE 1: bajar cantidad o quitar lineas — libera de vuelta
                // al inventario de entrada lo que ya no hace falta. Una
                // linea ya marcada como gestionada queda inmutable (el
                // destino ya confirmo que la recibio con esos kilos)
                foreach (var old in oldItems)
                {
                    var itemInput = input.items.FirstOrDefault(i => SameLine(old, i));

                    if (itemInput == null)
                    {
                        // se quito del todo
                        if (old.management_date != null)
                        {
                            await transaction.RollbackAsync();
                            return (false, $"No se puede quitar \"{old.material_description}\": ya fue marcado como gestionado.");
                        }

                        var allocs = await _context.MaterialAllocations
                            .Where(a => a.exit_ticket_item_id == old.id)
                            .ToListAsync();
                        _context.MaterialAllocations.RemoveRange(allocs);
                        _context.ExitTicketItems.Remove(old);
                        continue;
                    }

                    if (itemInput.quantity_kg < old.quantity_kg)
                    {
                        if (old.management_date != null)
                        {
                            await transaction.RollbackAsync();
                            return (false, $"No se puede modificar \"{old.material_description}\": ya fue marcado como gestionado.");
                        }

                        var releaseAmount = old.quantity_kg - itemInput.quantity_kg;
                        var allocs = await _context.MaterialAllocations
                            .Where(a => a.exit_ticket_item_id == old.id)
                            .OrderByDescending(a => a.created_at)
                            .ToListAsync();
                        ReleaseAllocations(allocs, releaseAmount);
                        old.quantity_kg = itemInput.quantity_kg;
                    }
                }

                // Se guarda antes de planear los aumentos: asi el material
                // recien liberado arriba ya cuenta como disponible
                await _context.SaveChangesAsync();

                // FASE 2: lineas nuevas o que suben de cantidad — reservan
                // por FIFO lo que haga falta, igual que al crear el acta
                var pendingConsumed = new Dictionary<Guid, decimal>();

                foreach (var itemInput in input.items)
                {
                    var old = oldItems.FirstOrDefault(o => SameLine(o, itemInput));

                    if (old != null)
                    {
                        if (itemInput.quantity_kg <= old.quantity_kg)
                            continue; // ya se manejo en la fase 1 (bajo o quedo igual)

                        if (old.management_date != null)
                        {
                            await transaction.RollbackAsync();
                            return (false, $"No se puede modificar \"{old.material_description}\": ya fue marcado como gestionado.");
                        }

                        var addAmount = itemInput.quantity_kg - old.quantity_kg;
                        var (missing, allocations) = await PlanAllocation(itemInput.material_description, addAmount, old.id, pendingConsumed);
                        if (missing > 0)
                        {
                            await transaction.RollbackAsync();
                            return (false, $"No hay suficiente \"{itemInput.material_description}\" disponible para aumentar esta línea. Faltan {missing:0.##} kg.");
                        }

                        old.quantity_kg = itemInput.quantity_kg;
                        await _context.MaterialAllocations.AddRangeAsync(allocations);
                    }
                    else
                    {
                        var newItem = new ExitTicketItemEntityDA
                        {
                            exit_ticket_id = exitTicket.id,
                            material_description = itemInput.material_description,
                            quantity_kg = itemInput.quantity_kg,
                            physical_state = itemInput.physical_state
                        };
                        await _context.ExitTicketItems.AddAsync(newItem);

                        var (missing, allocations) = await PlanAllocation(itemInput.material_description, itemInput.quantity_kg, newItem.id, pendingConsumed);
                        if (missing > 0)
                        {
                            await transaction.RollbackAsync();
                            return (false, $"No hay suficiente \"{itemInput.material_description}\" disponible. Faltan {missing:0.##} kg.");
                        }

                        await _context.MaterialAllocations.AddRangeAsync(allocations);
                    }
                }

                exitTicket.version += 1;
                exitTicket.updated_at = DateTime.UtcNow;

                var result = await _context.SaveChangesAsync();
                if (result <= 0)
                {
                    await transaction.RollbackAsync();
                    return (false, "No fue posible actualizar el acta.");
                }

                await transaction.CommitAsync();
                return (true, (string?)null);
            });
        }

        public async Task<(bool ok, string? error)> voidExitTicket(VoidExitTicketInput input)
        {
            var exitTicket = await _context.ExitTickets.FirstOrDefaultAsync(t => t.id == input.id);

            if (exitTicket == null || exitTicket.status != "Active")
                return (false, "El acta no existe o ya fue anulada.");

            var items = await _context.ExitTicketItems
                .Where(i => i.exit_ticket_id == exitTicket.id)
                .ToListAsync();

            // Si ya se marco como gestionada al menos una linea, el
            // material ya se confirmo que salio/se proceso: a partir de
            // ahi el acta queda inmutable y no se puede anular (liberar la
            // reserva devolveria al inventario algo que ya no esta)
            if (items.Any(i => i.management_date != null))
                return (false, "No se puede anular: ya hay material de esta acta marcado como gestionado.");

            exitTicket.status = "Voided";
            exitTicket.void_reason = input.reason;
            exitTicket.updated_at = DateTime.UtcNow;

            // Libera el material reservado de esta acta: vuelve a quedar
            // disponible en el inventario de entrada
            var itemIds = items.Select(i => i.id).ToList();
            var allocations = await _context.MaterialAllocations
                .Where(a => itemIds.Contains(a.exit_ticket_item_id))
                .ToListAsync();
            _context.MaterialAllocations.RemoveRange(allocations);

            var result = await _context.SaveChangesAsync();
            return (result > 0, result > 0 ? null : "No fue posible anular el acta.");
        }

        public async Task<(bool ok, string? error)> reactivateExitTicket(Guid id)
        {
            var exitTicket = await _context.ExitTickets
                .Include(t => t.Items)
                .FirstOrDefaultAsync(t => t.id == id);

            if (exitTicket == null || exitTicket.status != "Voided")
                return (false, "El acta no existe o no está anulada.");

            // El contexto tiene EnableRetryOnFailure, que activa una
            // execution strategy que no permite abrir una transaccion "a
            // mano" con BeginTransactionAsync directo (tira "does not
            // support user-initiated transactions"). Hay que envolver toda
            // la operacion con CreateExecutionStrategy para que el reintento
            // (si hace falta) incluya la transaccion completa
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                // Al anularse se liberaron las reservas, hay que volver a
                // reservar todo. Puede fallar si otra acta ya se llevo ese
                // material mientras tanto
                var pendingConsumed = new Dictionary<Guid, decimal>();
                var allAllocations = new List<MaterialAllocationEntityDA>();

                foreach (var item in exitTicket.Items)
                {
                    var (missing, allocations) = await PlanAllocation(item.material_description, item.quantity_kg, item.id, pendingConsumed);
                    if (missing > 0)
                    {
                        await transaction.RollbackAsync();
                        var available = item.quantity_kg - missing;
                        return (false, $"No se puede reactivar: ya no hay suficiente \"{item.material_description}\" disponible en el inventario de entrada. Disponible: {available:0.##} kg, se necesitan: {item.quantity_kg:0.##} kg.");
                    }
                    allAllocations.AddRange(allocations);
                }

                exitTicket.status = "Active";
                exitTicket.void_reason = null;
                exitTicket.updated_at = DateTime.UtcNow;

                await _context.MaterialAllocations.AddRangeAsync(allAllocations);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return (true, (string?)null);
            });
        }

        // Estado de gestion por material, para la pantalla de Estado de
        // actas de salida. Se muestra un renglon por cada material de
        // cada acta activa, con la info del acta al lado. Las actas
        // anuladas no se muestran aca
        public async Task<PagedResult<ExitTicketItemManagementResponse>> getExitTicketItemsManagement(
            string? search, string? management, int? minDays, bool onlyOverdue, int page, int pageSize)
        {
            var query = _context.ExitTicketItems
                .Include(i => i.ExitTicket)
                .ThenInclude(t => t!.DestinationCompany)
                .Where(i => i.ExitTicket!.status == "Active");

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(i =>
                    i.ExitTicket!.exit_ticket_number.Contains(term) ||
                    i.ExitTicket.DestinationCompany!.nombre_comercial.Contains(term) ||
                    i.material_description.Contains(term));
            }

            if (management == "done")
                query = query.Where(i => i.management_date != null);
            else if (management == "pending")
                query = query.Where(i => i.management_date == null);

            var rawItems = await query
                .Select(i => new ExitTicketItemManagementResponse
                {
                    id = i.id,
                    exit_ticket_id = i.exit_ticket_id,
                    exit_ticket_number = i.ExitTicket!.exit_ticket_number,
                    destination_company_name = string.IsNullOrEmpty(i.ExitTicket.DestinationCompany!.project)
                        ? i.ExitTicket.DestinationCompany.nombre_comercial
                        : i.ExitTicket.DestinationCompany.nombre_comercial + " — " + i.ExitTicket.DestinationCompany.project,
                    exit_date = i.ExitTicket.exit_date,
                    receiver_responsible_name = i.ExitTicket.receiver_responsible_name,
                    receiver_responsible_id = i.ExitTicket.receiver_responsible_id,
                    ecoway_responsible_name = i.ExitTicket.ecoway_responsible_name,
                    ecoway_responsible_id = i.ExitTicket.ecoway_responsible_id,
                    image_path = i.ExitTicket.image_path,
                    material_description = i.material_description,
                    quantity_kg = i.quantity_kg,
                    physical_state = i.physical_state,
                    management_date = i.management_date
                })
                .ToListAsync();

            // Materials vive en otro contexto (mismo servidor, misma base).
            // Se trae aparte, por descripcion exacta, para el plazo de cada
            // material (usado en el filtro "Solo vencidos")
            var descriptions = rawItems.Select(i => i.material_description).Distinct().ToList();

            var maxDaysByDescription = await _materialsContext.Materials
                .Where(m => descriptions.Contains(m.Description_Material))
                .Select(m => new { m.Description_Material, m.max_management_days })
                .ToDictionaryAsync(m => m.Description_Material, m => m.max_management_days);

            foreach (var item in rawItems)
            {
                if (maxDaysByDescription.TryGetValue(item.material_description, out var maxDays))
                    item.max_management_days = maxDays;
            }

            IEnumerable<ExitTicketItemManagementResponse> mapped = rawItems;

            // Dias restantes hasta el plazo del material (fecha de salida +
            // plazo del catalogo), tomando como referencia la fecha en que
            // se gestiono si ya se marco, o ahora si sigue pendiente. Null
            // si el material no tiene plazo definido — nunca entra en
            // estos dos filtros
            int? DaysRemaining(ExitTicketItemManagementResponse x) =>
                x.max_management_days.HasValue
                    ? (x.exit_date.Date.AddDays(x.max_management_days.Value) - (x.management_date ?? DateTime.UtcNow).Date).Days
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
                .OrderByDescending(i => i.exit_date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<ExitTicketItemManagementResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        // Una sola vez: si el material ya tiene fecha de gestion no se
        // vuelve a tocar. Tampoco se puede gestionar un material de un
        // acta que ya esta anulada
        public async Task<bool> markItemAsManaged(Guid itemId)
        {
            var item = await _context.ExitTicketItems
                .Include(i => i.ExitTicket)
                .FirstOrDefaultAsync(i => i.id == itemId);

            if (item == null || item.management_date != null || item.ExitTicket?.status != "Active")
                return false;

            item.management_date = DateTime.UtcNow;

            return await _context.SaveChangesAsync() > 0;
        }
    }
}
