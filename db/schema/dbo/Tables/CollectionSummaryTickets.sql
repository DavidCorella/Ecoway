CREATE TABLE [dbo].[CollectionSummaryTickets] (
    [id]         UNIQUEIDENTIFIER DEFAULT (newid()) NOT NULL,
    [summary_id] UNIQUEIDENTIFIER NOT NULL,
    [ticket_id]  UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_CollectionSummaryTickets_Summaries] FOREIGN KEY ([summary_id]) REFERENCES [dbo].[CollectionSummaries] ([id]),
    CONSTRAINT [FK_CollectionSummaryTickets_Tickets] FOREIGN KEY ([ticket_id]) REFERENCES [dbo].[Tickets] ([id])
);


GO

