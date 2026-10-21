CREATE TABLE [dbo].[TicketItems] (
    [id]                   UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [ticket_id]            UNIQUEIDENTIFIER NOT NULL,
    [material_description] VARCHAR (200)    NOT NULL,
    [quantity_kg]          DECIMAL (18, 3)  NOT NULL,
    [physical_state]       VARCHAR (100)    NULL,
    [processed_at]         DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_TicketItems_Tickets] FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[Tickets] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_TicketItems_TicketId]
    ON [dbo].[TicketItems]([ticket_id] ASC);


GO

