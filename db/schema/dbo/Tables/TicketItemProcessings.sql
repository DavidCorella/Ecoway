CREATE TABLE [dbo].[TicketItemProcessings] (
    [id]             UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [ticket_item_id] UNIQUEIDENTIFIER NOT NULL,
    [quantity_kg]    DECIMAL (18, 3)  NOT NULL,
    [processed_at]   DATETIME         DEFAULT (getutcdate()) NOT NULL,
    [processed_by]   UNIQUEIDENTIFIER NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_TicketItemProcessings_TicketItems] FOREIGN KEY ([ticket_item_id]) REFERENCES [dbo].[TicketItems] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_TicketItemProcessings_TicketItemId]
    ON [dbo].[TicketItemProcessings]([ticket_item_id] ASC);


GO

