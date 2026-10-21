CREATE TABLE [dbo].[ExitTicketItems] (
    [id]                   UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [exit_ticket_id]       UNIQUEIDENTIFIER NOT NULL,
    [material_description] VARCHAR (200)    NOT NULL,
    [quantity_kg]          DECIMAL (18, 3)  NOT NULL,
    [physical_state]       VARCHAR (100)    NULL,
    [management_date]      DATETIME         NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_ExitTicketItems_ExitTickets] FOREIGN KEY ([exit_ticket_id]) REFERENCES [dbo].[ExitTickets] ([id])
);


GO

CREATE NONCLUSTERED INDEX [IX_ExitTicketItems_exit_ticket_id]
    ON [dbo].[ExitTicketItems]([exit_ticket_id] ASC);


GO

