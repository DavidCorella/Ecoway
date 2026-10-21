CREATE TABLE [dbo].[MaterialAllocations] (
    [id]                  UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [ticket_item_id]      UNIQUEIDENTIFIER NOT NULL,
    [exit_ticket_item_id] UNIQUEIDENTIFIER NOT NULL,
    [quantity_kg]         DECIMAL (18, 3)  NOT NULL,
    [created_at]          DATETIME         DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_MaterialAllocations_ExitTicketItem] FOREIGN KEY ([exit_ticket_item_id]) REFERENCES [dbo].[ExitTicketItems] ([id]),
    CONSTRAINT [FK_MaterialAllocations_TicketItem] FOREIGN KEY ([ticket_item_id]) REFERENCES [dbo].[TicketItems] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_MaterialAllocations_exit_ticket_item_id]
    ON [dbo].[MaterialAllocations]([exit_ticket_item_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_MaterialAllocations_ticket_item_id]
    ON [dbo].[MaterialAllocations]([ticket_item_id] ASC);


GO

